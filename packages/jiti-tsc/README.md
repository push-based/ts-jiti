# @push-based/jiti-tsc

[jiti](https://github.com/unjs/jiti/blob/main/README.md) does not support TypeScript config files. **jiti-tsc** bridges this gap by converting `tsconfig.json` paths into jiti-compatible options for DX.

## Features

This library does one simple thing: it converts TypeScript path aliases to jiti-compatible alias options and wrapd the original jiti API to make it easier to use in monorepo environments.

**✅ Full TypeScript configuration support:**

- ✅ FAutomatically detected from the `tsconfig.json` file in the current working directory
- ✅ FAccepts custom tsconfig path via the `JITI_TSCONFIG_PATH`
- ✅ FCLI tool supporting tsconfig options
- ✅ FProgrammatic API supporting tsconfig options

## Installation

```bash
npm install @push-based/jiti-tsc
```

## Quick Start

**Usage:**

```bash
# Capability mode (automatic)
NODE_OPTIONS="--import jiti-tsc" node file.ts

# Runner mode (CLI)
npx jiti-tsc file.ts
```

**With custom tsconfig path:**

```bash
JITI_TSCONFIG_PATH=./tsconfig.json NODE_OPTIONS="--import jiti-tsc/register" node your-file.ts
```

**Note:** The `JITI_TSCONFIG_PATH` environment variable can be used to specify a custom tsconfig path. Defaults to `./tsconfig.json` if not specified.

### CLI Usage

```bash
# Display help information
npx jiti-tsc help

# Run jiti without tsconfig (uses default resolution)
npx jiti-tsc ./path/to/module.ts

# Run jiti with tsconfig-derived options (via environment variable)
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc ./path/to/module.ts

# Print resolved jiti configuration from tsconfig.json
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc print-config

# Print configuration to a file
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc print-config --output=./resolved-config.json
```

## CLI Commands

By default, `jiti-tsc` runs jiti with tsconfig-derived options. If the first argument is not `help` or `print-config`, it is treated as arguments to jiti.

### Default (jiti)

Runs the jiti command line tool with options derived from a TypeScript configuration file.

**Note:** Use the `JITI_TSCONFIG_PATH` environment variable to specify the tsconfig path.

```bash
# Run jiti with tsconfig options (tsconfig path via environment variable)
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc ./path/to/module.ts

# Run jiti without tsconfig (uses default resolution)
npx jiti-tsc ./path/to/module.ts
```

### `print-config`

Loads a TypeScript configuration file and prints the resolved jiti options.

```bash
# Print to stdout
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc print-config

# Print to file
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc print-config --output=./resolved-config.json
```

### `help`

Displays help information.

```bash
npx jiti-tsc help
npx jiti-tsc --help
npx jiti-tsc -h
```

## CLI Options

| Option            | Type      | Description                                                               |
| ----------------- | --------- | ------------------------------------------------------------------------- |
| `--output <path>` | `string`  | Output path for `print-config` command (prints to stdout if not provided) |
| `-h, --help`      | `boolean` | Display help information                                                  |

**Environment Variables:**

- `JITI_TSCONFIG_PATH` — Path to TypeScript configuration file. Use this environment variable to specify which TypeScript configuration to load.

**Positional Arguments:**

```bash
npx jiti-tsc [command] [options]
```

- `command` — Optional command: `print-config` or `help`. If omitted or not recognized, arguments are passed to jiti (default behavior).

## TypeScript Configuration

The tool works with your existing `tsconfig.json` files.

- Use the `JITI_TSCONFIG_PATH` environment variable to specify which TypeScript configuration to load.

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

## TS Config Mapping

Jiti supports several options that can be directly derived from the TypeScript configuration.

| Jiti Option      | Jiti Type                | TypeScript Option | TypeScript Type            | Description                                                                                |
| ---------------- | ------------------------ | ----------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `alias`          | `Record<string, string>` | `paths`           | `Record<string, string[]>` | TypeScript `paths` are converted to jiti `alias` objects with absolute paths resolved. [*] |
| `interopDefault` | `boolean`                | `esModuleInterop` | `boolean`                  | Maps `esModuleInterop` to enable default import interop in jiti.                           |
| `sourceMaps`     | `boolean`                | `sourceMap`       | `boolean`                  | Maps `sourceMap` to enable sourcemap generation in jiti.                                   |
| `jsx`            | `boolean`                | `jsx`             | `JsxEmit` (enum: 0-5)      | Any non-None `jsx` setting is mapped to enable JSX support in jiti. [**]                   |

[*] Jiti does not support overloads (multiple mappings for the same path pattern). If overloads are detected, it throws an error.
[**] Jiti maps to a `boolean` and does not support the `jsx` option values as TypeScript does (only enables/disables JSX processing).
