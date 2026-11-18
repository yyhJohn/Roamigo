import type { z } from 'zod';
import {
  AiRawProposalSchema,
  AiWorkspaceItinerarySchema,
} from '../../../../src/lib/contracts/ai.schemas.js';
import type { ServerConfig } from '../../../config.js';
import {
  buildAssistProposalPrompt,
  buildWorkspaceGenerationPrompt,
} from '../ai.prompts.js';
import {
  AiRateLimitedError,
  MalformedAiResponseError,
  MissingCredentialsError,
  UpstreamTimeoutError,
  type TravelAIProvider,
} from '../ai.types.js';

export type FetchLike = typeof fetch;

interface ChatCompletionPayload {
  choices?: {
    message?: {
      content?: string | null;
    };
  }[];
}

export function createOpenAiTravelProvider(
  config: ServerConfig,
  mode: 'openai' | 'openai-compatible',
  fetchImpl: FetchLike = fetch,
): TravelAIProvider {
  const modelId = config.aiModel || config.geminiModel || '';
  const apiKey = config.aiApiKey || config.openaiApiKey;
  const baseUrl =
    mode === 'openai-compatible'
      ? config.aiBaseUrl?.replace(/\/+$/, '')
      : 'https://api.openai.com/v1';

  async function requestWithRetry<T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    callerSignal?: AbortSignal,
  ): Promise<T> {
    if (!modelId) {
      throw new MissingCredentialsError('Set AI_MODEL in .env.');
    }
    if (!baseUrl) {
      throw new MissingCredentialsError(
        'Set AI_BASE_URL in .env for openai-compatible provider.',
      );
    }
    if (mode === 'openai' && !apiKey) {
      throw new MissingCredentialsError(
        'Set OPENAI_API_KEY or AI_API_KEY in .env.',
      );
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const onCallerAbort = () => controller.abort();
      callerSignal?.addEventListener('abort', onCallerAbort);
      const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers.Authorization = `Bearer ${apiKey}`;
        }

        const res = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: modelId,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You are Roamigo, a structured travel planning engine. Output strictly valid JSON only.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if ((res.status === 429 || res.status === 503) && attempt === 0) {
          await new Promise((r) => setTimeout(r, 150));
          continue;
        }
        if (res.status === 429) {
          throw new AiRateLimitedError();
        }
        if (res.status === 401 || res.status === 403) {
          throw new MissingCredentialsError(
            'AI API key is invalid or unauthorized (401/403).',
          );
        }
        if (!res.ok) {
          throw new Error(`Upstream AI endpoint returned HTTP ${res.status}.`);
        }

        const body = (await res.json()) as ChatCompletionPayload;
        const content = body.choices?.[0]?.message?.content;
        if (!content) {
          throw new MalformedAiResponseError('AI returned empty message content.');
        }

        let jsonObj: unknown;
        try {
          jsonObj = JSON.parse(content);
        } catch {
          throw new MalformedAiResponseError('AI returned non-JSON content.');
        }

        const checked = schema.safeParse(jsonObj);
        if (!checked.success) {
          throw new MalformedAiResponseError(
            'AI JSON did not satisfy itinerary schema.',
          );
        }
        return checked.data;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new UpstreamTimeoutError('AI request timed out.');
        }
        throw err;
      } finally {
        clearTimeout(timer);
        callerSignal?.removeEventListener('abort', onCallerAbort);
      }
    }

    throw new AiRateLimitedError();
  }

  return {
    providerId: mode,
    modelId: modelId || 'unconfigured',
    generateWorkspaceItinerary: (input, signal) =>
      requestWithRetry(
        buildWorkspaceGenerationPrompt(input),
        AiWorkspaceItinerarySchema,
        signal,
      ),
    proposeItineraryDiff: (input, signal) =>
      requestWithRetry(buildAssistProposalPrompt(input), AiRawProposalSchema, signal),
  };
}
