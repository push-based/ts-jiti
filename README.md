<h1 align="center">Jiti TSC</h1>
<h2 align="center">[Jiti](https://github.com/unjs/jiti) that Supports TypeScript Configuration</h2>

---

[![license](https://img.shields.io/github/license/push-based/ts-jiti)](https://opensource.org/licenses/MIT)

---

## Overview

[jiti](https://github.com/unjs/jiti) does not support TypeScript config files. **ts-jiti** bridges this gap by converting `tsconfig.json` paths into jiti-compatible options for better developer experience in monorepo environments.

## Packages

- **[`@push-based/jiti-tsc`](./packages/jiti-tsc)** - CLI tool and programmatic API for using jiti with TypeScript configuration files

## Quick Start

### Installation

```bash
npm install @push-based/jiti-tsc
```

### Usage

```bash
# Run jiti with tsconfig-derived options
JITI_TS_CONFIG_PATH=./tsconfig.json npx jiti-tsc ./path/to/module.ts

# Print resolved jiti configuration
JITI_TS_CONFIG_PATH=./tsconfig.json npx jiti-tsc print-config
```

This will use your TypeScript configuration to resolve path aliases and other compiler options when running jiti.

## Features

- 🔒 **Type-safe** - Full TypeScript support with path alias resolution
- 📦 **Zero config** - Automatically detects `tsconfig.json` in the current directory
- 🎯 **Monorepo support** - Resolves TypeScript path aliases at runtime
- 📝 **CLI & API** - Both command-line tool and programmatic API available

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.
