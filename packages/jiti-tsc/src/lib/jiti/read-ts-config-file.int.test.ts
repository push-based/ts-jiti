import { fsFromJson } from '@push-based/test-utils';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import * as tsModule from 'typescript';
import { describe, expect, it } from 'vitest';
import { loadTargetConfig, deriveTsConfig } from './read-ts-config-file.js';

const TEST_OUTPUT_BASE = 'packages/jiti-tsc/tmp';

describe('loadTargetConfig', () => {
  const testDir = path.join(TEST_OUTPUT_BASE, 'load-target-config');

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const readConfigFileSpy = vi.spyOn(tsModule, 'readConfigFile');
  const parseJsonConfigFileContentSpy = vi.spyOn(
    tsModule,
    'parseJsonConfigFileContent',
  );

  it('should return the parsed content of a tsconfig file and ist TypeScript helper to parse it', async () => {
    const cleanup = await fsFromJson(
      {
        'tsconfig.init.json': {
          compilerOptions: {
            module: 'commonjs',
            target: 'es2016',
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: true,
            strict: true,
          },
          include: ['**/*.ts', '**/*.js'],
        },
        'src/index.ts': 'export const dummy = 42;',
      },
      'should-return-parsed-content',
    );
    const configPath = path.join(
      'should-return-parsed-content',
      'tsconfig.init.json',
    );

    const result = loadTargetConfig(configPath);
    expect(result).toStrictEqual(
      expect.objectContaining({
        fileNames: expect.any(Array),
        options: {
          module: 1,
          configFilePath: expect.stringContaining('tsconfig.init.json'),
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          skipLibCheck: true,
          strict: true,
          target: 3,
        },
      }),
    );
    expect(readConfigFileSpy).toHaveBeenCalledTimes(1);
    expect(readConfigFileSpy).toHaveBeenCalledWith(
      expect.stringContaining('tsconfig.init.json'),
      expect.any(Function),
    );
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledTimes(1);
    await cleanup();
  });

  it('should return the parsed content of a tsconfig file that extends another config', async () => {
    const cleanup = await fsFromJson(
      {
        'tsconfig.extends-base.json': {
          compilerOptions: {
            rootDir: './',
            verbatimModuleSyntax: false,
          },
          include: ['src/**/*', 'src/0-no-diagnostics/**/*'],
        },
        'tsconfig.extends-extending.json': {
          extends: './tsconfig.extends-base.json',
          compilerOptions: {
            module: 'commonjs',
            verbatimModuleSyntax: true,
          },
          exclude: ['src/some-other-dir'],
        },
        'src/index.ts': 'export const dummy = 42;',
        'src/0-no-diagnostics/test.ts': 'export const noDiagnostics = 1;',
      },
      'should-return-parsed-content-extends',
    );
    const configPath = path.join(
      'should-return-parsed-content-extends',
      'tsconfig.extends-extending.json',
    );

    const result = loadTargetConfig(configPath);
    expect(result).toStrictEqual(
      expect.objectContaining({
        fileNames: expect.arrayContaining([
          expect.stringMatching(/src[/\\]0-no-diagnostics[/\\]/),
        ]),
        options: expect.objectContaining({
          rootDir: expect.stringMatching(
            /should-return-parsed-content-extends$/,
          ),
          module: 1,
          configFilePath: expect.stringContaining(
            'tsconfig.extends-extending.json',
          ),
          verbatimModuleSyntax: true,
        }),
      }),
    );

    expect(readConfigFileSpy).toHaveBeenCalledTimes(1);
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledTimes(1);
    await cleanup();
  });
});

describe('deriveTsConfig', () => {
  const testDir = path.join(TEST_OUTPUT_BASE, 'read-tsc-by-path');

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
            esModuleInterop: true,
            sourceMap: true,
            jsx: 'react',
          },
          include: ['**/*.ts'],
        },
        'dummy.ts': 'export const dummy = 42;',
      },
      'should-load-a-valid-tsconfig-json-file',
    );
    const configPath = path.join(
      'should-load-a-valid-tsconfig-json-file',
      'tsconfig.json',
    );

    await expect(deriveTsConfig(configPath)).resolves.toStrictEqual({
      configFilePath: expect.any(String),
      paths: {
        '@app/*': ['src/*'],
        '@lib/*': ['lib/*'],
      },
      pathsBasePath: expect.any(String),
      esModuleInterop: true,
      sourceMap: true,
      jsx: 2, // React JSX
    });
    await cleanup();
  });

  it('should throw if the path is empty', async () => {
    await expect(deriveTsConfig('')).rejects.toThrow(/Tsconfig file not found/);
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      deriveTsConfig(path.join('non-existent', 'tsconfig.json')),
    ).rejects.toThrow(/Tsconfig file not found/);
  });
});
