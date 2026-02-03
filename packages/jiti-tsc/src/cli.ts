#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [, , cmd, ...rest] = process.argv;

if (!cmd) {
  console.error('Usage: jiti-tsc <file|command> [...args]');
  process.exit(1);
}

// Detect if the first argument is a TypeScript file or a command
// This allows the CLI to work in two modes:
// 1. jiti-tsc file.ts → runs TypeScript files with jiti support
// 2. jiti-tsc command args → runs shell commands (npm scripts, binaries, etc.)
const isFile =
  fs.existsSync(cmd) &&
  fs.statSync(cmd).isFile() &&
  /\.(ts|tsx|mts|cts)$/.test(cmd);

if (isFile) {
  const child = spawn(
    process.execPath,
    ['--import', '@push-based/jiti-tsc/register', cmd, ...rest],
    { stdio: 'inherit' },
  );
  child.on('exit', code => process.exit(code ?? 1));
} else {
  const child = spawn(cmd, rest, {
    stdio: 'inherit',
    shell: true, // important for npm-installed binaries on windows
  });
  child.on('exit', code => process.exit(code ?? 1));
}
