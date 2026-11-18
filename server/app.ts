import express, { type Express } from 'express';
import type { ServerConfig } from './config.js';
import { createItineraryRouter } from './routes/itinerary.js';
import {
  createGeminiGenerator,
  type ItineraryGenerator,
} from './services/gemini.js';

export function createApp(
  config: ServerConfig,
  generatorOverride?: ItineraryGenerator,
): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const generator = generatorOverride ?? createGeminiGenerator(config);

  app.get('/api/health', (_req, res) => {
    const provider = config.geminiApiKey
      ? 'gemini-api'
      : config.gcpProjectId
        ? 'vertex-ai'
        : 'unconfigured';
    res.status(200).json({
      ok: true,
      aiConfigured: Boolean(
        (config.geminiApiKey || config.gcpProjectId) && config.geminiModel,
      ),
      provider,
    });
  });

  app.use('/api/itinerary', createItineraryRouter(generator));

  return app;
}
