import {
  ItinerarySchema,
  type GenerateItineraryRequest,
  type Itinerary,
} from './schemas';

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export async function generateItineraryApi(
  payload: GenerateItineraryRequest,
): Promise<Itinerary> {
  const response = await fetch('/api/itinerary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data: unknown = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new ApiRequestError(
        `Server returned non-JSON response (HTTP ${response.status}).`,
        response.status >= 400 ? response.status : 502,
      );
    }
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status);
  }

  if (!data || typeof data !== 'object' || !('itinerary' in data)) {
    throw new ApiRequestError('Server returned an unexpected response.', 502);
  }

  const parsed = ItinerarySchema.safeParse(data.itinerary);
  if (!parsed.success) {
    throw new ApiRequestError(
      'Received an invalid itinerary structure from the server.',
      502,
    );
  }

  return parsed.data;
}
