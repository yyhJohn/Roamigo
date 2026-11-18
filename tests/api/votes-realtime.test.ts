import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';
import { io as createSocketClient } from 'socket.io-client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_TRIP_ID } from '../../prisma/seedData';
import { seedDatabase } from '../../prisma/seed';
import { createApp } from '../../server/app';
import type { ServerConfig } from '../../server/config';
import { createPrismaClient } from '../../server/db/prisma';
import { attachTripRealtimeHub } from '../../server/realtime/socketServer';

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

describe('Milestone 7: Server-authoritative voting, RBAC & Socket.IO room sync', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createPrismaClient(TEST_DB_URL);
    await prisma.$connect();
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('enforces 1-vote-per-user-per-activity, blocks VIEWER/non-member sockets, and broadcasts trip:changed', async () => {
    const broadcastRef: { fn?: (tripId: string) => void } = {};
    const app = createApp(TEST_CONFIG, undefined, {
      prisma,
      onTripChanged: (id) => broadcastRef.fn?.(id),
    });
    const httpServer = http.createServer(app);
    const hub = attachTripRealtimeHub(httpServer, TEST_CONFIG, prisma);
    broadcastRef.fn = (id) => hub.broadcastTripChanged(id);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const port = (httpServer.address() as AddressInfo).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const agentOwner = request.agent(baseUrl);
      const agentViewer = request.agent(baseUrl);
      const agentOutsider = request.agent(baseUrl);

      const regOwner = await agentOwner.post('/api/auth/register').send({
        email: `v.owner.${Date.now()}@roamigo.test`,
        password: 'OwnerPassword1',
        displayName: 'Olivia Owner',
        preferredCurrency: 'GBP',
      });
      const csrfOwner = regOwner.body.data.csrfToken as string;
      const cookieOwner = (regOwner.headers['set-cookie'] as unknown as string[])[0]!;

      const regViewer = await agentViewer.post('/api/auth/register').send({
        email: `v.viewer.${Date.now()}@roamigo.test`,
        password: 'ViewerPassword1',
        displayName: 'Victor Viewer',
        preferredCurrency: 'GBP',
      });
      const csrfViewer = regViewer.body.data.csrfToken as string;
      const emailViewer = regViewer.body.data.user.email as string;

      const regOutsider = await agentOutsider.post('/api/auth/register').send({
        email: `v.outsider.${Date.now()}@roamigo.test`,
        password: 'OutsiderPass1',
        displayName: 'Oscar Outsider',
        preferredCurrency: 'GBP',
      });
      const cookieOutsider = (
        regOutsider.headers['set-cookie'] as unknown as string[]
      )[0]!;

      // Clone Demo Trip -> editable trip
      const cloneRes = await agentOwner
        .post(`/api/trips/${DEMO_TRIP_ID}/clone`)
        .set('X-CSRF-Token', csrfOwner);
      const tripId = cloneRes.body.data.tripId as string;

      // Invite Victor as VIEWER
      const invRes = await agentOwner
        .post(`/api/trips/${tripId}/invitations`)
        .set('X-CSRF-Token', csrfOwner)
        .send({ email: emailViewer, role: 'VIEWER' });
      const rawToken = (invRes.body.data.inviteUrl as string)
        .split('/invites/')[1]!;
      await agentViewer
        .post(`/api/invitations/${rawToken}/accept`)
        .set('X-CSRF-Token', csrfViewer);

      const detail1 = await agentOwner.get(`/api/trips/${tripId}`);
      const firstActivityId =
        detail1.body.data.itinerary.days[0].activities[0].id as string;

      // Connect Owner Socket & Outsider Socket
      const ownerSocket = createSocketClient(baseUrl, {
        extraHeaders: { Cookie: cookieOwner.split(';')[0]! },
        transports: ['websocket'],
      });
      const outsiderSocket = createSocketClient(baseUrl, {
        extraHeaders: { Cookie: cookieOutsider.split(';')[0]! },
        transports: ['websocket'],
      });

      const ownerJoin = await new Promise<{ ok: boolean }>((resolve) => {
        ownerSocket.on('connect', () => {
          ownerSocket.emit('join-trip', tripId, resolve);
        });
      });
      expect(ownerJoin.ok).toBe(true);

      const outsiderJoin = await new Promise<{ ok: boolean; error?: string }>(
        (resolve) => {
          outsiderSocket.on('connect', () => {
            outsiderSocket.emit('join-trip', tripId, resolve);
          });
        },
      );
      expect(outsiderJoin.ok).toBe(false);
      expect(outsiderJoin.error).toBe('FORBIDDEN');

      // Listen for real-time trip:changed event on ownerSocket
      const changedPromise = new Promise<{ tripId: string }>((resolve) => {
        ownerSocket.once('trip:changed', resolve);
      });

      // VIEWER cannot vote (403)
      const viewerVote = await agentViewer
        .put(`/api/trips/${tripId}/activities/${firstActivityId}/vote`)
        .set('X-CSRF-Token', csrfViewer)
        .send({ direction: 'UP' });
      expect(viewerVote.status).toBe(403);

      // OWNER votes UP, then switches to DOWN (still exactly 1 vote row for owner!)
      const voteUp = await agentOwner
        .put(`/api/trips/${tripId}/activities/${firstActivityId}/vote`)
        .set('X-CSRF-Token', csrfOwner)
        .send({ direction: 'UP' });
      expect(voteUp.status).toBe(200);

      const changedPayload = await changedPromise;
      expect(changedPayload.tripId).toBe(tripId);

      const voteDown = await agentOwner
        .put(`/api/trips/${tripId}/activities/${firstActivityId}/vote`)
        .set('X-CSRF-Token', csrfOwner)
        .send({ direction: 'DOWN' });
      expect(voteDown.status).toBe(200);

      const ownerVoteRows = await prisma.vote.findMany({
        where: {
          activityId: firstActivityId,
          userId: regOwner.body.data.user.id,
        },
      });
      expect(ownerVoteRows).toHaveLength(1);
      expect(ownerVoteRows[0]!.direction).toBe('DOWN');

      // Organiser locks in activity
      const lockRes = await agentOwner
        .patch(`/api/trips/${tripId}/activities/${firstActivityId}/decision`)
        .set('X-CSRF-Token', csrfOwner)
        .send({ decisionStatus: 'LOCKED_IN' });
      expect(lockRes.status).toBe(200);

      ownerSocket.disconnect();
      outsiderSocket.disconnect();
    } finally {
      await hub.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });
});
