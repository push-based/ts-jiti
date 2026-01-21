import ansis from 'ansis';
import path from 'node:path';
import {
  type CompilerOptions,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from 'typescript';
import { fileExists } from '../utils/file-system.js';
import { logger } from '../utils/logger.js';

export function loadTargetConfig(tsConfigPath: string) {
  const resolvedConfigPath = path.resolve(tsConfigPath);
  const { config, error } = readConfigFile(resolvedConfigPath, sys.readFile);

  if (error) {
    throw new Error(
      `Error reading TypeScript config file at ${tsConfigPath.replace(/\\/g, '/')}:\n${error.messageText}`,
    );
  }

  const parsedConfig = parseJsonConfigFileContent(
    config,
    sys,
    path.dirname(resolvedConfigPath),
    {},
    resolvedConfigPath,
  );

  if (parsedConfig.fileNames.length === 0) {
    throw new Error(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  }

  return parsedConfig;
}

/**
 * Read tsconfig file by path and return the parsed options as JSON object
 * @param tsconfigPath
 */
export async function deriveTsConfig(
  tsconfigPath: string,
): Promise<CompilerOptions> {
  // check if tsconfig file exists
  const exists = await fileExists(tsconfigPath);
  if (!exists) {
    throw new Error(`Tsconfig file not found at path: ${tsconfigPath.replace(/\\/g, '/')}`);
  }

  const { options } = loadTargetConfig(tsconfigPath);
  return options;
}
