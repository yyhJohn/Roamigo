const SENSITIVE_PATTERN =
  /password|secret|token|apikey|api_key|authorization|cookie|csrf/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = SENSITIVE_PATTERN.test(key)
        ? '[REDACTED]'
        : sanitizeValue(entry, depth + 1);
    }
    return out;
  }
  return value;
}

export type LogLevel = 'info' | 'warn' | 'error';

function emitLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === 'test' && level !== 'error') {
    return;
  }
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: sanitizeValue(meta) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    emitLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    emitLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    emitLog('error', message, meta),
};
