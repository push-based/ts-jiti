import { registerJitiTsconfig } from './lib/jiti/register.js';

try {
  await registerJitiTsconfig();
} catch (error) {
  console.error('[jiti-tsc] Failed to register:', error);
  throw error;
}
