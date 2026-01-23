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

    for (const [key, value] of Object.entries(envVars)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn(
      `[jiti-tsc] Failed to load tsconfig from ${tsconfigPath}, continuing without tsconfig`,
    );
  }

  // @ts-ignore - jiti/register is a side-effect import
  await import('jiti/register');
}
