import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import type { ServerConfig } from '../../server/config';
import {
  MalformedAiResponseError,
  MissingCredentialsError,
  UpstreamTimeoutError,
  type ItineraryGenerator,
} from '../../server/services/gemini';
import type { Itinerary } from '../../src/lib/schemas';

const BASE_CONFIG: ServerConfig = {
  port: 3001,
  geminiApiKey: undefined,
  gcpProjectId: undefined,
  gcpLocation: 'us-central1',
  geminiModel: undefined,
  aiTimeoutMs: 5000,
};

const VALID_PAYLOAD = {
  trip: {
    destinations: ['Barcelona'],
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    groupSize: 3,
    currency: 'GBP',
  },
  travellers: [
    {
      id: 'alice',
      name: 'Alice',
      budget: 200,
      interests: ['museums', 'culture'],
      preferences: '',
    },
  ],
};

const SAMPLE_ITINERARY: Itinerary = {
  chosenDestination: 'Barcelona',
  overview: 'A 3-day Barcelona city & coast blend.',
  compromiseSummary: 'Pairs free cultural sights with selective paid tours.',
  generatedAt: '2026-11-18T14:00:00Z',
  days: [
    {
      dayNumber: 1,
      date: '2026-12-01',
      theme: 'Gothic Quarter & Tapas',
      activities: [
        {
          id: 'day1-act1',
          title: 'Picasso Museum & El Born Walk',
          description: 'Explore museum highlights and historic lanes.',
          timeSlot: 'morning',
          estimatedCostPerPerson: 22,
          compromiseExplanation: 'Meets Alice culture interest on a modest budget.',
          matchedTravellers: ['Alice'],
          included: true,
        },
      ],
    },
  ],
};

describe('API /api/health & /api/itinerary/generate', () => {
  it('reports unconfigured AI status on /api/health', async () => {
    const app = createApp(BASE_CONFIG);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      aiConfigured: false,
      provider: 'unconfigured',
    });
  });

  it('returns 400 with fieldErrors on invalid input', async () => {
    const mockGenerator: ItineraryGenerator = {
      generate: async () => SAMPLE_ITINERARY,
    };
    const app = createApp(BASE_CONFIG, mockGenerator);
    const res = await request(app)
      .post('/api/itinerary/generate')
      .send({ trip: VALID_PAYLOAD.trip, travellers: [] });
    expect(res.status).toBe(400);
    expect(res.body.fieldErrors).toBeDefined();
  });

  it('returns 200 with validated itinerary when generator succeeds', async () => {
    const mockGenerator: ItineraryGenerator = {
      generate: async () => SAMPLE_ITINERARY,
    };
    const app = createApp(BASE_CONFIG, mockGenerator);
    const res = await request(app)
      .post('/api/itinerary/generate')
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(200);
    expect(res.body.itinerary.chosenDestination).toBe('Barcelona');
  });

  it('returns 502 on malformed AI response', async () => {
    const mockGenerator: ItineraryGenerator = {
      generate: async () => {
        throw new MalformedAiResponseError('Malformed JSON');
      },
    };
    const app = createApp(BASE_CONFIG, mockGenerator);
    const res = await request(app)
      .post('/api/itinerary/generate')
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(502);
  });

  it('returns 503 when Gemini credentials are missing or unauthorized', async () => {
    const mockGenerator: ItineraryGenerator = {
      generate: async () => {
        throw new MissingCredentialsError('No credentials');
      },
    };
    const app = createApp(BASE_CONFIG, mockGenerator);
    const res = await request(app)
      .post('/api/itinerary/generate')
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(503);
  });

  it('returns 504 on upstream timeout', async () => {
    const mockGenerator: ItineraryGenerator = {
      generate: async () => {
        throw new UpstreamTimeoutError('Timed out');
      },
    };
    const app = createApp(BASE_CONFIG, mockGenerator);
    const res = await request(app)
      .post('/api/itinerary/generate')
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(504);
  });
});
