<h1 align="center">Jiti TSC</h1>
<h2 align="center">Jiti that Supports TypeScript Configuration</h2>

---

[![license](https://img.shields.io/github/license/push-based/ts-jiti)](https://opensource.org/licenses/MIT)

---

## Overview

[jiti](https://github.com/unjs/jiti) does not support TypeScript config files. **jiti-tsc** bridges this gap by converting `tsconfig.json` paths into jiti-compatible options for better developer experience in monorepo environments.

## Packages

- **[`@push-based/jiti-tsc`](./packages/jiti-tsc)** - CLI tool and programmatic API for using jiti with TypeScript configuration files

## Quick Start

### Installation

```bash
npm install @push-based/jiti-tsc
```

### Usage

```bash
# Using jiti-tsc as a global ESM loader with Node.js --import flag
node --import jiti-tsc/register ./path/to/module.ts

# Using jiti-tsc as a global ESM loader with Node.js --import flag and env variable for tsconfig path
JITI_TSCONFIG_PATH=./tsconfig.json node --import jiti-tsc/register ./path/to/module.ts

# Run jiti
npx jiti-tsc ./path/to/module.ts

# Run jiti with tsconfig-derived options
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc ./path/to/module.ts

# Print resolved jiti configuration
JITI_TSCONFIG_PATH=./tsconfig.json npx jiti-tsc print-config
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.
