import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { resolveAiStatus, type ServerConfig } from '../../config.js';
import { sendOk } from '../../lib/http.js';

export async function checkDatabaseConnection(
  prisma?: PrismaClient,
): Promise<boolean> {
  if (!prisma) {
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export function createHealthRouter(
  config: ServerConfig,
  prisma?: PrismaClient,
): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const ai = resolveAiStatus(config);
    if (!prisma) {
      res.status(200).json({
        ok: true,
        aiConfigured: ai.aiConfigured,
        provider: ai.provider,
      });
      return;
    }
    const dbConnected = await checkDatabaseConnection(prisma);
    res.status(200).json({
      ok: true,
      dbConnected,
      aiConfigured: ai.aiConfigured,
      provider: ai.provider,
    });
  });

  router.get('/ready', async (_req, res) => {
    const ai = resolveAiStatus(config);
    const dbConnected = await checkDatabaseConnection(prisma);
    if (prisma && !dbConnected) {
      res.status(503).json({
        ok: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'PostgreSQL database is unreachable.',
        },
      });
      return;
    }
    sendOk(res, {
      status: 'ready',
      dbConnected,
      aiConfigured: ai.aiConfigured,
      provider: ai.provider,
      version: '1.0.0-rc',
    });
  });

  return router;
}
