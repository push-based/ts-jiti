// src/core/register.ts
import path from 'node:path';
import { JITI_TSCONFIG_PATH_ENV_VAR } from './constants.js';
import { jitiOptionsFromTsConfig } from './import-module.js';
import { jitiOptionsToEnv } from './jiti.schema.js';

export async function registerJitiTsconfig() {
  const tsconfigPathEnv = process.env[JITI_TSCONFIG_PATH_ENV_VAR];
  const tsconfigPath = tsconfigPathEnv
    ? path.isAbsolute(tsconfigPathEnv)
      ? tsconfigPathEnv
      : path.resolve(process.cwd(), tsconfigPathEnv)
    : path.resolve(process.cwd(), 'tsconfig.json');

  try {
    const jitiOptions = await jitiOptionsFromTsConfig(tsconfigPath);
    const envVars = jitiOptionsToEnv(jitiOptions);

    Object.entries(envVars).forEach(
      // eslint-disable-next-line functional/immutable-data
      ([k, v]) => v != null && (process.env[k] = v)
    );
  } catch {
    console.warn(
      `[jiti-tsc] Failed to load tsconfig from ${tsconfigPath}, continuing without tsconfig`,
    );
  }

  // @ts-expect-error - jiti/register is a side-effect import
  await import('jiti/register');
}
