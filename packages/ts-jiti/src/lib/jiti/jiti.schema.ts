import type { JitiOptions } from 'jiti';
import path from 'node:path';
import type { CompilerOptions, JsxEmit } from 'typescript';

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
  return Object.fromEntries(
    Object.entries(paths)
      .filter(
        ([, pathMappings]) =>
          Array.isArray(pathMappings) && pathMappings.length > 0,
      )
      .map(([pathPattern, pathMappings]) => {
        // Remove the /* from the end if present
        const aliasKey = pathPattern.replace(/\/\*$/, '');
        const aliasValue = pathMappings[0]!.replace(/\/\*$/, ''); // We know this exists due to filter

        // Resolve relative paths to absolute paths
        const resolvedAliasValue = path.isAbsolute(aliasValue)
          ? aliasValue
          : path.resolve(baseUrl, aliasValue);

        return [aliasKey, resolvedAliasValue];
      }),
  );
}

/**
 * Possible TS to jiti options mapping
 * | Jiti Option       | TypeScript Option         | Description |
 * |-------------------|---------------------------|-------------|
 * | alias             | paths                    | Module path aliases for module resolution. |
 * | interopDefault    | esModuleInterop         | Enable default import interop. |
 * | sourceMaps        | sourceMap               | Enable sourcemap generation. |
 * | jsx               | jsx                     | JSX emit mode and settings. |
 */
export type MappableJitiOptions = Partial<
  Pick<JitiOptions, 'alias' | 'interopDefault' | 'sourceMaps' | 'jsx'>
>;

/**
 * Parse TypeScript compiler options to mappable jiti options
 * @param compilerOptions TypeScript compiler options
 * @returns Mappable jiti options
 */
export function parseTsConfigToJitiConfig(
  compilerOptions: CompilerOptions,
): MappableJitiOptions {
  const paths = compilerOptions.paths || {};

  return {
    ...(Object.keys(paths).length > 0
      ? {
          alias: mapTsPathsToJitiAlias(
            paths,
            compilerOptions.baseUrl || process.cwd(),
          ),
        }
      : {}),
    ...(compilerOptions.esModuleInterop == null
      ? {}
      : { interopDefault: compilerOptions.esModuleInterop }),
    ...(compilerOptions.sourceMap == null
      ? {}
      : { sourceMaps: compilerOptions.sourceMap }),
    ...(compilerOptions.jsx != null &&
      compilerOptions.jsx !== 0 &&
      compilerOptions.jsx !== 'none'
      ? { jsx: true }
      : {}),
  };
}
