import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function countCodeLines(source) {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutBlockComments
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//')).length;
}

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
      const codeLines = countCodeLines(fs.readFileSync(normalized, 'utf8'));
      if (codeLines > 200) {
        process.stderr.write(
          `AGENTS.md violation: ${path.basename(normalized)} has ${codeLines} code lines (max 200 excluding blanks/comments).\n`,
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
