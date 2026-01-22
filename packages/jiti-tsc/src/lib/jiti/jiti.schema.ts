import type { JitiOptions } from 'jiti';
import path from 'node:path';
import type { CompilerOptions } from 'typescript';


/**
 * Converts TypeScript paths configuration to jiti alias format
 * @param paths TypeScript paths object from compiler options
 * @param baseUrl Base URL for resolving relative paths
 * @returns Jiti alias object with absolute paths
 */
export function mapTsPathsToJitiAlias(
  paths: Record<string, string[]>,
  baseUrl: string,
): Record<string, string> {
  return Object.entries(paths).reduce(
    (aliases, [pathPattern, pathMappings]) => {
      if (!Array.isArray(pathMappings) || pathMappings.length === 0) {
        return aliases;
      }
      // Jiti does not support overloads (multiple mappings for the same path pattern)
      if (pathMappings.length > 1) {
        throw new Error(
          `TypeScript path overloads are not supported by jiti. Path pattern '${pathPattern}' has ${pathMappings.length} mappings: ${pathMappings.join(', ')}. Jiti only supports a single alias mapping per pattern.`,
        );
      }
      const aliasKey = pathPattern.replace(/\/\*$/, '');
      const aliasValue = (pathMappings.at(0) as string).replace(/\/\*$/, '');
      return {
        ...aliases,
        [aliasKey]: path.isAbsolute(aliasValue)
          ? aliasValue
          : path.resolve(baseUrl, aliasValue),
      };
    },
    {} satisfies Record<string, string>,
  );
}

/**
 * Maps TypeScript JSX emit mode to Jiti JSX boolean option
 * @param tsJsxMode TypeScript JsxEmit enum value (0-5)
 * @returns true if JSX processing should be enabled, false otherwise
 */
export const mapTsJsxToJitiJsx = (tsJsxMode: number): boolean =>
  tsJsxMode !== 0;

/**
 * Possible TS to jiti options mapping
 * | Jiti Option       | Jiti Type               | TS Option              | TS Type                  | Description |
 * |-------------------|-------------------------|-----------------------|--------------------------|-------------|
 * | alias             | Record<string, string> | paths                 | Record<string, string[]> | Module path aliases for module resolution. |
 * | interopDefault    | boolean                 | esModuleInterop       | boolean                  | Enable default import interop. |
 * | sourceMaps        | boolean                 | sourceMap             | boolean                  | Enable sourcemap generation. |
 * | jsx               | boolean                 | jsx                   | JsxEmit (0-5)           | TS JsxEmit enum (0-5) => boolean JSX processing. |
 */
export type MappableJitiOptions = Partial<
  Pick<JitiOptions, 'alias' | 'interopDefault' | 'sourceMaps' | 'jsx'>
>;

/**
 * Parse TypeScript compiler options to mappable jiti options
 * @param compilerOptions TypeScript compiler options
 * @param tsconfigDir Directory of the tsconfig file (for resolving relative baseUrl)
 * @returns Mappable jiti options
 */
export function parseTsConfigToJitiConfig(
  compilerOptions: CompilerOptions,
  tsconfigDir?: string,
): MappableJitiOptions {
  const paths = compilerOptions.paths || {};
  const baseUrl = compilerOptions.baseUrl
    ? path.isAbsolute(compilerOptions.baseUrl)
      ? compilerOptions.baseUrl
      : tsconfigDir
        ? path.resolve(tsconfigDir, compilerOptions.baseUrl)
        : path.resolve(process.cwd(), compilerOptions.baseUrl)
    : tsconfigDir || process.cwd();

  return {
    ...(Object.keys(paths).length > 0
      ? {
          alias: mapTsPathsToJitiAlias(paths, baseUrl),
        }
      : {}),
    ...(compilerOptions.esModuleInterop == null
      ? {}
      : { interopDefault: compilerOptions.esModuleInterop }),
    ...(compilerOptions.sourceMap == null
      ? {}
      : { sourceMaps: compilerOptions.sourceMap }),
    ...(compilerOptions.jsx == null
      ? {}
      : { jsx: mapTsJsxToJitiJsx(compilerOptions.jsx) }),
  };
}

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
