import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seedDatabase } from '../../prisma/seed';
import { createApp } from '../../server/app';
import type { ServerConfig } from '../../server/config';
import { createPrismaClient } from '../../server/db/prisma';
import { buildWorkspaceGenerationPrompt } from '../../server/modules/ai/ai.prompts';
import {
  MalformedAiResponseError,
  MissingCredentialsError,
  type TravelAIProvider,
} from '../../server/modules/ai/ai.types';
import { createOpenAiTravelProvider } from '../../server/modules/ai/providers/openaiProvider';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://roamigo:roamigo@127.0.0.1:5432/roamigo_test?schema=public';

const TEST_CONFIG: ServerConfig = {
  port: 3001,
  nodeEnv: 'test',
  databaseUrl: TEST_DB_URL,
  geminiApiKey: undefined,
  gcpProjectId: undefined,
  gcpLocation: 'us-central1',
  geminiModel: undefined,
  aiTimeoutMs: 5000,
};

const VALID_AI_ITIN = {
  chosenDestination: 'Lisbon',
  overview: 'Two sunny days across Alfama and Belém.',
  compromiseSummary: 'Keeps spend under €90/person.',
  days: [
    {
      dayNumber: 1,
      date: '2026-10-10',
      theme: 'Alfama & Miradouros',
      activities: [
        {
          stableKey: 'lis-d1-tram',
          title: 'Tram 28 & Graça Viewpoint',
          description: 'Historic tram climb and espresso.',
          category: 'CULTURE' as const,
          timeSlot: 'MORNING' as const,
          startTime: '09:30',
          endTime: '11:30',
          estimatedCostMinor: 600,
          locationName: 'Miradouro da Graça',
          compromiseExplanation: 'Low-cost scenic opener.',
          matchedTravellers: ['Elena'],
          included: true,
        },
        {
          stableKey: 'lis-d1-fado',
          title: 'Alfama Fado & Petiscos Dinner',
          description: 'Shared plates with live acoustic fado.',
          category: 'FOOD' as const,
          timeSlot: 'EVENING' as const,
          startTime: '20:00',
          endTime: '22:30',
          estimatedCostMinor: 4200,
          locationName: 'Alfama',
          compromiseExplanation: 'Evening music + dining highlight.',
          matchedTravellers: ['Elena'],
          included: true,
        },
      ],
    },
  ],
};

