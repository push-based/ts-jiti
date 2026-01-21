# @push-based/ts-jiti

TypeScript path aliases don't work at runtime. **ts-jiti** bridges this gap by converting `tsconfig.json` paths into jiti-compatible aliases for perfect monorepo execution.

## Features

- ✅ Loads and parses TypeScript configuration files (`tsconfig.json`)
- ✅ Converts TypeScript path aliases to jiti-compatible alias options
- ✅ CLI tool with commands for configuration processing and jiti execution
- ✅ TypeScript API for programmatic module importing with tsconfig support
- ✅ Supports TypeScript path aliases in monorepo environments
- ✅ Environment variable support for tsconfig path configuration
- ✅ Print-config command for debugging resolved jiti options

## Installation

```bash
npm install @push-based/ts-jiti
```

## Quick Start

### CLI Usage

```bash
# Print resolved jiti configuration from tsconfig.json
npx ts-jiti print-config --tsconfig=./tsconfig.json

# Print resolved jiti options from termonal args as well as onfiguration from tsconfig.json
npx ts-jiti print-config --tsconfig=./tsconfig.json --


# Print configuration to a file
npx ts-jiti print-config --tsconfig=./tsconfig.json --output=./resolved-config.json

# Run jiti with tsconfig-derived options
npx ts-jiti jiti ./path/to/module.ts

# Display help information
npx ts-jiti help
```

## CLI Commands

### `print-config`

Loads a TypeScript configuration file and prints the resolved jiti options.

```bash
# Print to stdout
npx ts-jiti print-config --tsconfig=./tsconfig.json

# Print to file
npx ts-jiti print-config --tsconfig=./tsconfig.json --output=./resolved-config.json

# Use environment variable for tsconfig path
JITI_TS_CONFIG_PATH=./tsconfig.json npx ts-jiti print-config
```

### `jiti`

Runs the jiti command line tool with options derived from a TypeScript configuration file.

```bash
# Run jiti with tsconfig options
npx ts-jiti jiti --tsconfig=./tsconfig.json ./path/to/module.ts

# Use environment variable for tsconfig path
JITI_TS_CONFIG_PATH=./tsconfig.json npx ts-jiti jiti ./path/to/module.ts
```

### `help`

Displays help information.

```bash
npx ts-jiti help
npx ts-jiti --help
npx ts-jiti -h
```

## CLI Options

| Option              | Type      | Description                                                               |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| `--tsconfig <path>` | `string`  | Path to TypeScript configuration file to load                             |
| `--output <path>`   | `string`  | Output path for `print-config` command (prints to stdout if not provided) |
| `-h, --help`        | `boolean` | Display help information                                                  |

**Environment Variables:**

- `JITI_TS_CONFIG_PATH` — Path to TypeScript configuration file (alternative to `--tsconfig`)

**Positional Arguments:**

```bash
npx ts-jiti [command] [options]
```

- `command` — Command to run: `jiti`, `print-config`, `help`

## TypeScript Configuration

The tool works with your existing `tsconfig.json` files. Use the `--tsconfig` option to specify which TypeScript configuration to load:

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
import { importModule } from '@push-based/ts-jiti';

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
import { importModule } from '@push-based/ts-jiti';

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
