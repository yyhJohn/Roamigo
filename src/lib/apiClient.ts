let memoryCsrfToken: string | null = null;

export function setMemoryCsrfToken(token: string | null): void {
  memoryCsrfToken = token;
}

export function getMemoryCsrfToken(): string | null {
  return memoryCsrfToken;
}

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

interface EnvelopeSuccess<T> {
  ok: true;
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number };
}

interface EnvelopeError {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (method !== 'GET' && memoryCsrfToken) {
    headers['X-CSRF-Token'] = memoryCsrfToken;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const payload = (await res.json().catch(() => null)) as
    | EnvelopeSuccess<T>
    | EnvelopeError
    | null;

  if (!res.ok || !payload || payload.ok === false) {
    const errObj =
      payload && 'error' in payload
        ? payload.error
        : {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${res.status}`,
          };
    throw new ApiClientError(
      res.status,
      errObj.code,
      errObj.message,
      errObj.fieldErrors,
    );
  }

  return payload.data;
}
