import type { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_TRIP_ID } from '../../prisma/seedData';
import { seedDatabase } from '../../prisma/seed';
import { createApp } from '../../server/app';
import type { ServerConfig } from '../../server/config';
import { createPrismaClient } from '../../server/db/prisma';
import { errorMiddleware, sendOk } from '../../server/lib/http';
import {
  createSessionHydrator,
  getRequiredTripAccess,
  requireAuth,
  requireTripRole,
} from '../../server/middleware/auth';
import { applySecurityMiddleware } from '../../server/middleware/security';

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

describe('Milestone 3: Authentication, CSRF protection, password reset & RBAC', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers, enforces X-CSRF-Token on mutating routes, verifies email, and resets password', async () => {
    const app = createApp(TEST_CONFIG, undefined, { prisma });
    const agent = request.agent(app);
    const uniqueEmail = `maya.${Date.now()}@roamigo.test`;

    const regRes = await agent.post('/api/auth/register').send({
      email: uniqueEmail,
      password: 'TravelSafe2026',
      displayName: 'Maya Patel',
      preferredCurrency: 'EUR',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(regRes.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(regRes.body.data.authenticated).toBe(true);
    expect(regRes.body.data.user.passwordHash).toBeUndefined();
    const csrfToken = regRes.body.data.csrfToken as string;
    const verifyToken = regRes.body.data.devVerifyToken as string;
    expect(csrfToken).toBeTruthy();

    // Duplicate registration returns 409
    const dupRes = await request(app).post('/api/auth/register').send({
      email: uniqueEmail,
      password: 'TravelSafe2026',
      displayName: 'Maya Two',
      preferredCurrency: 'EUR',
    });
    expect(dupRes.status).toBe(409);

    // Email verification marks emailVerified true
    const verifyRes = await agent
      .post('/api/auth/verify-email')
      .send({ token: verifyToken });
    expect(verifyRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.body.data.user.emailVerified).toBe(true);

    // Mutating logout WITHOUT X-CSRF-Token must fail with 403 CSRF_INVALID
    const missingCsrfRes = await agent.post('/api/auth/logout');
    expect(missingCsrfRes.status).toBe(403);
    expect(missingCsrfRes.body.error.code).toBe('CSRF_INVALID');

    // Logout WITH X-CSRF-Token succeeds
    const logoutRes = await agent
      .post('/api/auth/logout')
      .set('X-CSRF-Token', csrfToken);
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.body.data.authenticated).toBe(false);

    // Wrong password rejected with 401
    const badLogin = await agent.post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'WrongPassword99',
    });
    expect(badLogin.status).toBe(401);

    // Forgot + Reset password flow rotates credentials
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail });
    expect(forgotRes.status).toBe(200);
    const resetToken = forgotRes.body.data.devResetToken as string;
    expect(resetToken).toBeTruthy();

    const resetRes = await agent.post('/api/auth/reset-password').send({
      token: resetToken,
      newPassword: 'UpdatedPassword88',
    });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.authenticated).toBe(true);
  });

  it('prevents cross-user IDOR and enforces TripMember role hierarchy', async () => {
    const rbacApp = express();
    applySecurityMiddleware(rbacApp, TEST_CONFIG);
    rbacApp.use(express.json());
    rbacApp.use(createSessionHydrator(prisma));
    rbacApp.get(
      '/probe/:tripId/view',
      requireAuth,
      requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER', 'VIEWER']),
      (req, res) => {
        const access = getRequiredTripAccess(req);
        sendOk(res, { role: access.role, demo: access.isDemoReadOnly });
      },
    );
    rbacApp.post(
      '/probe/:tripId/edit',
      requireAuth,
      requireTripRole(prisma, ['OWNER', 'EDITOR']),
      (req, res) => {
        const access = getRequiredTripAccess(req);
        sendOk(res, { editedByRole: access.role });
      },
    );
    rbacApp.use(errorMiddleware);

    const authApp = createApp(TEST_CONFIG, undefined, { prisma });

    // User A creates a private trip directly in DB
    const regA = await request(authApp)
      .post('/api/auth/register')
      .send({
        email: `owner.${Date.now()}@roamigo.test`,
        password: 'OwnerPass123',
        displayName: 'Owner A',
        preferredCurrency: 'GBP',
      });
    const cookieA = regA.headers['set-cookie']?.[0] ?? '';
    const csrfA = regA.body.data.csrfToken as string;
    const userAId = regA.body.data.user.id as string;

    const regB = await request(authApp)
      .post('/api/auth/register')
      .send({
        email: `outsider.${Date.now()}@roamigo.test`,
        password: 'OutsiderPass123',
        displayName: 'Outsider B',
        preferredCurrency: 'GBP',
      });
    const cookieB = regB.headers['set-cookie']?.[0] ?? '';
    const csrfB = regB.body.data.csrfToken as string;
    const userBId = regB.body.data.user.id as string;

    const privateTrip = await prisma.trip.create({
      data: {
        ownerId: userAId,
        title: 'Private Kyoto Trip',
        destinations: ['Kyoto'],
        startDate: '2027-04-01',
        endDate: '2027-04-05',
        members: { create: { userId: userAId, role: 'OWNER' } },
      },
    });

    // Outsider B is blocked with 403 FORBIDDEN (IDOR defense)
    const idorRes = await request(rbacApp)
      .get(`/probe/${privateTrip.id}/view`)
      .set('Cookie', cookieB);
    expect(idorRes.status).toBe(403);

    // Add B as VIEWER -> can GET view, cannot POST edit
    await prisma.tripMember.create({
      data: { tripId: privateTrip.id, userId: userBId, role: 'VIEWER' },
    });
    const viewerGet = await request(rbacApp)
      .get(`/probe/${privateTrip.id}/view`)
      .set('Cookie', cookieB);
    expect(viewerGet.status).toBe(200);
    expect(viewerGet.body.data.role).toBe('VIEWER');

    const viewerEdit = await request(rbacApp)
      .post(`/probe/${privateTrip.id}/edit`)
      .set('Cookie', cookieB)
      .set('X-CSRF-Token', csrfB);
    expect(viewerEdit.status).toBe(403);

    // Owner A can POST edit
    const ownerEdit = await request(rbacApp)
      .post(`/probe/${privateTrip.id}/edit`)
      .set('Cookie', cookieA)
      .set('X-CSRF-Token', csrfA);
    expect(ownerEdit.status).toBe(200);
    expect(ownerEdit.body.data.editedByRole).toBe('OWNER');

    // Outsider B CAN read the public Demo Trip in read-only mode, but CANNOT edit it
    const demoRead = await request(rbacApp)
      .get(`/probe/${DEMO_TRIP_ID}/view`)
      .set('Cookie', cookieB);
    expect(demoRead.status).toBe(200);
    expect(demoRead.body.data.demo).toBe(true);

    const demoEdit = await request(rbacApp)
      .post(`/probe/${DEMO_TRIP_ID}/edit`)
      .set('Cookie', cookieB)
      .set('X-CSRF-Token', csrfB);
    expect(demoEdit.status).toBe(403);
  });
});
