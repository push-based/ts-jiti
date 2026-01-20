# Monorepo Fixture

This fixture represents a typical monorepo setup with TypeScript configuration inheritance.

## Structure

- `tsconfig.base.json` - Base TypeScript configuration for the entire monorepo
- `packages/utils/` - Example package within the monorepo
  - `tsconfig.project.json` - Project-specific TypeScript configuration
    - `tsconfig.lib.json` - Library-specific TypeScript configuration

## Configuration Inheritance

The configs inherit in the following way:

```
root/
├── tsconfig.base.json (monorepo root)
└── packages/utils/
    ├── tsconfig.project.json (circular reference - extends itself)
    └── tsconfig.lib.json (extends tsconfig.project.json)
```

_tsconfig.base.json_

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "paths": {
      "@utils": "./packages/utils/src"
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

_tsconfig.project.json_

```json
{
  "extends": "./tsconfig.project.json",
  "compilerOptions": {
    "esModuleInterop": true,
    "jsx": 2
  }
}
```

_tsconfig.lib.json_

```json
{
  "extends": "./tsconfig.project.json",
  "compilerOptions": {
    "sourceMap": true
  },
  "files": [],
  "include": [],
  "exclude": []
}
```
