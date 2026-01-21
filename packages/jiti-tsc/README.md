# @push-based/jiti-tsc

TypeScript path aliases don't work at runtime. **jiti-tsc** bridges this gap by converting `tsconfig.json` paths into jiti-compatible aliases for perfect monorepo execution.

## Features

This library does one simple thing: it converts TypeScript path aliases to jiti-compatible alias options and wrapd the original jiti API to make it easier to use in monorepo environments.

## Installation

```bash
npm install @push-based/jiti-tsc
```

## Quick Start

### CLI Usage

```bash
# Print resolved jiti configuration from tsconfig.json
npx jiti-tsc print-config --tsconfig=./tsconfig.json

# Print resolved jiti options from terminal args as well as configuration from tsconfig.json
npx jiti-tsc print-config --tsconfig=./tsconfig.json


# Print configuration to a file
npx jiti-tsc print-config --tsconfig=./tsconfig.json --output=./resolved-config.json

# Run jiti with tsconfig-derived options (via environment variable)
JITI_TS_CONFIG_PATH=./tsconfig.json npx jiti-tsc jiti ./path/to/module.ts

# Run jiti without tsconfig (uses default resolution)
npx jiti-tsc jiti ./path/to/module.ts

# Display help information
npx jiti-tsc help
```

## CLI Commands

### `print-config`

Loads a TypeScript configuration file and prints the resolved jiti options.

```bash
# Print to stdout
npx jiti-tsc print-config --tsconfig=./tsconfig.json

# Print to file
npx jiti-tsc print-config --tsconfig=./tsconfig.json --output=./resolved-config.json

# Use environment variable for tsconfig path
JITI_TS_CONFIG_PATH=./tsconfig.json npx jiti-tsc print-config
```

### `jiti`

Runs the jiti command line tool with options derived from a TypeScript configuration file.

**Note:** The `--tsconfig` argument is not passed to the jiti command. Use the `JITI_TS_CONFIG_PATH` environment variable to specify the tsconfig path.

```bash
# Run jiti with tsconfig options (tsconfig path via environment variable)
JITI_TS_CONFIG_PATH=./tsconfig.json npx jiti-tsc jiti ./path/to/module.ts

# Run jiti without tsconfig (uses default resolution)
npx jiti-tsc jiti ./path/to/module.ts
```

### `help`

Displays help information.

```bash
npx jiti-tsc help
npx jiti-tsc --help
npx jiti-tsc -h
```

## CLI Options

| Option              | Type      | Description                                                               |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| `--tsconfig <path>` | `string`  | Path to TypeScript configuration file to load (for `print-config` command only) |
| `--output <path>`   | `string`  | Output path for `print-config` command (prints to stdout if not provided) |
| `-h, --help`        | `boolean` | Display help information                                                  |

**Environment Variables:**

- `JITI_TS_CONFIG_PATH` — Path to TypeScript configuration file. For the `jiti` command, this is the only way to specify tsconfig (the `--tsconfig` argument is filtered out and not passed to jiti). For `print-config`, this is an alternative to `--tsconfig`.

**Positional Arguments:**

```bash
npx jiti-tsc [command] [options]
```

- `command` — Command to run: `jiti`, `print-config`, `help`

## TypeScript Configuration

The tool works with your existing `tsconfig.json` files. 

- For the `print-config` command: Use the `--tsconfig` option or `JITI_TS_CONFIG_PATH` environment variable to specify which TypeScript configuration to load.
- For the `jiti` command: Use the `JITI_TS_CONFIG_PATH` environment variable only (the `--tsconfig` argument is filtered out and not passed to jiti).

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@acme/*": ["packages/*/src"]
    }
  }
}
```

The tool will parse the `paths` configuration and convert them to jiti-compatible aliases for monorepo package resolution.

## API Reference

### `importModule<T>(options)`

Imports a TypeScript module using jiti with optional tsconfig support for path alias resolution.

```typescript
import { importModule } from '@push-based/jiti-tsc';

