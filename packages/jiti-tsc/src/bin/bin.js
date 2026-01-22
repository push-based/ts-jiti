#!/usr/bin/env node
import { runCli } from '../lib/cli/cli.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
runCli().catch(error => {
  console.error(error.message);
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
});
