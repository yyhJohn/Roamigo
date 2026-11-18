import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DEMO_TRIP_ID } from '../../prisma/seedData';
import { seedDatabase } from '../../prisma/seed';
import { createApp } from '../../server/app';
import type { ServerConfig } from '../../server/config';
import { createPrismaClient } from '../../server/db/prisma';
import { verifyPassword } from '../../server/lib/crypto';

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

describe('Milestone 2: PostgreSQL schema, seed, health & OpenAPI foundation', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reports live PostgreSQL readiness on /api/health and /api/health/ready', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });

    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.headers['x-content-type-options']).toBe('nosniff');
    expect(healthRes.headers['x-powered-by']).toBeUndefined();
    expect(healthRes.body).toEqual({
      ok: true,
      dbConnected: true,
      aiConfigured: false,
      provider: 'unconfigured',
    });

    const readyRes = await request(app).get('/api/health/ready');
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.ok).toBe(true);
    expect(readyRes.body.data.dbConnected).toBe(true);
    expect(readyRes.body.data.status).toBe('ready');
  });

  it('serves OpenAPI 3.1 document and standardized 404 API envelope', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });

    const specRes = await request(app).get('/api/openapi.json');
    expect(specRes.status).toBe(200);
    expect(specRes.body.openapi).toBe('3.1.0');
    expect(specRes.body.paths['/api/trips']).toBeDefined();
    expect(specRes.body.components.securitySchemes.sessionCookie).toBeDefined();

    const missingRes = await request(app).get('/api/does-not-exist');
    expect(missingRes.status).toBe(404);
    expect(missingRes.body).toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found.',
      },
    });
  });

  it('seeds demo users, Barcelona trip, votes, and exact minor-unit splits idempotently', async () => {
    await seedDatabase(prisma);
    await seedDatabase(prisma);

    const alice = await prisma.user.findUniqueOrThrow({
      where: { email: 'alice@roamigo.demo' },
    });
    expect(await verifyPassword(DEMO_PASSWORD, alice.passwordHash)).toBe(true);
    expect(await verifyPassword('WrongPass123!', alice.passwordHash)).toBe(
      false,
    );

    const trip = await prisma.trip.findUniqueOrThrow({
      where: { id: DEMO_TRIP_ID },
      include: {
        members: true,
        preferences: true,
        expenses: { include: { splits: true } },
        settlements: true,
        itinerary: {
          include: {
            versions: {
              include: {
                days: { include: { activities: { include: { votes: true } } } },
              },
            },
          },
        },
      },
    });

    expect(trip.members).toHaveLength(3);
    expect(trip.preferences).toHaveLength(3);
    expect(trip.expenses).toHaveLength(1);
    const hostel = trip.expenses[0];
    expect(hostel).toBeDefined();
    const splitSum = hostel!.splits.reduce((acc, s) => acc + s.shareMinor, 0);
    expect(splitSum).toBe(hostel!.amountMinor);
    expect(trip.settlements).toHaveLength(2);

    const firstAct =
      trip.itinerary?.versions[0]?.days[0]?.activities[0];
    expect(firstAct?.votes).toHaveLength(3);

    // Enforce unique constraint on (activityId, userId)
    await expect(
      prisma.vote.create({
        data: {
          activityId: firstAct!.id,
          userId: alice.id,
          direction: 'DOWN',
        },
      }),
    ).rejects.toThrow();
  });
});
