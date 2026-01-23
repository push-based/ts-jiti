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
  // If registration fails (e.g., when not loaded as --import), try to handle gracefully
  console.warn('[jiti-tsc] Registration failed, continuing without TypeScript support:', error instanceof Error ? error.message : String(error));
  // Don't throw - allow the process to continue
}
