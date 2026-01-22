import { fsFromJson } from '@push-based/test-utils';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect } from 'vitest';
import { deriveTsConfig, loadTargetConfig } from './read-ts-config-file.js';

const TEST_OUTPUT_BASE = 'tmp';

describe('loadTargetConfig', () => {
  afterAll(async () => {
    await rm(path.join(TEST_OUTPUT_BASE, 'load-target-config'), {
      recursive: true,
      force: true,
    });
  });

  it('throws error when reading config fails', async () => {
    await expect(() => loadTargetConfig('missing.json')).toThrow(
      'Error reading TypeScript config file',
    );
  });

  it('throws error when no files match configuration', async () => {
    const testDirPath = path.join(
      TEST_OUTPUT_BASE,
      'should-throw-no-files-match',
    );
    const cleanup = await fsFromJson(
      {
        'tsconfig.json': {
          compilerOptions: {
            target: 'es2020',
            module: 'commonjs',
          },
          include: [],
          // Empty include should match no files
        },
      },
      testDirPath,
    );

    const configPath = path.join(testDirPath, 'tsconfig.json');

    expect(() => loadTargetConfig(configPath)).toThrow(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );

    await cleanup();
  });

  it('returns parsed config when valid', async () => {
    const testDirValid = path.join(
      TEST_OUTPUT_BASE,
      'should-return-parsed-config',
    );
    const cleanup = await fsFromJson(
      {
        'tsconfig.json': {
          compilerOptions: {
            strict: true,
            target: 'es2020',
            module: 'commonjs',
          },
          files: ['index.ts'],
        },
        'index.ts': 'export const dummy = 42;',
      },
      testDirValid,
    );

    const configPath = path.join(testDirValid, 'tsconfig.json');

    const result = loadTargetConfig(configPath);
    expect(result).toEqual(
      expect.objectContaining({
        fileNames: expect.arrayContaining([
          expect.stringContaining('index.ts'),
        ]),
        options: expect.objectContaining({
          strict: true,
          target: 7, // ScriptTarget.ES2020
          module: 1, // ModuleKind.CommonJS
        }),
      }),
    );

    await cleanup();
  });
});

describe('deriveTsConfig', () => {
  afterAll(async () => {
    await rm(path.join(TEST_OUTPUT_BASE, 'derive-ts-config'), {
      recursive: true,
      force: true,
    });
  });

  it('throws error when tsconfig file does not exist', async () => {
    await expect(deriveTsConfig('missing.json')).rejects.toThrow(
      'Tsconfig file not found at path: missing.json',
    );
  });

  it('returns compiler options when file exists', async () => {
    const testDirOptions = path.join(
      TEST_OUTPUT_BASE,
      'should-return-compiler-options',
    );
    const cleanup = await fsFromJson(
      {
        'tsconfig.json': {
          compilerOptions: {
            esModuleInterop: true,
            target: 'es2020',
            module: 'commonjs',
          },
          files: ['index.ts'],
        },
        'index.ts': 'export const dummy = 42;',
      },
      testDirOptions,
    );

    const configPath = path.join(testDirOptions, 'tsconfig.json');

    const result = await deriveTsConfig(configPath);
    expect(result).toEqual(
      expect.objectContaining({
        esModuleInterop: true,
        target: 7, // ScriptTarget.ES2020
        module: 1, // ModuleKind.CommonJS
      }),
    );

    await cleanup();
  });

  it('parses config file with paths', async () => {
    const testDir = path.join(
      TEST_OUTPUT_BASE,
      'should-parse-config-with-paths',
    );
    const cleanup = await fsFromJson(
      {
        'tsconfig.json': {
          compilerOptions: {
            paths: { '@/*': ['./src/*'] },
            target: 'es2020',
            module: 'commonjs',
          },
          files: ['index.ts'],
        },
        'index.ts': 'export const dummy = 42;',
      },
      testDir,
    );

    const configPath = path.join(testDir, 'tsconfig.json');

    const result = await deriveTsConfig(configPath);
    expect(result).toEqual(
      expect.objectContaining({
        paths: { '@/*': ['./src/*'] },
        target: 7, // ScriptTarget.ES2020
        module: 1, // ModuleKind.CommonJS
      }),
    );

    await cleanup();
  });
});
