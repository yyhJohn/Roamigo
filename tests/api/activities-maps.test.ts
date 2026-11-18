import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_TRIP_ID } from '../../prisma/seedData';
import { seedDatabase } from '../../prisma/seed';
import { createApp } from '../../server/app';
import type { ServerConfig } from '../../server/config';
import { createPrismaClient } from '../../server/db/prisma';

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

describe('Milestone 6: Manual days/activities CRUD, reordering & honest landmark coordinates', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('blocks mutations on Demo Trip, clones editable copy, resolves curated vs unverified coordinates, and reorders across days', async () => {
    let changedTripNotifications = 0;
    const app = createApp(TEST_CONFIG, undefined, {
      prisma,
      onTripChanged: () => {
        changedTripNotifications += 1;
      },
    });
    const agent = request.agent(app);

    const reg = await agent.post('/api/auth/register').send({
      email: `ws.${Date.now()}@roamigo.test`,
      password: 'WorkspacePass1',
      displayName: 'Maya Planner',
      preferredCurrency: 'GBP',
    });
    const csrf = reg.body.data.csrfToken as string;

    // Demo trip cannot be mutated directly
    const demoAttempt = await agent
      .post(`/api/trips/${DEMO_TRIP_ID}/days`)
      .set('X-CSRF-Token', csrf)
      .send({ date: '2026-06-15', theme: 'Extra Day' });
    expect(demoAttempt.status).toBe(403);

    // Clone Demo Trip -> editable copy
    const cloneRes = await agent
      .post(`/api/trips/${DEMO_TRIP_ID}/clone`)
      .set('X-CSRF-Token', csrf);
    expect(cloneRes.status).toBe(201);
    const tripId = cloneRes.body.data.tripId as string;

    // Search curated Barcelona places
    const searchRes = await agent.get(
      `/api/trips/${tripId}/maps/search?q=Sagrada`,
    );
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.places.length).toBeGreaterThanOrEqual(1);
    expect(searchRes.body.data.places[0].coordSource).toBe('curated');

    // Add Day 4
    const dayRes = await agent
      .post(`/api/trips/${tripId}/days`)
      .set('X-CSRF-Token', csrf)
      .send({ date: '2026-06-15', theme: 'Montjuic & Farewell Tapas' });
    expect(dayRes.status).toBe(201);
    const day4Id = dayRes.body.data.dayId as string;

    // Add activity with curated landmark match
    const act1 = await agent
      .post(`/api/trips/${tripId}/activities`)
      .set('X-CSRF-Token', csrf)
      .send({
        dayId: day4Id,
        title: 'Morning Climb at Montjuïc Castle',
        description: 'Harbour views and gardens.',
        category: 'OUTDOORS',
        timeSlot: 'MORNING',
        startTime: '09:30',
        endTime: '11:30',
        estimatedCostMinor: 1200,
        locationName: 'Montjuïc Castle',
        included: true,
      });
    expect(act1.status).toBe(201);
    const act1Id = act1.body.data.activityId as string;

    // Add activity with custom unknown cafe -> must NOT fabricate coordinates!
    const act2 = await agent
      .post(`/api/trips/${tripId}/activities`)
      .set('X-CSRF-Token', csrf)
      .send({
        dayId: day4Id,
        title: 'Hidden Neighbourhood Bakery',
        description: 'Secret pastry stop.',
        category: 'FOOD',
        timeSlot: 'AFTERNOON',
        estimatedCostMinor: 850,
        locationName: 'Nonexistent Secret Cafe XYZ-999',
        included: true,
      });
    expect(act2.status).toBe(201);
    const act2Id = act2.body.data.activityId as string;

    // Reorder act2 UP before act1
    const reorderRes = await agent
      .post(`/api/trips/${tripId}/activities/reorder`)
      .set('X-CSRF-Token', csrf)
      .send({ activityId: act2Id, direction: 'UP' });
    expect(reorderRes.status).toBe(200);

    // Toggle act1 excluded
    const patchRes = await agent
      .patch(`/api/trips/${tripId}/activities/${act1Id}`)
      .set('X-CSRF-Token', csrf)
      .send({ included: false });
    expect(patchRes.status).toBe(200);

    // Inspect persisted detail
    const detailRes = await agent.get(`/api/trips/${tripId}`);
    expect(detailRes.status).toBe(200);
    const day4 = detailRes.body.data.itinerary.days.find(
      (d: { id: string }) => d.id === day4Id,
    );
    expect(day4.activities[0].id).toBe(act2Id);
    expect(day4.activities[0].lat).toBeNull();
    expect(day4.activities[0].coordSource).toBe('unverified');
    expect(day4.activities[1].id).toBe(act1Id);
    expect(day4.activities[1].coordSource).toBe('curated');
    expect(day4.activities[1].lat).toBeCloseTo(41.3636, 2);
    expect(day4.activities[1].included).toBe(false);
    expect(changedTripNotifications).toBeGreaterThanOrEqual(4);
  });
});
