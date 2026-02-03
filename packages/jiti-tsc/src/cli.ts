#!/usr/bin/env node
import { spawn } from 'node:child_process';

const [_, __, cmd, ...rest] = process.argv;

if (!cmd) {
  console.error('Usage: jiti-tsc <file|command> [...args]');
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

// Always use the register entry point for consistent loader hook behavior
const child = spawn(
  process.execPath,
  ['--import', '@push-based/jiti-tsc/register', cmd, ...rest],
  { stdio: 'inherit' },
);
child.on('exit', code => {
  // eslint-disable-next-line n/no-process-exit
  process.exit(code ?? 1);
});
