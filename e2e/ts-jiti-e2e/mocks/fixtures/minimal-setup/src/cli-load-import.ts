#!/usr/bin/env node
import { importModule } from '@push-based/ts-jiti';

const configArg = process.argv[2];
const to42 = await importModule({
  filepath: configArg,
  tsconfig: './tsconfig.json',
});

console.log('Example: cli-load-import');
console.log(`Random number: ${to42()}`);
