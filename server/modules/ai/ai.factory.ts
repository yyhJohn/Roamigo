import { resolveAiStatus, type ServerConfig } from '../../config.js';
import {
  MissingCredentialsError,
  type TravelAIProvider,
} from './ai.types.js';
import { createGeminiTravelProvider } from './providers/geminiProvider.js';
import {
  createOpenAiTravelProvider,
  type FetchLike,
} from './providers/openaiProvider.js';

export function createTravelAiProvider(
  config: ServerConfig,
  fetchImpl?: FetchLike,
): TravelAIProvider {
  const explicit = config.aiProvider?.trim().toLowerCase();
  const resolved = resolveAiStatus(config);

  if (explicit === 'openai-compatible' || resolved.provider === 'openai-compatible') {
    return createOpenAiTravelProvider(config, 'openai-compatible', fetchImpl);
  }
  if (explicit === 'openai' || resolved.provider === 'openai') {
    return createOpenAiTravelProvider(config, 'openai', fetchImpl);
  }
  if (explicit === 'vertex-ai' || resolved.provider === 'vertex-ai') {
    return createGeminiTravelProvider(config, 'vertex-ai');
  }
  if (explicit === 'gemini-api' || resolved.provider === 'gemini-api') {
    return createGeminiTravelProvider(config, 'gemini-api');
  }

  return {
    providerId: 'unconfigured',
    modelId: 'unconfigured',
    async generateWorkspaceItinerary() {
      throw new MissingCredentialsError(
        'AI provider is not configured on the server. Set AI_PROVIDER, AI_MODEL, and credentials in .env.',
      );
    },
    async proposeItineraryDiff() {
      throw new MissingCredentialsError(
        'AI provider is not configured on the server. Set AI_PROVIDER, AI_MODEL, and credentials in .env.',
      );
    },
  };
}
