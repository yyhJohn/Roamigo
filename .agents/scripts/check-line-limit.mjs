import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

let inputRaw = '';
for await (const chunk of process.stdin) {
  inputRaw += chunk;
}

try {
  const payload = inputRaw ? JSON.parse(inputRaw) : {};
  const targetPath = payload?.toolCall?.args?.Path;
  if (typeof targetPath === 'string') {
    const normalized = path.resolve(targetPath);
    const isSource =
      (normalized.includes('/src/') || normalized.includes('/server/')) &&
      (normalized.endsWith('.ts') || normalized.endsWith('.tsx'));

    if (isSource && fs.existsSync(normalized)) {
      const lines = fs.readFileSync(normalized, 'utf8').split('\n').length;
      if (lines > 200) {
        process.stderr.write(
          `AGENTS.md violation: ${path.basename(normalized)} has ${lines} lines (max 200).\n`,
        );
        process.stdout.write(JSON.stringify({}) + '\n');
        process.exit(1);
      }
    }
  }
} catch {
  // Do not break unrelated tool calls on stdin parse error
}

process.stdout.write(JSON.stringify({}) + '\n');
