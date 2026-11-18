import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, type FieldErrors } from './errors.js';
import { logger } from './logger.js';

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

export function sendOk<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiMeta,
): void {
  res.status(statusCode).json({
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function formatZodFieldErrors(error: ZodError): FieldErrors {
  const flat = error.flatten();
  const out: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      out[key] = messages;
    }
  }
  if (flat.formErrors.length > 0) {
    out._form = flat.formErrors;
  }
  return out;
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  void _next;
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the highlighted input fields.',
        fieldErrors: formatZodFieldErrors(err),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
      },
    });
    return;
  }

  logger.error('Unhandled API exception', {
    method: req.method,
    path: req.originalUrl,
    error: err instanceof Error ? err.message : String(err),
  });

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred. Please try again.',
    },
  });
}
