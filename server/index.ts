import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { loadServerConfig } from './config.js';
import { disconnectPrisma, getPrismaClient } from './db/prisma.js';
import { logger } from './lib/logger.js';
import { attachTripRealtimeHub, type TripRealtimeHub } from './realtime/socketServer.js';

const config = loadServerConfig();
const prisma = config.databaseUrl
  ? getPrismaClient(config.databaseUrl)
  : undefined;

const hubRef: { current?: TripRealtimeHub } = {};
const app = createApp(config, undefined, {
  prisma,
  onTripChanged: (tripId) => hubRef.current?.broadcastTripChanged(tripId),
});

if (process.env.NODE_ENV === 'production') {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(currentDir, '../../dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const httpServer = http.createServer(app);
hubRef.current = attachTripRealtimeHub(httpServer, config, prisma);

httpServer.listen(config.port, () => {
  logger.info(`Roamigo API + Realtime server listening on port ${config.port}`, {
    port: config.port,
    dbConfigured: Boolean(config.databaseUrl),
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Shutting down server (${signal})`);
  await hubRef.current?.close();
  httpServer.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
