import { registerJitiTsconfig } from './lib/jiti/register.js';

// DX safety net: warn about incorrect usage with npm/npx
if (process.env['npm_execpath']) {
  console.warn(
    '[jiti-tsc] Detected npm/npx execution. ' +
    'Do not use --import jiti-tsc with npm.',
  );
}

try {
  await registerJitiTsconfig();
} catch (error) {
  console.error('[jiti-tsc] Failed to register:', error);
  throw error;
}
