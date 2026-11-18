import type { PrismaClient } from '@prisma/client';
import express, { type Express } from 'express';
import type { ServerConfig } from './config.js';
import { errorMiddleware } from './lib/http.js';
import { createSessionHydrator } from './middleware/auth.js';
import {
  applySecurityMiddleware,
  createScopedRateLimiter,
} from './middleware/security.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createInvitationsRouter } from './modules/invitations/invitations.routes.js';
import { createMembersRouter } from './modules/members/members.routes.js';
import { createOpenApiRouter } from './modules/openapi/openapi.routes.js';
import { createTripsRouter } from './modules/trips/trips.routes.js';
import { createItineraryRouter } from './routes/itinerary.js';
import {
  createGeminiGenerator,
  type ItineraryGenerator,
} from './services/gemini.js';

export interface AppDependencies {
  prisma?: PrismaClient;
}

export function createApp(
  config: ServerConfig,
  generatorOverride?: ItineraryGenerator,
  deps?: AppDependencies,
): Express {
  const app = express();

  applySecurityMiddleware(app, config);

  app.use('/api/itinerary', express.json({ limit: '1mb' }));
  app.use('/api/trips/import-local', express.json({ limit: '1mb' }));
  app.use(express.json({ limit: '100kb' }));
  app.use(createSessionHydrator(deps?.prisma));

  const generator = generatorOverride ?? createGeminiGenerator(config);
  const aiLimiter = createScopedRateLimiter(config, 15, 60_000);

  app.use('/api/health', createHealthRouter(config, deps?.prisma));
  app.use('/api', createOpenApiRouter());
  app.use('/api/auth', createAuthRouter(config, deps?.prisma));
  app.use('/api/trips', createTripsRouter(deps?.prisma));
  app.use('/api', createInvitationsRouter(config, deps?.prisma));
  app.use('/api', createMembersRouter(deps?.prisma));
  app.use('/api/itinerary', aiLimiter, createItineraryRouter(generator));

  app.use('/api/*', (_req, res) => {
    res.status(404).json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'API endpoint not found.',
      },
    });
  });

  app.use(errorMiddleware);

  return app;
}
