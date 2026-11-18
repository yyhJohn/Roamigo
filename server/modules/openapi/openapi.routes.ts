import { Router } from 'express';
import { OPENAPI_DOCUMENT } from './openapi.spec.js';

export function createOpenApiRouter(): Router {
  const router = Router();
  router.get('/openapi.json', (_req, res) => {
    res.status(200).json(OPENAPI_DOCUMENT);
  });
  return router;
}
