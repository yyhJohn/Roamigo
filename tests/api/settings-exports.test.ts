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
  port: 0,
  nodeEnv: 'test',
  databaseUrl: TEST_DB_URL,
  geminiApiKey: undefined,
  gcpProjectId: undefined,
  gcpLocation: 'us-central1',
  geminiModel: undefined,
  aiTimeoutMs: 5000,
};

describe('Milestone 9 API: User settings, email privacy, exports & account deletion', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('updates profile settings, enforces export IDOR & email redaction, and anonymizes deleted collaborator', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });
    const ownerAgent = request.agent(app);
    const collabAgent = request.agent(app);
    const outsiderAgent = request.agent(app);

    const regOwner = await ownerAgent.post('/api/auth/register').send({
      email: `m9.owner.${Date.now()}@roamigo.test`,
      password: 'OwnerPass123',
      displayName: 'Olivia Export',
      preferredCurrency: 'GBP',
    });
    const csrfOwner = regOwner.body.data.csrfToken as string;
    const ownerId = regOwner.body.data.user.id as string;
    const ownerEmail = regOwner.body.data.user.email as string;

    const regCollab = await collabAgent.post('/api/auth/register').send({
      email: `m9.collab.${Date.now()}@roamigo.test`,
      password: 'CollabPass123',
      displayName: 'Callum Private',
      preferredCurrency: 'GBP',
    });
    const csrfCollab = regCollab.body.data.csrfToken as string;
    const collabId = regCollab.body.data.user.id as string;
    const collabEmail = regCollab.body.data.user.email as string;

    await outsiderAgent.post('/api/auth/register').send({
      email: `m9.outsider.${Date.now()}@roamigo.test`,
      password: 'OutsiderPass123',
      displayName: 'Oscar Outsider',
      preferredCurrency: 'GBP',
    });

    // Update Olivia's settings (keep privacyShareEmail: false)
    const patchRes = await ownerAgent
      .patch('/api/users/me')
      .set('X-CSRF-Token', csrfOwner)
      .send({
        displayName: 'Olivia Updated',
        avatarColor: '#0F766E',
        preferredCurrency: 'EUR',
        preferredLanguage: 'en',
        themePreference: 'dark',
        privacyShareEmail: false,
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.user.displayName).toBe('Olivia Updated');

    // Clone Demo Trip & invite Callum as MEMBER
    const cloneRes = await ownerAgent
      .post(`/api/trips/${DEMO_TRIP_ID}/clone`)
      .set('X-CSRF-Token', csrfOwner);
    const tripId = cloneRes.body.data.tripId as string;

    const invRes = await ownerAgent
      .post(`/api/trips/${tripId}/invitations`)
      .set('X-CSRF-Token', csrfOwner)
      .send({ email: collabEmail, role: 'MEMBER' });
    const rawToken = (invRes.body.data.inviteUrl as string).split('/invites/')[1]!;
    await collabAgent
      .post(`/api/invitations/${rawToken}/accept`)
      .set('X-CSRF-Token', csrfCollab);

    // Log a formula-prefixed shared expense paid by Olivia
    await ownerAgent
      .post(`/api/trips/${tripId}/expenses`)
      .set('X-CSRF-Token', csrfOwner)
      .send({
        paidByUserId: ownerId,
        category: 'FOOD',
        title: '=HYPERLINK("http://evil.invalid","Tapas")',
        amountMinor: 4000,
        splitMode: 'EQUAL',
        incurredOn: '2026-06-12',
        participantUserIds: [ownerId, collabId],
      });

    // Outsider blocked from all exports (403 IDOR check)
    for (const fmt of ['json', 'ics', 'csv']) {
      const res = await outsiderAgent.get(`/api/trips/${tripId}/export/${fmt}`);
      expect(res.status).toBe(403);
    }

    // Callum (MEMBER) exports JSON & CSV -> Olivia's private email is redacted!
    const jsonRes = await collabAgent.get(`/api/trips/${tripId}/export/json`);
    expect(jsonRes.status).toBe(200);
    const parsedJson = JSON.parse(jsonRes.text) as {
      trip: { members: { userId: string; email: string | null }[] };
    };
    const ownerMemberInExport = parsedJson.trip.members.find(
      (m) => m.userId === ownerId,
    );
    expect(ownerMemberInExport?.email).toBeNull();
    expect(jsonRes.text).not.toContain(ownerEmail);

    const csvRes = await collabAgent.get(`/api/trips/${tripId}/export/csv`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('\'=HYPERLINK(""http://evil.invalid""');
    expect(csvRes.text).toContain('Redacted');

    const icsRes = await collabAgent.get(`/api/trips/${tripId}/export/ics`);
    expect(icsRes.status).toBe(200);
    expect(icsRes.text).toContain('BEGIN:VCALENDAR');
    expect(icsRes.text).toContain('BEGIN:VEVENT');

    // Callum deletes his account -> anonymized because he is part of Olivia's shared expense split
    const badDel = await collabAgent
      .delete('/api/users/me')
      .set('X-CSRF-Token', csrfCollab)
      .send({ confirmPhrase: 'wrong' });
    expect(badDel.status).toBe(400);

    const okDel = await collabAgent
      .delete('/api/users/me')
      .set('X-CSRF-Token', csrfCollab)
      .send({ confirmPhrase: 'DELETE MY ACCOUNT' });
    expect(okDel.status).toBe(200);

    // Callum's session is revoked immediately
    const meAfter = await collabAgent.get('/api/auth/me');
    expect(meAfter.body.data.authenticated).toBe(false);

    // Olivia's trip still exists with intact settlement, showing 'Deleted Traveller'
    const tripAfter = await ownerAgent.get(`/api/trips/${tripId}`);
    expect(tripAfter.status).toBe(200);
    expect(
      tripAfter.body.data.members.some(
        (m: { displayName: string }) => m.displayName === 'Deleted Traveller',
      ),
    ).toBe(true);
    expect(JSON.stringify(tripAfter.body.data)).not.toContain(collabEmail);
  });
});
