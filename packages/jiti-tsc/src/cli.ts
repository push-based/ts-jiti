#!/usr/bin/env node
import { spawn } from 'node:child_process';

const [_nodePath, _scriptPath, file, ...rest] = process.argv;

if (!file) {
  console.error('Usage: jiti-tsc <file>');
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

const child = spawn(process.execPath, [file, ...rest], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env['NODE_OPTIONS'], '--import @push-based/jiti-tsc']
      .filter(Boolean)
      .join(' '),
  },
});
// eslint-disable-next-line n/no-process-exit
child.on('exit', code => process.exit(code ?? 1));
