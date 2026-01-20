import { type JitiOptions, createJiti as createJitiSource } from 'jiti';
import { fileExists } from '../utils/file-system.js';
import {
  type MappableJitiOptions,
  parseTsConfigToJitiConfig,
} from './jiti.schema.js';
import { readTscByPath } from './read-ts-config-file.js';

/**
 * Create a jiti instance with options derived from tsconfig.
 * Used instead of direct jiti.createJiti to allow tsconfig integration.
 * @param filepath
 * @param options
 * @param jiti
 */
export async function createTsJiti(
  filepath: string,
  options: JitiOptions & { tsconfigPath?: string },
  createJiti: (typeof import('jiti'))['createJiti'] = createJitiSource,
) {
  const { tsconfigPath, ...jitiOptions } = options;
  const tsDerivedJitiOptions: MappableJitiOptions = tsconfigPath
    ? await jitiOptionsFromTsConfig(tsconfigPath)
    : {};
  return createJiti(filepath, { ...jitiOptions, ...tsDerivedJitiOptions });
}

/**
 * Read tsconfig file and parse options to jiti options
 * @param tsconfigPath
 */
export async function jitiOptionsFromTsConfig(
  tsconfigPath: string,
): Promise<MappableJitiOptions> {
  const compilerOptions = await readTscByPath(tsconfigPath);
  return parseTsConfigToJitiConfig(compilerOptions);
}

/*
 * Import a module using jiti with tsconfig support
 */
export async function importModule<T = unknown>(
  options: JitiOptions & { filepath: string; tsconfig?: string },
): Promise<T> {
  const { filepath, tsconfig, ...jitiOptions } = options;

  const exists = await fileExists(filepath);
  if (!exists) {
    throw new Error(`File '${filepath}' does not exist`);
  }

  const jitiInstance = await createTsJiti(filepath, {
    ...jitiOptions,
    tsconfigPath: tsconfig ?? '',
  });
  return (await jitiInstance.import(filepath, { default: true })) as T;
}
