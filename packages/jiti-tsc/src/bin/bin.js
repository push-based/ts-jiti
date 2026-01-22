#!/usr/bin/env node
import { runCli } from '../lib/cli/cli.js';
import { logger } from '../lib/utils/logger.js';


// eslint-disable-next-line unicorn/prefer-top-level-await
runCli().catch(error => {
  logger.error(error.message);
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
});
