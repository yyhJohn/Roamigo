import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { loadServerConfig } from './config.js';
import { createApp } from './app.js';

const config = loadServerConfig();
const app = createApp(config);

if (process.env.NODE_ENV === 'production') {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(currentDir, '../../dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`Roamigo API server listening on port ${config.port}`);
});
