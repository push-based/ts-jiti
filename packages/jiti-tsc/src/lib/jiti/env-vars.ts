import type { MappableJitiOptions } from './import-module.js';

/**
 * Sets jiti environment variables based on the provided jiti configuration.
 * These environment variables are used by jiti/register when loaded.
 * @param jitiConfig The jiti configuration options to convert to environment variables
 */
export function setJitiEnvVars(jitiConfig: MappableJitiOptions): void {
  if (jitiConfig.alias) {
    // eslint-disable-next-line functional/immutable-data
    process.env['JITI_ALIAS'] = JSON.stringify(jitiConfig.alias);
  }

  if (jitiConfig.sourceMaps !== undefined) {
    // eslint-disable-next-line functional/immutable-data
    process.env['JITI_SOURCEMAPS'] = jitiConfig.sourceMaps.toString();
  }

  if (jitiConfig.interopDefault !== undefined) {
    // eslint-disable-next-line functional/immutable-data
    process.env['JITI_INTEROPDEFAULT'] = jitiConfig.interopDefault.toString();
  }

  if (jitiConfig.jsx !== undefined) {
    // eslint-disable-next-line functional/immutable-data
    process.env['JITI_JSX'] = jitiConfig.jsx.toString();
  }
}
