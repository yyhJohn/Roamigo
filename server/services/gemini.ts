import { GoogleGenAI } from '@google/genai';
import {
  ItinerarySchema,
  type GenerateItineraryRequest,
  type Itinerary,
} from '../../src/lib/schemas.js';
import type { ServerConfig } from '../config.js';
import {
  ITINERARY_RESPONSE_SCHEMA,
  buildItineraryPrompt,
} from './prompt.js';

export class MissingCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingCredentialsError';
  }
}

export class UpstreamTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamTimeoutError';
  }
}

export class MalformedAiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedAiResponseError';
  }
}

export interface ItineraryGenerator {
  generate(input: GenerateItineraryRequest): Promise<Itinerary>;
}

function normalizeAiError(err: unknown): Error {
  if (
    err instanceof MissingCredentialsError ||
    err instanceof UpstreamTimeoutError ||
    err instanceof MalformedAiResponseError
  ) {
    return err;
  }

  if (err instanceof Error && err.name === 'AbortError') {
    return new UpstreamTimeoutError(
      'Gemini itinerary generation timed out. Please try again.',
    );
  }

  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? (err as { status?: unknown }).status
      : undefined;
  const msg = err instanceof Error ? err.message : String(err);
  if (
    status === 401 ||
    status === 403 ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('aiplatform.endpoints.predict') ||
    msg.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
    msg.includes('API_KEY_INVALID')
  ) {
    return new MissingCredentialsError(
      'Gemini credentials lack required permission (403/401). Provide a valid GEMINI_API_KEY in .env or grant Vertex AI prediction access (roles/aiplatform.user).',
    );
  }

  return err instanceof Error
    ? err
    : new Error('Failed to generate itinerary via Gemini.');
}

export function createGeminiGenerator(
  config: ServerConfig,
): ItineraryGenerator {
  return {
    async generate(input: GenerateItineraryRequest): Promise<Itinerary> {
      if (!config.geminiApiKey && !config.gcpProjectId) {
        throw new MissingCredentialsError(
          'Gemini is not configured on the server. Set GEMINI_API_KEY and GEMINI_MODEL in .env, or configure Vertex AI ADC with GCP_PROJECT_ID and GEMINI_MODEL.',
        );
      }

      if (!config.geminiModel) {
        throw new MissingCredentialsError(
          'GEMINI_MODEL is not configured on the server. Set GEMINI_MODEL in .env before generating.',
        );
      }

      const ai = config.geminiApiKey
        ? new GoogleGenAI({ apiKey: config.geminiApiKey })
        : new GoogleGenAI({
            vertexai: true,
            project: config.gcpProjectId,
            location: config.gcpLocation,
          });

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => {
        controller.abort();
      }, config.aiTimeoutMs);

      try {
        const response = await ai.models.generateContent({
          model: config.geminiModel,
          contents: buildItineraryPrompt(input),
          config: {
            responseMimeType: 'application/json',
            responseSchema: ITINERARY_RESPONSE_SCHEMA,
            abortSignal: controller.signal,
          },
        });

        const rawText = response.text;
        if (!rawText) {
          throw new MalformedAiResponseError(
            'Gemini returned an empty response. Please try again.',
          );
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch {
          throw new MalformedAiResponseError(
            'Gemini returned malformed JSON. Please try again.',
          );
        }

        const validated = ItinerarySchema.safeParse(parsedJson);
        if (!validated.success) {
          throw new MalformedAiResponseError(
            'Gemini returned an itinerary that failed schema validation.',
          );
        }

        return validated.data;
      } catch (err) {
        throw normalizeAiError(err);
      } finally {
        clearTimeout(timeoutHandle);
      }
    },
  };
}
