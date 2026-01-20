# Minimal Setup Fixture

This fixture represents a minimal TypeScript project setup with circular configuration inheritance and path mapping, demonstrating different ways to run TypeScript with ts-jiti.

## Structure

- `_package.json` - Package.json template with basic dependencies
- `tsconfig.json` - Main TypeScript configuration (circular reference)
- `tsconfig.test.json` - Test-specific TypeScript configuration
- `src/` - Source code directory
  - `cli.ts` - Direct import using relative paths
  - `cli-import-path-alias.ts` - Import using @utils path alias
  - `cli-load-import.ts` - Using ts-jiti's importModule function programmatically
  - `utils/string.ts` - Utility functions
  - `utils/string.test.ts` - Test file

## Configuration Inheritance

The configs demonstrate circular reference and path aliasing:

```
root/
├── tsconfig.json (circular reference - extends itself)
├── tsconfig.test.json (extends tsconfig.json)
└── src/
    ├── cli.ts (relative import)
    ├── cli-import-path-alias.ts (@utils alias import)
    ├── cli-load-import.ts (programmatic importModule)
    └── utils/
        ├── string.ts
        └── string.test.ts
```

_tsconfig.json_

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "rootDir": ".",
    "outDir": "./dist",
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true,
    "jsx": "preserve",
    "declaration": true,
    "declarationMap": true,
    "paths": {
      "@utils/*": ["./src/utils"]
    }
  },
  "include": ["./src/**/*.ts"],
  "exclude": ["./src/**/*.test.ts", "./dist", "./node_modules"]
}
```

_tsconfig.test.json_

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist-test",
    "declaration": false,
    "declarationMap": false
  },
  "include": ["./src/**/*.test.ts"],
  "exclude": ["./src/**/*.{ts,tsx}", "!./src/**/*.test.{ts,tsx}"]
}
```

## jiti CLI Examples

- ````bash
  npx -y jiti src/cli.ts
  ``` - Direct relative imports
  ````
- ````bash
  JITI_ALIAS='{"@utils": "../src/utils"}' npx -y jiti src/cli-import-path-alias.ts
  ``` - Path aliases with JITI_ALIAS env var
  ````

## ts-jiti CLI Examples

- ````bash
  npx -y ts-jiti --tsconfig tsconfig.json src/cli.ts
  ``` - Direct relative imports with tsconfig
  ````
- ````bash
  npx -y ts-jiti --tsconfig tsconfig.json src/cli-import-path-alias.ts
  ``` - Path aliases from tsconfig
  ````
- ````bash
  npx -y ts-jiti --tsconfig tsconfig.json src/cli-load-import.ts src/utils/string.ts
  ``` - Dynamic module import with tsconfig
  ````
