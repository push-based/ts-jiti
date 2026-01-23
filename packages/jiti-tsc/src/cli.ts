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
  // ✅ TypeScript file: Use --import to enable jiti-tsc TypeScript support
  const child = spawn(
    process.execPath,
    ['--import', '@push-based/jiti-tsc', cmd, ...rest],
    { stdio: 'inherit' },
  );
  child.on('exit', code => process.exit(code ?? 1));
} else {
  // ✅ Shell command: Run directly with shell support for npm scripts/binaries
  const child = spawn(cmd, rest, {
    stdio: 'inherit',
    shell: true, // important for npm-installed binaries
  });
  child.on('exit', code => process.exit(code ?? 1));
}
