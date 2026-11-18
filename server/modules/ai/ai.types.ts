import type {
  AiRawProposal,
  AiWorkspaceItinerary,
} from '../../../src/lib/contracts/ai.schemas.js';
import type { Currency } from '../../../src/lib/schemas.js';
import {
  MalformedAiResponseError,
  MissingCredentialsError,
  UpstreamTimeoutError,
} from '../../services/gemini.js';

export {
  MalformedAiResponseError,
  MissingCredentialsError,
  UpstreamTimeoutError,
};

export class AiRateLimitedError extends Error {
  constructor(message = 'AI provider rate limit reached. Please retry shortly.') {
    super(message);
    this.name = 'AiRateLimitedError';
  }
}

export interface MinimisedTravellerContext {
  displayName: string;
  budgetMinor: number;
  accommodationPref: string;
  transportPref: string;
  pace: string;
  dietaryOrAccess: string;
  interests: string[];
}

export interface CanonicalItineraryInput {
  destinations: string[];
  departureCity: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  currency: Currency;
  travellers: MinimisedTravellerContext[];
}

export interface CanonicalAssistInput {
  chosenDestination: string;
  currency: Currency;
  instruction: string;
  targetDayNumber?: number;
  travellers: MinimisedTravellerContext[];
  currentDays: AiWorkspaceItinerary['days'];
}

export interface TravelAIProvider {
  readonly providerId:
    | 'gemini-api'
    | 'vertex-ai'
    | 'openai'
    | 'openai-compatible'
    | 'unconfigured';
  readonly modelId: string;
  generateWorkspaceItinerary(
    input: CanonicalItineraryInput,
    signal?: AbortSignal,
  ): Promise<AiWorkspaceItinerary>;
  proposeItineraryDiff(
    input: CanonicalAssistInput,
    signal?: AbortSignal,
  ): Promise<AiRawProposal>;
}
