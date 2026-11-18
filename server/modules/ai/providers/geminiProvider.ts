import { GoogleGenAI } from '@google/genai';
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

function parseAndValidate<T>(
  rawText: string | undefined,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): T {
  if (!rawText) {
    throw new MalformedAiResponseError('AI provider returned an empty response.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new MalformedAiResponseError('AI provider returned malformed JSON.');
  }
  const checked = schema.safeParse(parsed);
  if (!checked.success) {
    throw new MalformedAiResponseError(
      'AI response failed strict schema validation.',
    );
  }
  return checked.data;
}

function classifyGeminiError(err: unknown): Error {
  if (
    err instanceof MalformedAiResponseError ||
    err instanceof MissingCredentialsError ||
    err instanceof UpstreamTimeoutError ||
    err instanceof AiRateLimitedError
  ) {
    return err;
  }
  if (err instanceof Error && err.name === 'AbortError') {
    return new UpstreamTimeoutError('AI request timed out.');
  }
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? (err as { status?: unknown }).status
      : undefined;
  const msg = err instanceof Error ? err.message : String(err);
  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
    return new AiRateLimitedError();
  }
  if (
    status === 401 ||
    status === 403 ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
  ) {
    return new MissingCredentialsError(
      'Gemini credentials are missing or unauthorized (401/403).',
    );
  }
  return err instanceof Error ? err : new Error('Upstream Gemini failure.');
}

export function createGeminiTravelProvider(
  config: ServerConfig,
  mode: 'gemini-api' | 'vertex-ai',
): TravelAIProvider {
  const modelId = config.aiModel || config.geminiModel || '';
  const apiKey = config.aiApiKey || config.geminiApiKey;

  async function callJson<T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    callerSignal?: AbortSignal,
  ): Promise<T> {
    if (!modelId) {
      throw new MissingCredentialsError(
        'Set AI_MODEL or GEMINI_MODEL in .env before calling Gemini.',
      );
    }
    if (mode === 'gemini-api' && !apiKey) {
      throw new MissingCredentialsError('Set GEMINI_API_KEY or AI_API_KEY in .env.');
    }
    if (mode === 'vertex-ai' && !config.gcpProjectId) {
      throw new MissingCredentialsError('Set GCP_PROJECT_ID for Vertex AI.');
    }

    const client =
      mode === 'gemini-api'
        ? new GoogleGenAI({ apiKey })
        : new GoogleGenAI({
            vertexai: true,
            project: config.gcpProjectId,
            location: config.gcpLocation,
          });

    const controller = new AbortController();
    const onCallerAbort = () => controller.abort();
    callerSignal?.addEventListener('abort', onCallerAbort);
    const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);

    try {
      const response = await client.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
        },
      });
      return parseAndValidate(response.text, schema);
    } catch (err) {
      throw classifyGeminiError(err);
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', onCallerAbort);
    }
  }

  return {
    providerId: mode,
    modelId: modelId || 'unconfigured',
    generateWorkspaceItinerary: (input, signal) =>
      callJson(
        buildWorkspaceGenerationPrompt(input),
        AiWorkspaceItinerarySchema,
        signal,
      ),
    proposeItineraryDiff: (input, signal) =>
      callJson(buildAssistProposalPrompt(input), AiRawProposalSchema, signal),
  };
}