const module = await importModule({
  filepath: './config.ts',
  tsconfig: './tsconfig.json',
});
```

**Parameters:**

| Parameter        | Type          | Required | Description                             |
| ---------------- | ------------- | -------- | --------------------------------------- |
| `filepath`       | `string`      | ✅       | Path to the TypeScript module to import |
| `tsconfig`       | `string`      | ❌       | Path to TypeScript configuration file   |
| `...jitiOptions` | `JitiOptions` | ❌       | Additional jiti options                 |

**Returns:** `Promise<T>` - The imported module

## Supported TypeScript Features

This tool supports loading TypeScript configuration files with the following features:

| Feature             | Support | Description                                    |
| ------------------- | ------- | ---------------------------------------------- |
| TypeScript modules  | ✅      | ES modules and CommonJS                        |
| Path aliases        | ✅      | Resolves `tsconfig.json` paths to jiti aliases |
| ESM imports         | ✅      | Modern ES module syntax                        |
| TypeScript types    | ✅      | Full TypeScript syntax support via jiti        |
| Monorepo workspaces | ✅      | Handles internal package references            |
| Custom extensions   | ✅      | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`   |

## Use Cases

- **Monorepo development**: Import TypeScript modules with path alias resolution
- **Configuration loading**: Load TypeScript configuration files with jiti
- **Build tools**: Use jiti with tsconfig-derived options for module resolution
- **CLI tools**: Execute jiti commands with TypeScript path mapping support

## Example: Monorepo Path Resolution

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@acme/*": ["packages/*/src"]
    }
  }
}

// Import a TypeScript module with path alias resolution
import { importModule } from '@push-based/jiti-tsc';

const configModule = await importModule({
  filepath: './packages/my-app/src/config.ts',
  tsconfig: './tsconfig.json'
});

// The module can now import using @acme/* aliases
// config.ts can do: import { utils } from '@acme/utils';
console.log(configModule);
```

## TS Config to JITI Options Mapping

Complete mapping of options for jiti

| Jiti Option      | TypeScript Option | Description                                                                            |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------- |
| alias            | paths             | TypeScript `paths` are converted to jiti `alias` objects with absolute paths resolved. |
| extensions       | -                 | Not directly mapped¹ - jiti handles TS extensions automatically.                       |
| transform        | -                 | Not mapped - jiti doesn't expose custom transform functions.                           |
| interopDefault   | esModuleInterop   | Directly maps `esModuleInterop` to enable default import interop in jiti.              |
| debug            | -                 | Not mapped - jiti doesn't expose debug configuration.                                  |
| sourceMaps       | sourceMap         | Directly maps `sourceMap` to enable sourcemap generation in jiti.                      |
| fsCache          | -                 | Not mapped - jiti doesn't expose filesystem caching options.                           |
| moduleCache      | -                 | Not mapped - jiti doesn't expose module caching options.                               |
| tryNative        | -                 | Not mapped - jiti doesn't have a "try native first" option.                            |
| jsx              | jsx               | Maps any non-None `jsx` setting to enable JSX support in jiti.                         |
| nativeModules    | -                 | Not mapped - jiti doesn't allow specifying native-only modules.                        |
| transformModules | -                 | Not mapped - jiti doesn't expose module transformation options.                        |
| -                | baseUrl           | Used indirectly for resolving relative paths in `paths` mappings.                      |
| -                | moduleResolution  | Not mapped - jiti uses its own module resolution strategy.                             |
| -                | module            | Not mapped - jiti doesn't care about output module format.                             |
| -                | target            | Not mapped - jiti handles any valid JS/TS syntax automatically.                        |
| -                | lib               | Not mapped - jiti doesn't use TypeScript's lib configuration.                          |
| -                | types             | Not mapped - jiti doesn't process type declaration files.                              |
| -                | allowJs           | Not mapped - jiti handles JS files regardless of this setting.                         |
| -                | checkJs           | Not mapped - jiti doesn't perform type checking on JS files.                           |
| -                | resolveJsonModule | Not mapped - jiti doesn't handle JSON modules through this setting.                    |
| -                | customConditions  | Not mapped - jiti doesn't support custom export conditions.                            |

¹ **Not directly mapped**: Jiti has built-in support for common TypeScript extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) and doesn't require explicit configuration for basic usage.
