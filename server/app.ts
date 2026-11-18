import type { PrismaClient } from '@prisma/client';
import express, { type Express } from 'express';
import type { ServerConfig } from './config.js';
import { errorMiddleware } from './lib/http.js';
import {
  applySecurityMiddleware,
  createScopedRateLimiter,
} from './middleware/security.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createOpenApiRouter } from './modules/openapi/openapi.routes.js';
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

  const generator = generatorOverride ?? createGeminiGenerator(config);
  const aiLimiter = createScopedRateLimiter(config, 15, 60_000);

  app.use('/api/health', createHealthRouter(config, deps?.prisma));
  app.use('/api', createOpenApiRouter());
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
