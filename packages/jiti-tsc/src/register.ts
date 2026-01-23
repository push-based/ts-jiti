import path from 'node:path';
import { JITI_TSCONFIG_PATH_ENV_VAR } from './lib/jiti/constants.js';
import { jitiOptionsFromTsConfig } from './lib/jiti/import-module.js';
import { jitiOptionsToEnv } from './lib/jiti/jiti.schema.js';

/**
 * Register jiti loader with tsconfig support for use with Node.js --import flag
 *
 * Usage:
 *   NODE_OPTIONS="--import jiti-tsc/register" node your-file.ts
 *
 * Or in package.json:
 *   "env": {
 *     "NODE_OPTIONS": "--import jiti-tsc/register"
 *   }
 *
 * The tsconfig path can be specified via JITI_TSCONFIG_PATH environment variable.
 * Defaults to ./tsconfig.json if not specified.
 */
async function register() {
  const tsconfigPathEnv = process.env[JITI_TSCONFIG_PATH_ENV_VAR];
  const tsconfigPath = tsconfigPathEnv
    ? path.isAbsolute(tsconfigPathEnv)
      ? tsconfigPathEnv
      : path.resolve(process.cwd(), tsconfigPathEnv)
    : path.resolve(process.cwd(), 'tsconfig.json');

  try {
    const jitiOptions = await jitiOptionsFromTsConfig(tsconfigPath);
    const envVars = jitiOptionsToEnv(jitiOptions);
    Object.entries(envVars).forEach(([key, value]) => {
      if (value !== undefined) {
        // eslint-disable-next-line functional/immutable-data
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.warn(
      `[jiti-tsc] Failed to load tsconfig from ${tsconfigPath}, registering jiti without tsconfig options:`,
      error,
    );
  }

  // Import and register jiti loader
  // jiti/register will read the environment variables we set above
  // Using dynamic import to avoid TypeScript module resolution issues
  await import('jiti/register' as string);
}

// Execute registration
// Node's --import flag will wait for this async operation to complete
try {
  await register();
} catch (error) {
  console.error('[jiti-tsc] Failed to register loader:', error);
  throw error;
}
