type ArgumentValue = number | string | boolean | string[];
export type CliArgsObject<T extends object = Record<string, ArgumentValue>> =
  T extends never
    ? Record<string, ArgumentValue | undefined> | { _: string }
    : T;

/**
 * Converts an object with different types of values into an array of command-line arguments.
 *
 * @example
 * const args = objectToCliArgs({
 *   _: ['node', 'index.js'], // node index.js
 *   name: 'Juanita', // --name=Juanita
 *   formats: ['json', 'md'] // --format=json --format=md
 * });
 */
export function objectToCliArgs<
  T extends object = Record<string, ArgumentValue>,
>(params?: CliArgsObject<T>): string[] {
  if (!params) {
    return [];
  }

  return Object.entries(params).flatMap(([key, value]) => {
    // process/file/script
    if (key === '_') {
      return Array.isArray(value) ? value : [`${value}`];
    }
    const prefix = key.length === 1 ? '-' : '--';
    // "-*" arguments (shorthands)
    if (Array.isArray(value)) {
      return value.map(v => `${prefix}${key}="${v}"`);
    }
    // "--*" arguments ==========

    if (Array.isArray(value)) {
      return value.map(v => `${prefix}${key}="${v}"`);
    }

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, ArgumentValue>).flatMap(
        // transform nested objects to the dot notation `key.subkey`
        ([k, v]) => objectToCliArgs({ [`${key}.${k}`]: v }),
      );
    }

    if (typeof value === 'string') {
      return [`${prefix}${key}="${value}"`];
    }

    if (typeof value === 'number') {
      return [`${prefix}${key}=${value}`];
    }

    if (typeof value === 'boolean') {
      return [`${prefix}${value ? '' : 'no-'}${key}`];
    }

    if (value == null) {
      return [];
    }

    throw new Error(`Unsupported type ${typeof value} for key ${key}`);
  });
}

/**
 * Converts a schema name to PascalCase with 'Schema' suffix
 * @param name The name to convert
 * @returns PascalCase name with Schema suffix
 */
export function toPascalCaseSchemaName(name: string): string {
  // Handle 'default' special case
  if (name === 'default') {
    return 'DefaultSchema';
  }

  // If already ends with 'Schema', return as-is (but ensure PascalCase)
  if (name.toLowerCase().endsWith('schema')) {
    // Convert to PascalCase but keep 'Schema' suffix
    const SCHEMA_SUFFIX_LENGTH = 6;
    const withoutSchema = name.slice(0, -SCHEMA_SUFFIX_LENGTH); // Remove 'Schema' or 'schema'
    const pascalCase = toPascalCase(withoutSchema);
    return `${pascalCase}Schema`;
  }

  // Convert to PascalCase and add 'Schema' suffix
  const pascalCase = toPascalCase(name);
  return `${pascalCase}Schema`;
}

/**
 * Converts a string to PascalCase
 * @param str The string to convert
 * @returns PascalCase string
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, char => char.toUpperCase());
}
