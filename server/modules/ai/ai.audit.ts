import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import {
  AiRateLimitedError,
  MalformedAiResponseError,
  MissingCredentialsError,
  UpstreamTimeoutError,
  type TravelAIProvider,
} from './ai.types.js';

export function mapAiErrorToAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof MissingCredentialsError) {
    return new AppError(503, 'AI_UNCONFIGURED', err.message);
  }
  if (err instanceof UpstreamTimeoutError) {
    return new AppError(504, 'AI_TIMEOUT', err.message);
  }
  if (err instanceof AiRateLimitedError) {
    return new AppError(429, 'RATE_LIMITED', err.message);
  }
  if (err instanceof MalformedAiResponseError) {
    return new AppError(502, 'AI_INVALID_RESPONSE', err.message);
  }
  return new AppError(
    502,
    'AI_UPSTREAM_ERROR',
    err instanceof Error ? err.message : 'AI provider request failed.',
  );
}

export async function runAuditedAiOperation<T>(params: {
  prisma: PrismaClient;
  tripId: string;
  userId: string;
  aiProvider: TravelAIProvider;
  operation: 'GENERATE_ITINERARY' | 'PROPOSE_DIFF';
  execute: () => Promise<T>;
}): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await params.execute();
    await params.prisma.aIRequest.create({
      data: {
        tripId: params.tripId,
        userId: params.userId,
        provider: params.aiProvider.providerId,
        model: params.aiProvider.modelId,
        operation: params.operation,
        status: 'SUCCESS',
        durationMs: Date.now() - startedAt,
      },
    });
    return result;
  } catch (err) {
    const mapped = mapAiErrorToAppError(err);
    await params.prisma.aIRequest
      .create({
        data: {
          tripId: params.tripId,
          userId: params.userId,
          provider: params.aiProvider.providerId,
          model: params.aiProvider.modelId,
          operation: params.operation,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          errorCode: mapped.code,
        },
      })
      .catch(() => undefined);
    throw mapped;
  }
}
