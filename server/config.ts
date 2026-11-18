import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  geminiApiKey: string | undefined;
  gcpProjectId: string | undefined;
  gcpLocation: string;
  geminiModel: string | undefined;
  aiTimeoutMs: number;
}

export function loadServerConfig(): ServerConfig {
  const port = Number(process.env.PORT ?? '3001');
  const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS ?? '30000');

  return {
    port: Number.isFinite(port) && port > 0 ? port : 3001,
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    gcpProjectId: process.env.GCP_PROJECT_ID?.trim() || undefined,
    gcpLocation: process.env.GCP_LOCATION?.trim() || 'us-central1',
    geminiModel: process.env.GEMINI_MODEL?.trim() || undefined,
    aiTimeoutMs:
      Number.isFinite(aiTimeoutMs) && aiTimeoutMs > 0 ? aiTimeoutMs : 30000,
  };
}
