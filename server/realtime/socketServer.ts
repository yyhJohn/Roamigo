import type { Server as HttpServer } from 'node:http';
import type { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { ServerConfig } from '../config.js';
import { sha256Hex } from '../lib/crypto.js';
import { SESSION_COOKIE_NAME } from '../middleware/auth.js';

interface AuthedSocketData {
  userId: string;
  displayName: string;
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export interface TripRealtimeHub {
  io: SocketIOServer;
  broadcastTripChanged: (tripId: string) => void;
  close: () => Promise<void>;
}

export function attachTripRealtimeHub(
  httpServer: HttpServer,
  config: ServerConfig,
  prisma: PrismaClient | undefined,
): TripRealtimeHub {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.appOrigin || 'http://127.0.0.1:8080',
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      if (!prisma) {
        next(new Error('UNAVAILABLE'));
        return;
      }
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const rawSession = cookies[SESSION_COOKIE_NAME];
      if (!rawSession || rawSession.length < 16) {
        next(new Error('UNAUTHENTICATED'));
        return;
      }
      const session = await prisma.session.findUnique({
        where: { tokenHash: sha256Hex(rawSession) },
        include: { user: true },
      });
      if (
        !session ||
        session.expiresAt.getTime() <= Date.now() ||
        session.user.deletedAt
      ) {
        next(new Error('UNAUTHENTICATED'));
        return;
      }
      (socket.data as AuthedSocketData) = {
        userId: session.user.id,
        displayName: session.user.displayName,
      };
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  async function emitRoomPresence(roomName: string) {
    const sockets = await io.in(roomName).fetchSockets();
    const uniqueUsers = new Set(
      sockets.map((s) => (s.data as AuthedSocketData).userId),
    );
    io.to(roomName).emit('presence:update', {
      onlineCount: uniqueUsers.size,
    });
  }

  io.on('connection', (socket) => {
    const { userId } = socket.data as AuthedSocketData;

    socket.on(
      'join-trip',
      async (
        tripId: unknown,
        ack?: (res: { ok: boolean; error?: string }) => void,
      ) => {
        if (!prisma || typeof tripId !== 'string' || !tripId) {
          ack?.({ ok: false, error: 'INVALID_TRIP' });
          return;
        }
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          include: { members: { where: { userId } } },
        });
        if (!trip || (!trip.isDemo && trip.members.length === 0)) {
          ack?.({ ok: false, error: 'FORBIDDEN' });
          return;
        }
        const roomName = `trip:${tripId}`;
        await socket.join(roomName);
        ack?.({ ok: true });
        await emitRoomPresence(roomName);
      },
    );

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('trip:')) {
          setTimeout(() => void emitRoomPresence(room), 30);
        }
      }
    });
  });

  return {
    io,
    broadcastTripChanged(tripId: string) {
      io.to(`trip:${tripId}`).emit('trip:changed', {
        tripId,
        ts: Date.now(),
      });
    },
    close() {
      return new Promise((resolve) => {
        io.close(() => resolve());
      });
    },
  };
}
