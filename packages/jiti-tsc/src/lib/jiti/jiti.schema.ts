import type { JitiOptions } from 'jiti';

/**
 * Converts jiti options to environment variables for the jiti CLI
 * @param options Jiti options to convert
 * @returns Environment variables object
 */
export function jitiOptionsToEnv(options: JitiOptions): Record<string, string> {
  return {
    ...(options.alias && { JITI_ALIAS: JSON.stringify(options.alias) }),
    ...(options.interopDefault !== undefined && {
      JITI_INTEROP_DEFAULT: options.interopDefault ? '1' : '0',
    }),
    ...(options.sourceMaps !== undefined && {
      JITI_SOURCE_MAPS: options.sourceMaps ? '1' : '0',
    }),
    ...(options.jsx !== undefined && { JITI_JSX: options.jsx ? '1' : '0' }),
  };
}

/**
 *
 * @param env
 */
export function filterJitiEnvVars(
  env: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith('JITI_'))
      .map(([key, value]) => [key.replace('JITI_', ''), value]),
  ) as Record<string, string>;
}
