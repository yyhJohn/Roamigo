export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'CSRF_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'AI_UNCONFIGURED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_UPSTREAM_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly fieldErrors?: FieldErrors;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function badRequest(message: string, fieldErrors?: FieldErrors): AppError {
  return new AppError(400, 'VALIDATION_ERROR', message, fieldErrors);
}

export function unauthenticated(message = 'Authentication required.'): AppError {
  return new AppError(401, 'UNAUTHENTICATED', message);
}

export function csrfInvalid(message = 'Invalid or missing CSRF token.'): AppError {
  return new AppError(403, 'CSRF_INVALID', message);
}

export function forbidden(
  message = 'You do not have permission to perform this action.',
): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'Requested resource was not found.'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(message: string): AppError {
  return new AppError(409, 'CONFLICT', message);
}

export function serviceUnavailable(message: string): AppError {
  return new AppError(503, 'SERVICE_UNAVAILABLE', message);
}
