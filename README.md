<h1 align="center">TS-Jiti</h1>
<h2 align="center">TypeScript Configuration Loader with Path Alias Support</h2>

---

[![license](https://img.shields.io/github/license/push-based/ts-jiti)](https://opensource.org/licenses/MIT)

---

## Overview

`ts-jiti` is a tool that loads and processes TypeScript configuration files using jiti, with special support for resolving TypeScript path aliases in monorepo environments. This bridges the gap between TypeScript's path mapping and jiti's module resolution.

## Packages

- **[`@push-based/ts-jiti`](./packages/ts-jiti)** - Core CLI tool for loading TypeScript configs with jiti

## Quick Start

### Installation

```bash
npm install @push-based/ts-jiti
```

### Usage

```bash
# Load and print TypeScript configuration
npx ts-jiti print-config --config=./ts-jiti.config.ts
```

This loads your TypeScript config and converts tsconfig paths to jiti-compatible aliases.

## Features

- 🔒 **Type-safe config loading** - Load TypeScript configs with full type checking
- 📦 **Path alias resolution** - Convert tsconfig paths to jiti aliases automatically
- 🎯 **Monorepo support** - Resolve internal packages with TypeScript path mappings
- 📝 **Jiti integration** - Built on top of jiti for reliable TypeScript module loading

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.
