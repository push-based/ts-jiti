#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { registerJitiTsconfig } from './lib/jiti/register.js';

const [, , file, ...rest] = process.argv;

if (!file) {
  console.error('Usage: jiti-tsc <file>');
  process.exit(1);
}

// ensure env is prepared
await registerJitiTsconfig();

// spawn node
const child = spawn(
  process.execPath,
  [file, ...rest],
  { stdio: 'inherit' },
);

child.on('exit', code => process.exit(code ?? 1));
