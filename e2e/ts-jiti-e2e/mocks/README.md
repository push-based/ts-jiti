# E2E Test Mocks

This directory contains mock fixtures used in end-to-end tests for the jiti-tsc project.

## Available Fixtures

### `tsconfig-setup/`

Basic TypeScript compilation fixture with simple path alias setup:

- `@utils/*`: Maps to `./utils.ts`
- Minimal setup for testing basic TSC functionality

### `path-aliases-basic/`

TypeScript with path aliases fixture:

- `@/*`: Maps to `./src/*`
- `@utils/*`: Maps to `./src/utils/*`
- Demonstrates path alias resolution capabilities

## Usage

These fixtures provide two levels of TypeScript testing:

1. **Basic TSC**: Use `tsconfig-setup/` for testing fundamental TypeScript compilation
2. **TSC with Path Aliases**: Use `path-aliases-basic/` for testing path alias resolution

Each fixture includes:

- `tsconfig.json`: TypeScript configuration
- Source files demonstrating the feature set
- Test files for verification

## Testing

Use these mocks to test jiti-tsc's ability to handle TypeScript compilation with and without path aliases.
