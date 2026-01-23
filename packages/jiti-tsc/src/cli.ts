#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { registerJitiTsconfig } from './lib/jiti/register.js';

const [_nodePath, _scriptPath, file, ...rest] = process.argv;

if (!file) {
  console.error('Usage: jiti-tsc <file>');
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

// ensure env is prepared
await registerJitiTsconfig();

// spawn node
const child = spawn(process.execPath, [file, ...rest], { stdio: 'inherit' });
// eslint-disable-next-line n/no-process-exit
child.on('exit', code => process.exit(code ?? 1));