describe('Milestone 5: Multi-provider AI engine, PII hygiene & staged diffs', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('minimises PII in prompts and handles OpenAI retry, 401, and malformed JSON', async () => {
    const prompt = buildWorkspaceGenerationPrompt({
      destinations: ['Lisbon'],
      departureCity: 'London',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      groupSize: 2,
      currency: 'EUR',
      travellers: [
        {
          displayName: 'Elena',
          budgetMinor: 25000,
          accommodationPref: 'hostel',
          transportPref: 'walking',
          pace: 'balanced',
          dietaryOrAccess: 'Vegetarian',
          interests: ['fado'],
        },
      ],
    });
    expect(prompt).not.toContain('@');

    // Retry once on 429 then succeed
    let calls = 0;
    const retryFetch = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return new Response('rate limit', { status: 429 });
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(VALID_AI_ITIN) } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const oaProvider = createOpenAiTravelProvider(
      {
        ...TEST_CONFIG,
        aiProvider: 'openai-compatible',
        aiBaseUrl: 'https://llm.example.test/v1',
        aiModel: 'qwen-travel',
        aiApiKey: 'test-key',
      },
      'openai-compatible',
      retryFetch as unknown as typeof fetch,
    );

    const out = await oaProvider.generateWorkspaceItinerary({
      destinations: ['Lisbon'],
      departureCity: 'London',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      groupSize: 2,
      currency: 'EUR',
      travellers: [],
    });
    expect(calls).toBe(2);
    expect(out.chosenDestination).toBe('Lisbon');

    // Malformed JSON rejected cleanly
    const badFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: '{bad-json' } }] }),
          { status: 200 },
        ),
    );
    const badProvider = createOpenAiTravelProvider(
      {
        ...TEST_CONFIG,
        aiProvider: 'openai',
        aiModel: 'gpt-test',
        openaiApiKey: 'sk-test',
      },
      'openai',
      badFetch as unknown as typeof fetch,
    );
    await expect(
      badProvider.generateWorkspaceItinerary({
        destinations: ['Lisbon'],
        departureCity: '',
        startDate: '2026-10-10',
        endDate: '2026-10-11',
        groupSize: 1,
        currency: 'EUR',
        travellers: [],
      }),
    ).rejects.toBeInstanceOf(MalformedAiResponseError);

    // 401 rejected as MissingCredentialsError
    const unauthFetch = vi.fn(
      async () => new Response('unauthorized', { status: 401 }),
    );
    const unauthProvider = createOpenAiTravelProvider(
      {
        ...TEST_CONFIG,
        aiProvider: 'openai',
        aiModel: 'gpt-test',
        openaiApiKey: 'sk-invalid',
      },
      'openai',
      unauthFetch as unknown as typeof fetch,
    );
    await expect(
      unauthProvider.generateWorkspaceItinerary({
        destinations: ['Lisbon'],
        departureCity: '',
        startDate: '2026-10-10',
        endDate: '2026-10-11',
        groupSize: 1,
        currency: 'EUR',
        travellers: [],
      }),
    ).rejects.toBeInstanceOf(MissingCredentialsError);
  });

  it('stages Before/After diff without mutating DB, then applies version 2 preserving stableKey votes', async () => {
    const mockAi: TravelAIProvider = {
      providerId: 'openai',
      modelId: 'gpt-mock',
      generateWorkspaceItinerary: async () => VALID_AI_ITIN,
      proposeItineraryDiff: async () => ({
        summary: 'Replaced pricey Fado dinner with casual Tasca meal.',
        reasoning: 'Saves €24.00 per person while keeping Tram 28.',
        days: [
          {
            dayNumber: 1,
            date: '2026-10-10',
            theme: 'Alfama & Miradouros',
            activities: [
              VALID_AI_ITIN.days[0]!.activities[0]!,
              {
                stableKey: 'lis-d1-tasca',
                title: 'Neighbourhood Tasca Veggie Dinner',
                description: 'Affordable local dishes.',
                category: 'FOOD',
                timeSlot: 'EVENING',
                startTime: '19:30',
                endTime: '21:00',
                estimatedCostMinor: 1800,
                locationName: 'Mouraria',
                compromiseExplanation: 'Drops evening spend by €24.',
                matchedTravellers: ['Elena'],
                included: true,
              },
            ],
          },
        ],
      }),
    };

    const app = createApp(TEST_CONFIG, undefined, { prisma, aiProvider: mockAi });
    const agent = request.agent(app);

    const reg = await agent.post('/api/auth/register').send({
      email: `elena.${Date.now()}@roamigo.test`,
      password: 'ElenaPass123',
      displayName: 'Elena',
      preferredCurrency: 'EUR',
    });
    const csrf = reg.body.data.csrfToken as string;
    const userId = reg.body.data.user.id as string;

    const createRes = await agent
      .post('/api/trips')
      .set('X-CSRF-Token', csrf)
      .send({
        title: 'Lisbon Test',
        destinations: ['Lisbon'],
        departureCity: 'London',
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        groupSize: 2,
        currency: 'EUR',
        personalBudgetMinor: 3000,
        accommodationPref: 'hostel',
        transportPref: 'walking',
        interests: ['fado'],
        pace: 'balanced',
        dietaryOrAccess: '',
        notes: '',
        wizardStep: 10,
        finalize: true,
      });
    const tripId = createRes.body.data.tripId as string;

    // Generate v1
    const genRes = await agent
      .post(`/api/trips/${tripId}/itinerary/generate`)
      .set('X-CSRF-Token', csrf);
    expect(genRes.status).toBe(200);
    expect(genRes.body.data.versionNumber).toBe(1);

    // Add a vote on Tram 28 (`lis-d1-tram`)
    const detailV1 = await agent.get(`/api/trips/${tripId}`);
    const tramId = detailV1.body.data.itinerary.days[0].activities[0].id as string;
    await prisma.vote.create({
      data: { activityId: tramId, userId, direction: 'UP' },
    });

    // Propose diff -> must NOT overwrite v1
    const propRes = await agent
      .post(`/api/trips/${tripId}/ai/propose`)
      .set('X-CSRF-Token', csrf)
      .send({ instruction: 'Make dinner cheaper' });
    expect(propRes.status).toBe(200);
    expect(propRes.body.data.proposal.budgetImpact).toEqual({
      beforePerPersonMinor: 4800,
      afterPerPersonMinor: 2400,
      deltaPerPersonMinor: -2400,
      exceededTravellersAfter: [],
    });

    const stillV1 = await agent.get(`/api/trips/${tripId}`);
    expect(stillV1.body.data.itinerary.versionNumber).toBe(1);

    // Confirm & apply -> creates v2 AND preserves vote on unchanged `lis-d1-tram`!
    const applyRes = await agent
      .post(`/api/trips/${tripId}/ai/apply`)
      .set('X-CSRF-Token', csrf)
      .send({
        summary: propRes.body.data.proposal.summary,
        days: propRes.body.data.proposal.days,
      });
    expect(applyRes.status).toBe(200);
    expect(applyRes.body.data.versionNumber).toBe(2);

    const detailV2 = await agent.get(`/api/trips/${tripId}`);
    expect(detailV2.body.data.itinerary.versionNumber).toBe(2);
    expect(detailV2.body.data.summary.estimatedPerPersonMinor).toBe(2400);
    expect(
      detailV2.body.data.itinerary.days[0].activities[0].votes,
    ).toHaveLength(1);
  });
});
