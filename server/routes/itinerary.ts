import { Router, type Request, type Response } from 'express';
import { GenerateItineraryRequestSchema } from '../../src/lib/schemas.js';
import {
  MalformedAiResponseError,
  MissingCredentialsError,
  UpstreamTimeoutError,
  type ItineraryGenerator,
} from '../services/gemini.js';

export function createItineraryRouter(generator: ItineraryGenerator): Router {
  const router = Router();

  router.post('/generate', async (req: Request, res: Response) => {
    const parsed = GenerateItineraryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      res.status(400).json({
        error: 'Please fix the invalid trip or traveller details.',
        fieldErrors: flattened.fieldErrors,
      });
      return;
    }

    try {
      const itinerary = await generator.generate(parsed.data);
      res.status(200).json({ itinerary });
    } catch (err) {
      if (err instanceof MissingCredentialsError) {
        res.status(503).json({ error: err.message });
        return;
      }
      if (err instanceof UpstreamTimeoutError) {
        res.status(504).json({ error: err.message });
        return;
      }
      if (err instanceof MalformedAiResponseError) {
        res.status(502).json({ error: err.message });
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Failed to generate itinerary.';
      res.status(502).json({ error: message });
    }
  });

  return router;
}
