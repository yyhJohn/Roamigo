import { spawn } from 'node:child_process';
import process from 'node:process';

const viteArgs = process.argv.slice(2);
const serverPort = process.env.PORT || '3001';

const serverProc = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: serverPort },
});

const viteProc = spawn('npx', ['vite', ...viteArgs], {
  stdio: 'inherit',
  env: process.env,
});

function shutdown(signal) {
  serverProc.kill(signal);
  viteProc.kill(signal);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

serverProc.on('exit', (code) => {
  if (code !== null && code !== 0) {
    viteProc.kill('SIGTERM');
    process.exit(code);
  }
});

viteProc.on('exit', (code) => {
  serverProc.kill('SIGTERM');
  process.exit(code ?? 0);
});
