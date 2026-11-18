import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { loadServerConfig } from './config.js';
import { disconnectPrisma, getPrismaClient } from './db/prisma.js';
import { logger } from './lib/logger.js';

const config = loadServerConfig();
const prisma = config.databaseUrl
  ? getPrismaClient(config.databaseUrl)
  : undefined;
const app = createApp(config, undefined, { prisma });

if (process.env.NODE_ENV === 'production') {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(currentDir, '../../dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const httpServer = http.createServer(app);

httpServer.listen(config.port, () => {
  logger.info(`Roamigo API server listening on port ${config.port}`, {
    port: config.port,
    dbConfigured: Boolean(config.databaseUrl),
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Shutting down server (${signal})`);
  httpServer.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
