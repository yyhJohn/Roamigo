import type { PrismaClient } from '@prisma/client';
import express, { type Express } from 'express';
import type { ServerConfig } from './config.js';
import { errorMiddleware } from './lib/http.js';
import { createSessionHydrator } from './middleware/auth.js';
import {
  applySecurityMiddleware,
  createScopedRateLimiter,
} from './middleware/security.js';
import { createActivitiesRouter } from './modules/activities/activities.routes.js';
import { createTravelAiProvider } from './modules/ai/ai.factory.js';
import { createWorkspaceAiRouter } from './modules/ai/ai.routes.js';
import type { TravelAIProvider } from './modules/ai/ai.types.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createExpensesRouter } from './modules/expenses/expenses.routes.js';
import { createExportsRouter } from './modules/exports/exports.routes.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createInvitationsRouter } from './modules/invitations/invitations.routes.js';
import { createMapsRouter } from './modules/maps/maps.routes.js';
import { createMembersRouter } from './modules/members/members.routes.js';
import { createOpenApiRouter } from './modules/openapi/openapi.routes.js';
import { createTripsRouter } from './modules/trips/trips.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createVotesRouter } from './modules/votes/votes.routes.js';
import { createItineraryRouter } from './routes/itinerary.js';
import {
  createGeminiGenerator,
  type ItineraryGenerator,
} from './services/gemini.js';

export interface AppDependencies {
  prisma?: PrismaClient;
  aiProvider?: TravelAIProvider;
  onTripChanged?: (tripId: string) => void;
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
  const aiProvider = deps?.aiProvider ?? createTravelAiProvider(config);
  const aiLimiter = createScopedRateLimiter(config, 15, 60_000);

  app.use('/api/health', createHealthRouter(config, deps?.prisma));
  app.use('/api', createOpenApiRouter());
  app.use('/api/auth', createAuthRouter(config, deps?.prisma));
  app.use('/api/users', createUsersRouter(config, deps?.prisma));
  app.use('/api/trips', createTripsRouter(deps?.prisma));
  app.use('/api', createExportsRouter(deps?.prisma));
  app.use(
    '/api',
    createInvitationsRouter(config, deps?.prisma, deps?.onTripChanged),
  );
  app.use('/api', createMembersRouter(deps?.prisma));
  app.use('/api', createActivitiesRouter(deps?.prisma, deps?.onTripChanged));
  app.use('/api', createVotesRouter(deps?.prisma, deps?.onTripChanged));
  app.use('/api', createExpensesRouter(deps?.prisma, deps?.onTripChanged));
  app.use('/api', createMapsRouter(config, deps?.prisma));
  app.use(
    '/api',
    createWorkspaceAiRouter(
      config,
      aiProvider,
      deps?.prisma,
      deps?.onTripChanged,
    ),
  );
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
