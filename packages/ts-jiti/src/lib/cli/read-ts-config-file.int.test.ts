import { fsFromJson } from '@push-based/test-utils';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTscByPath } from './read-ts-config-file.js';

const TEST_OUTPUT_BASE = 'packages/jiti-tsc/tmp';

describe('readTscByPath', () => {
  const testDir = path.join(TEST_OUTPUT_BASE, 'cli-read-tsc-by-path');

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load a valid tsconfig.json file', async () => {
    const cleanup = await fsFromJson(
      {
        'tsconfig.json': {
          compilerOptions: {
            paths: {
              '@app/*': ['src/*'],
              '@lib/*': ['lib/*'],
            },
          },
          include: ['**/*.ts'],
        },
        'src.ts': 'export const dummy = 42;',
        'lib.ts': 'export const lib = "lib";',
      },
      'should-load-a-valid-tsconfig-json-file',
    );
    const configPath = path.join(
      'should-load-a-valid-tsconfig-json-file',
      'tsconfig.json',
    );

    const result = await readTscByPath(configPath);
    expect(result).toMatchObject({
      paths: {
        '@app/*': ['src/*'],
        '@lib/*': ['lib/*'],
      },
    });
    expect(result).toHaveProperty('pathsBasePath');
    await cleanup();
  });

  it('should throw if the path is empty', async () => {
    await expect(readTscByPath('')).rejects.toThrow(
      /Error reading TypeScript config file/,
    );
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readTscByPath(path.join('non-existent', 'tsconfig.json')),
    ).rejects.toThrow(/Error reading TypeScript config file/);
  });

  it('should load tsconfig with different basename', async () => {
    const cleanup = await fsFromJson(
      {
        'tsconfig.build.json': {
          compilerOptions: {
            paths: {
              '@build/*': ['build/*'],
            },
          },
          include: ['**/*.ts'],
        },
        'build.ts': 'export const dummy = 42;',
      },
      'should-load-tsconfig-with-different-basename',
    );
    const configPath = path.join(
      'should-load-tsconfig-with-different-basename',
      'tsconfig.build.json',
    );

    const result = await readTscByPath(configPath);
    expect(result).toMatchObject({
      paths: {
        '@build/*': ['build/*'],
      },
    });
    expect(result).toHaveProperty('pathsBasePath');
    await cleanup();
  });

  it('should handle tsconfig without paths', async () => {
    const cleanup = await fsFromJson(
      {
        'tsconfig.json': {
          compilerOptions: {
            target: 'es2020',
            module: 'commonjs',
          },
          include: ['**/*.ts'],
        },
        'index.ts': 'export const dummy = 42;',
      },
      'should-handle-tsconfig-without-paths',
    );
    const configPath = path.join(
      'should-handle-tsconfig-without-paths',
      'tsconfig.json',
    );

    const result = await readTscByPath(configPath);
    expect(result).toMatchObject({
      target: 7, // ScriptTarget.ES2020
      module: 1, // ModuleKind.CommonJS
    });
    await cleanup();
  });
});
