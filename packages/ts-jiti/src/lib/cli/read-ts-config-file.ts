import ansis from 'ansis';
import path from 'node:path';
import type { CompilerOptions } from 'typescript';
import { loadTargetConfig } from '../jiti/read-ts-config-file.js';
import { fileExists } from '../utils/file-system.js';
import { logger } from '../utils/logger.js';

/**
 * Read tsconfig file by path and return the parsed options as JSON object
 * @param tsconfigPath
 */
export async function readTscByPath(
  tsconfigPath: string,
): Promise<CompilerOptions> {
  const { options } = loadTargetConfig(tsconfigPath);
  return options;
}

export async function autoloadTsc(basename?: string): Promise<CompilerOptions> {
  const configFileName = basename
    ? `tsconfig.${basename}.json`
    : 'tsconfig.json';

  logger.debug(`Looking for default config file ${configFileName}`);

  const exists = await fileExists(configFileName);

  if (!exists) {
    logger.warn(`No ${configFileName} file present in ${process.cwd()}`);
    return {};
  }

  logger.debug(`Found default ts config file ${ansis.bold(configFileName)}`);

  return readTscByPath(path.join(process.cwd(), configFileName));
}
