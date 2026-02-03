import { JITI_TSCONFIG_PATH_ENV_VAR } from './constants.js';
import { setJitiEnvVars } from './env-vars.js';
import { parseTsConfigToJitiConfig } from './import-module.js';
import { loadTargetConfig } from './load-ts-config.js';

export async function registerJitiTsconfig() {
  const tsconfigPath = process.env[JITI_TSCONFIG_PATH_ENV_VAR];

  if (tsconfigPath) {
    try {
      const { options } = loadTargetConfig(tsconfigPath);
      const jitiConfig = parseTsConfigToJitiConfig(options, tsconfigPath);
      setJitiEnvVars(jitiConfig);
    } catch (error) {
      console.warn('[jiti-tsc] Failed to load TypeScript config:', error);
    }
  }

  // Always import jiti/register for basic TypeScript support
  // It will use the environment variables we set above
  // @ts-expect-error - jiti/register is a side-effect import
  await import('jiti/register');
}
