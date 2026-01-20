#!/usr/bin/env node
import { importModule } from '@push-based/ts-jiti';
import path from 'node:path';

const configArg = process.argv[2];
const to42 = await importModule({
  filepath: path.resolve(configArg),
  tsconfig: '__test__/jiti/tsconfig.json',
});

console.log('Example: cli-load-import');
console.log(`Random number: ${to42()}`);
