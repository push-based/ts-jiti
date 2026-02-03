// Export runtime functions for programmatic use
export { registerJitiTsconfig } from './lib/jiti/register.js';
export {
  importModule,
  createTsJiti,
  jitiOptionsFromTsConfig,
} from './lib/jiti/import-module.js';
export { loadTargetConfig } from './lib/jiti/load-ts-config.js';
export {
  JITI_TSCONFIG_PATH_ENV_VAR,
  JITI_VERBOSE_ENV_VAR,
} from './lib/jiti/constants.js';
