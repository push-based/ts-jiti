import ansis from 'ansis';
import path from 'node:path';
import { z } from 'zod';
import { fileExists, readJsonFile } from '../utils/file-system.js';
import { logger } from '../utils/logger.js';
import { SUPPORTED_TS_CONFIG_FILE_FORMATS, tsconfig } from './constant.js';

export const tsConfigOptionsForJitiSchema = z.record(z.any());

export type TsConfigOptionsForJiti = z.infer<
  typeof tsConfigOptionsForJitiSchema
>;

/**
 * Read tsconfig file by path and return the parsed options as JSON object
 * @param tsconfigPath
 */
export async function readTscByPath(
  tsconfigPath?: string,
): Promise<TsConfigOptionsForJiti> {
  const formattedTarget = [
    tsconfigPath && `${ansis.bold(path.relative(process.cwd(), tsconfigPath))}`,
  ]
    .filter(Boolean)
    .join(' ');

  // eslint-disable-next-line functional/no-let
  let result;
  await logger.task(`Importing config from ${formattedTarget}`, async () => {
    // For JSON files, use readJsonFile instead of bundleRequire
    result = await readJsonFile(tsconfigPath);

    return result;
  });

  return result;
}

export async function autoloadTsc(
  basename?: string,
): Promise<TsConfigOptionsForJiti> {
  const configFilePatterns = [
    'tsconfig',
    ...(basename ? [basename] : []),
    `{${SUPPORTED_TS_CONFIG_FILE_FORMATS.join(',')}}`,
  ].join('.');

  logger.debug(`Looking for default config file ${configFilePatterns}`);

  // eslint-disable-next-line functional/no-let
  let ext = '';
  // eslint-disable-next-line functional/no-loop-statements
  for (const extension of SUPPORTED_TS_CONFIG_FILE_FORMATS) {
    const filePath = `${tsconfig}.${extension}`;
    const exists = await fileExists(filePath);

    if (exists) {
      logger.debug(`Found default ts config file ${ansis.bold(filePath)}`);
      ext = extension;
      break;
    }
  }

  if (!ext) {
    logger.warn(`No ${configFilePatterns} file present in ${process.cwd()}`);
    return {};
  }

  return readTscByPath(path.join(process.cwd(), `${tsconfig}.${ext}`));
}

export const jitiOptionsSchema = z.object({
  alias: z.record(z.string()).optional(),
});

export type JitiOptions = z.infer<typeof jitiOptionsSchema>;

export function parseTsConfigToJitiConfig(
  tsConfig: TsConfigOptionsForJiti,
): JitiOptions | undefined {
  // Extract paths from tsconfig and create jiti alias options
  const compilerOptions = tsConfig?.compilerOptions || {};
  const paths = compilerOptions.paths || {};

  if (Object.keys(paths).length > 0) {
    // Convert tsconfig paths to jiti alias format
    const alias = Object.entries(paths).reduce(
      (acc, [pathPattern, pathMappings]) => {
        if (Array.isArray(pathMappings) && pathMappings.length > 0) {
          // Remove the /* from the end if present
          const aliasKey = pathPattern.replace(/\/\*$/, '');
          const aliasValue = pathMappings[0].replace(/\/\*$/, '');
          return { ...acc, [aliasKey]: aliasValue };
        }
        return acc;
      },
      {} satisfies Record<string, string>,
    );
    return { alias };
  }
  return undefined;
}
