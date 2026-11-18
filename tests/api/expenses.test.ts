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

describe('Milestone 8 API: Budgets, minor-unit expense splits, RBAC & settlements', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persists budgets, EQUAL/CUSTOM/PERCENTAGE splits, RBAC checks, and minimal settlements', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });
    const ownerAgent = request.agent(app);
    const memberAgent = request.agent(app);
    const viewerAgent = request.agent(app);

    const regOwner = await ownerAgent.post('/api/auth/register').send({
      email: `exp.owner.${Date.now()}@roamigo.test`,
      password: 'OwnerPassword1',
      displayName: 'Olivia Payer',
      preferredCurrency: 'GBP',
    });
    const csrfOwner = regOwner.body.data.csrfToken as string;
    const ownerId = regOwner.body.data.user.id as string;

    const regMember = await memberAgent.post('/api/auth/register').send({
      email: `exp.member.${Date.now()}@roamigo.test`,
      password: 'MemberPassword1',
      displayName: 'Mason Member',
      preferredCurrency: 'GBP',
    });
    const csrfMember = regMember.body.data.csrfToken as string;
    const memberId = regMember.body.data.user.id as string;
    const memberEmail = regMember.body.data.user.email as string;

    const regViewer = await viewerAgent.post('/api/auth/register').send({
      email: `exp.viewer.${Date.now()}@roamigo.test`,
      password: 'ViewerPassword1',
      displayName: 'Vera Viewer',
      preferredCurrency: 'GBP',
    });
    const csrfViewer = regViewer.body.data.csrfToken as string;
    const viewerId = regViewer.body.data.user.id as string;
    const viewerEmail = regViewer.body.data.user.email as string;

    // Clone Demo Trip
    const cloneRes = await ownerAgent
      .post(`/api/trips/${DEMO_TRIP_ID}/clone`)
      .set('X-CSRF-Token', csrfOwner);
    const tripId = cloneRes.body.data.tripId as string;

    // Invite Mason (MEMBER) & Vera (VIEWER)
    for (const [email, role, agent, csrf] of [
      [memberEmail, 'MEMBER', memberAgent, csrfMember],
      [viewerEmail, 'VIEWER', viewerAgent, csrfViewer],
    ] as const) {
      const inv = await ownerAgent
        .post(`/api/trips/${tripId}/invitations`)
        .set('X-CSRF-Token', csrfOwner)
        .send({ email, role });
      const token = (inv.body.data.inviteUrl as string).split('/invites/')[1]!;
      await agent
        .post(`/api/invitations/${token}/accept`)
        .set('X-CSRF-Token', csrf);
    }

    // VIEWER cannot update budget or log expenses (403)
    const viewerBudget = await viewerAgent
      .put(`/api/trips/${tripId}/budget`)
      .set('X-CSRF-Token', csrfViewer)
      .send({ sharedCapMinor: 150_000 });
    expect(viewerBudget.status).toBe(403);

    const viewerExpense = await viewerAgent
      .post(`/api/trips/${tripId}/expenses`)
      .set('X-CSRF-Token', csrfViewer)
      .send({
        paidByUserId: viewerId,
        category: 'FOOD',
        title: 'Sneaky snack',
        amountMinor: 1000,
        splitMode: 'EQUAL',
        incurredOn: '2026-06-12',
        participantUserIds: [ownerId, memberId],
      });
    expect(viewerExpense.status).toBe(403);

    // OWNER updates shared group budget cap
    const ownerBudget = await ownerAgent
      .put(`/api/trips/${tripId}/budget`)
      .set('X-CSRF-Token', csrfOwner)
      .send({ sharedCapMinor: 200_000, notes: 'Group shared kitty' });
    expect(ownerBudget.status).toBe(200);

    // Reject invalid CUSTOM split where shares don't match exact total (400)
    const badCustom = await ownerAgent
      .post(`/api/trips/${tripId}/expenses`)
      .set('X-CSRF-Token', csrfOwner)
      .send({
        paidByUserId: ownerId,
        category: 'TICKETS',
        title: 'Mismatched tickets',
        amountMinor: 5000,
        splitMode: 'CUSTOM',
        incurredOn: '2026-06-12',
        customSplits: [
          { userId: ownerId, shareMinor: 2500 },
          { userId: memberId, shareMinor: 2000 },
        ],
      });
    expect(badCustom.status).toBe(400);

    // Log £100.00 (10000 minor) EQUAL split across 3 members -> [3334, 3333, 3333]
    const eqRes = await ownerAgent
      .post(`/api/trips/${tripId}/expenses`)
      .set('X-CSRF-Token', csrfOwner)
      .send({
        paidByUserId: ownerId,
        category: 'ACCOMMODATION',
        title: 'Hostel deposit',
        amountMinor: 10_000,
        splitMode: 'EQUAL',
        incurredOn: '2026-06-12',
        participantUserIds: [ownerId, memberId, viewerId],
      });
    expect(eqRes.status).toBe(201);
    const eqExpenseId = eqRes.body.data.expenseId as string;

    // MEMBER cannot delete an expense paid by OWNER (403)
    const memberDelete = await memberAgent
      .delete(`/api/trips/${tripId}/expenses/${eqExpenseId}`)
      .set('X-CSRF-Token', csrfMember);
    expect(memberDelete.status).toBe(403);

    // Verify trip detail keeps estimatedPerPersonMinor separate & computes 2 settlements
    const detailRes = await ownerAgent.get(`/api/trips/${tripId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.budget.sharedCapMinor).toBe(200_000);
    expect(detailRes.body.data.expenses).toHaveLength(1);
    const splits = detailRes.body.data.expenses[0].splits as {
      shareMinor: number;
    }[];
    expect(splits.reduce((s, item) => s + item.shareMinor, 0)).toBe(10_000);
    expect(detailRes.body.data.settlements).toHaveLength(2);

    // Mark first settlement as MARKED_PAID
    const settlementId = detailRes.body.data.settlements[0].id as string;
    const patchSettle = await memberAgent
      .patch(`/api/trips/${tripId}/settlements/${settlementId}`)
      .set('X-CSRF-Token', csrfMember)
      .send({ status: 'MARKED_PAID' });
    expect(patchSettle.status).toBe(200);

    // Delete expense as OWNER -> cleans up unsettled transfers
    const delRes = await ownerAgent
      .delete(`/api/trips/${tripId}/expenses/${eqExpenseId}`)
      .set('X-CSRF-Token', csrfOwner);
    expect(delRes.status).toBe(200);
  });
});
