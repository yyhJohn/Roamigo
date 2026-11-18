import dotenv from 'dotenv';

dotenv.config();

export type ConfiguredAiProvider =
  | 'gemini-api'
  | 'vertex-ai'
  | 'openai'
  | 'openai-compatible'
  | 'unconfigured';

export interface ServerConfig {
  port: number;
  geminiApiKey: string | undefined;
  gcpProjectId: string | undefined;
  gcpLocation: string;
  geminiModel: string | undefined;
  aiTimeoutMs: number;
  nodeEnv?: string;
  appOrigin?: string;
  databaseUrl?: string;
  sessionSecret?: string;
  sessionTtlDays?: number;
  aiProvider?: string;
  aiModel?: string;
  aiApiKey?: string;
  aiBaseUrl?: string;
  openaiApiKey?: string;
  geocodingProvider?: string;
  geocodingUserAgent?: string;
  smtpHost?: string;
  googleClientId?: string;
  enableRateLimitsInTest?: boolean;
}

export function resolveAiStatus(config: ServerConfig): {
  provider: ConfiguredAiProvider;
  aiConfigured: boolean;
  model: string | undefined;
} {
  const explicit = config.aiProvider?.trim().toLowerCase();
  const model = config.aiModel || config.geminiModel;

  if (explicit === 'openai-compatible') {
    const ok = Boolean(config.aiBaseUrl && model);
    return { provider: ok ? 'openai-compatible' : 'unconfigured', aiConfigured: ok, model };
  }
  if (explicit === 'openai' || (!explicit && config.openaiApiKey)) {
    const key = config.aiApiKey || config.openaiApiKey;
    const ok = Boolean(key && model);
    return { provider: key ? 'openai' : 'unconfigured', aiConfigured: ok, model };
  }
  if (explicit === 'gemini-api' || (!explicit && (config.geminiApiKey || config.aiApiKey))) {
    const key = config.geminiApiKey || config.aiApiKey;
    const ok = Boolean(key && model);
    return { provider: key ? 'gemini-api' : 'unconfigured', aiConfigured: ok, model };
  }
  if (explicit === 'vertex-ai' || (!explicit && config.gcpProjectId)) {
    const ok = Boolean(config.gcpProjectId && model);
    return { provider: config.gcpProjectId ? 'vertex-ai' : 'unconfigured', aiConfigured: ok, model };
  }
  return { provider: 'unconfigured', aiConfigured: false, model };
}

export function loadServerConfig(): ServerConfig {
  const port = Number(process.env.PORT ?? '3001');
  const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS ?? '30000');
  const sessionTtlDays = Number(process.env.SESSION_TTL_DAYS ?? '14');

  return {
    port: Number.isFinite(port) && port > 0 ? port : 3001,
    nodeEnv: process.env.NODE_ENV?.trim() || 'development',
    appOrigin: process.env.APP_ORIGIN?.trim() || 'http://127.0.0.1:8080',
    databaseUrl: process.env.DATABASE_URL?.trim() || undefined,
    sessionSecret:
      process.env.SESSION_SECRET?.trim() ||
      'dev-fallback-session-secret-change-in-production',
    sessionTtlDays:
      Number.isFinite(sessionTtlDays) && sessionTtlDays > 0 ? sessionTtlDays : 14,
    aiProvider: process.env.AI_PROVIDER?.trim() || undefined,
    aiModel: process.env.AI_MODEL?.trim() || undefined,
    aiApiKey: process.env.AI_API_KEY?.trim() || undefined,
    aiBaseUrl: process.env.AI_BASE_URL?.trim() || undefined,
    openaiApiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    gcpProjectId: process.env.GCP_PROJECT_ID?.trim() || undefined,
    gcpLocation: process.env.GCP_LOCATION?.trim() || 'us-central1',
    geminiModel: process.env.GEMINI_MODEL?.trim() || undefined,
    aiTimeoutMs:
      Number.isFinite(aiTimeoutMs) && aiTimeoutMs > 0 ? aiTimeoutMs : 30000,
    geocodingProvider: process.env.GEOCODING_PROVIDER?.trim() || 'curated',
    geocodingUserAgent:
      process.env.GEOCODING_USER_AGENT?.trim() || 'Roamigo/1.0',
    smtpHost: process.env.SMTP_HOST?.trim() || undefined,
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || undefined,
  };
}
