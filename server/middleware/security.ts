import cookieParser from 'cookie-parser';
import type { Express, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { ServerConfig } from '../config.js';

export function applySecurityMiddleware(
  app: Express,
  config: ServerConfig,
): void {
  app.disable('x-powered-by');
  if (config.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'blob:'],
          workerSrc: ["'self'", 'blob:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: [
            "'self'",
            'ws:',
            'wss:',
            'https://tiles.openfreemap.org',
            'https://demotiles.maplibre.org',
            'https://nominatim.openstreetmap.org',
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser());

  const allowedOrigin = config.appOrigin || 'http://127.0.0.1:8080';
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, X-CSRF-Token',
      );
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      );
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });
}

export function createScopedRateLimiter(
  config: ServerConfig,
  maxRequests: number,
  windowMs = 60_000,
): RequestHandler {
  const isTestBypassed =
    (config.nodeEnv === 'test' || process.env.NODE_ENV === 'test') &&
    !config.enableRateLimitsInTest;

  if (isTestBypassed) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment and try again.',
      },
    },
  });
}
