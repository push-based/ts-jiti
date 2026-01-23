#!/usr/bin/env node
import { spawn } from 'node:child_process';

const [_nodePath, _scriptPath, file, ...rest] = process.argv;

if (!file) {
  console.error('Usage: jiti-tsc <file>');
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [
    '--import',
    '@push-based/jiti-tsc',
    file,
    ...rest,
  ],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', code => process.exit(code ?? 1));
