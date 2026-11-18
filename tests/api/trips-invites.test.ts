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

describe('Milestone 4: Trips CRUD, 10-step wizard, invitations, roles & MVP import', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('saves wizard draft, finalizes trip, invites collaborator, and transfers ownership', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    const regA = await agentA.post('/api/auth/register').send({
      email: `org.${Date.now()}@roamigo.test`,
      password: 'OrganiserPass1',
      displayName: 'Liam Organiser',
      preferredCurrency: 'GBP',
    });
    const csrfA = regA.body.data.csrfToken as string;

    const regB = await agentB.post('/api/auth/register').send({
      email: `collab.${Date.now()}@roamigo.test`,
      password: 'CollabPass123',
      displayName: 'Chloe Collab',
      preferredCurrency: 'GBP',
    });
    const csrfB = regB.body.data.csrfToken as string;
    const emailB = regB.body.data.user.email as string;

    // Step 4 draft save
    const draftRes = await agentA
      .post('/api/trips')
      .set('X-CSRF-Token', csrfA)
      .send({
        title: 'Lisbon AutumnSurf',
        destinations: ['Lisbon'],
        departureCity: 'London',
        startDate: '2026-10-10',
        endDate: '2026-10-14',
        groupSize: 4,
        currency: 'EUR',
        personalBudgetMinor: 35000,
        sharedCapMinor: 140000,
        accommodationPref: 'apartment',
        transportPref: 'public-transit',
        interests: [],
        pace: 'balanced',
        dietaryOrAccess: 'Nut allergy',
        notes: '',
        wizardStep: 4,
        finalize: false,
      });
    expect(draftRes.status).toBe(201);
    const tripId = draftRes.body.data.tripId as string;

    // Finalize at Step 10
    const finRes = await agentA
      .put(`/api/trips/${tripId}/wizard`)
      .set('X-CSRF-Token', csrfA)
      .send({
        title: 'Lisbon Autumn Surf',
        destinations: ['Lisbon'],
        departureCity: 'London',
        startDate: '2026-10-10',
        endDate: '2026-10-14',
        groupSize: 4,
        currency: 'EUR',
        personalBudgetMinor: 35000,
        sharedCapMinor: 140000,
        accommodationPref: 'apartment',
        transportPref: 'public-transit',
        interests: ['surfing', 'seafood'],
        pace: 'balanced',
        dietaryOrAccess: 'Nut allergy',
        notes: '',
        wizardStep: 10,
        finalize: true,
      });
    expect(finRes.status).toBe(200);

    // Invite User B as EDITOR
    const invRes = await agentA
      .post(`/api/trips/${tripId}/invitations`)
      .set('X-CSRF-Token', csrfA)
      .send({ email: emailB, role: 'EDITOR' });
    expect(invRes.status).toBe(201);
    const inviteToken = invRes.body.data.inviteToken as string;

    // Preview & accept as User B
    const previewRes = await agentB.get(`/api/invitations/${inviteToken}`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.tripTitle).toBe('Lisbon Autumn Surf');

    const acceptRes = await agentB
      .post(`/api/invitations/${inviteToken}/accept`)
      .set('X-CSRF-Token', csrfB);
    expect(acceptRes.status).toBe(200);

    // Verify Shared filter for User B
    const sharedRes = await agentB.get('/api/trips?filter=shared');
    expect(
      sharedRes.body.data.trips.some(
        (t: { id: string }) => t.id === tripId,
      ),
    ).toBe(true);

    // Transfer OWNER role from A to B
    const detailBefore = await agentA.get(`/api/trips/${tripId}`);
    const memberBRow = detailBefore.body.data.members.find(
      (m: { displayName: string }) => m.displayName === 'Chloe Collab',
    );
    const transferRes = await agentA
      .patch(`/api/trips/${tripId}/members/${memberBRow.memberId}`)
      .set('X-CSRF-Token', csrfA)
      .send({ role: 'OWNER' });
    expect(transferRes.status).toBe(200);

    const detailAfter = await agentB.get(`/api/trips/${tripId}`);
    expect(detailAfter.body.data.summary.myRole).toBe('OWNER');
  });

  it('imports legacy roamigo:v1:trip state into minor units and clones Demo Trip', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });
    const agent = request.agent(app);

    const reg = await agent.post('/api/auth/register').send({
      email: `importer.${Date.now()}@roamigo.test`,
      password: 'ImporterPass1',
      displayName: 'Sam Importer',
      preferredCurrency: 'GBP',
    });
    const csrf = reg.body.data.csrfToken as string;

    const importRes = await agent
      .post('/api/trips/import-local')
      .set('X-CSRF-Token', csrf)
      .send({
        trip: {
          destinations: ['Edinburgh'],
          startDate: '2026-11-20',
          endDate: '2026-11-22',
          groupSize: 2,
          currency: 'GBP',
        },
        travellers: [
          {
            id: 't1',
            name: 'Sam',
            budget: 199.95,
            interests: ['castles', 'pubs'],
            preferences: 'Walkable',
          },
        ],
        itinerary: {
          chosenDestination: 'Edinburgh',
          overview: 'Old Town weekend.',
          compromiseSummary: 'Low-cost walking tour.',
          generatedAt: '2026-11-18T12:00:00Z',
          days: [
            {
              dayNumber: 1,
              date: '2026-11-20',
              theme: 'Royal Mile',
              activities: [
                {
                  id: 'ed-1',
                  title: 'Arthur’s Seat Morning Hike',
                  description: 'Panoramic summit trail.',
                  timeSlot: 'morning',
                  estimatedCostPerPerson: 12.5,
                  compromiseExplanation: 'Budget-friendly outdoor highlight.',
                  matchedTravellers: ['Sam'],
                  included: true,
                },
              ],
            },
          ],
        },
        votes: { 'ed-1': { t1: 'up' } },
      });

    expect(importRes.status).toBe(201);
    const importedId = importRes.body.data.tripId as string;

    const detail = await agent.get(`/api/trips/${importedId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.preferences[0].budgetMinor).toBe(19995);
    expect(detail.body.data.summary.estimatedPerPersonMinor).toBe(1250);

    // Clone public Demo Trip
    const cloneRes = await agent
      .post(`/api/trips/${DEMO_TRIP_ID}/clone`)
      .set('X-CSRF-Token', csrf);
    expect(cloneRes.status).toBe(201);
    const clonedDetail = await agent.get(
      `/api/trips/${cloneRes.body.data.tripId}`,
    );
    expect(clonedDetail.body.data.isDemoReadOnly).toBe(false);
    expect(clonedDetail.body.data.summary.myRole).toBe('OWNER');
  });
});
