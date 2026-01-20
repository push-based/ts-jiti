import { osAgnosticPath } from '@push-based/test-utils';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tsModule from 'typescript';
import { describe, expect, it } from 'vitest';
import { loadTargetConfig, readTscByPath } from './read-ts-config-file.js';

describe('loadTargetConfig', () => {
  const readConfigFileSpy = vi.spyOn(tsModule, 'readConfigFile');
  const parseJsonConfigFileContentSpy = vi.spyOn(
    tsModule,
    'parseJsonConfigFileContent',
  );

  it.skip('should return the parsed content of a tsconfig file and ist TypeScript helper to parse it', () => {
    // From packages/ts-jiti/src/lib/jiti/ go up to packages/ts-jiti/ then to mocks/fixtures/basic-setup/
    const fixturePath = path.join(
      path.dirname(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))),
      'mocks',
      'fixtures',
      'basic-setup',
      'tsconfig.init.json'
    );
    expect(
      loadTargetConfig(fixturePath),
    ).toStrictEqual(
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
  });

  it.skip('should return the parsed content of a tsconfig file that extends another config', () => {
    // From packages/ts-jiti/src/lib/jiti/ go up to packages/ts-jiti/ then to mocks/fixtures/basic-setup/
    const fixturePath = path.join(
      path.dirname(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))),
      'mocks',
      'fixtures',
      'basic-setup',
      'tsconfig.extends-extending.json'
    );
    expect(
      loadTargetConfig(fixturePath),
    ).toStrictEqual(
      expect.objectContaining({
        fileNames: expect.arrayContaining([
          // from tsconfig.extends-base.json#includes and tsconfig.extends-extending.json#excludes
          expect.stringMatching(/src[/\\]0-no-diagnostics[/\\]/),
        ]),
        options: expect.objectContaining({
          // Options from tsconfig.extends-base.json
          rootDir: expect.stringMatching(/basic-setup$/),
          // Options from tsconfig.extends-extending.json
          module: 1,
          configFilePath: expect.stringContaining(
            'tsconfig.extends-extending.json',
          ),
          verbatimModuleSyntax: true, // Overrides base config's false
        }),
      }),
    );

    expect(readConfigFileSpy).toHaveBeenCalledTimes(1);
    expect(parseJsonConfigFileContentSpy).toHaveBeenCalledTimes(1);
  });
});

describe('readTscByPath', () => {
  it('should load a valid tsconfig.json file', async () => {
    const tempDir = path.join(
      'packages/ts-jiti/tmp',
      'should-load-a-valid-tsconfig-json-file',
    );
    await mkdir(tempDir, { recursive: true });
    try {
      const tsconfigPath = path.join(tempDir, 'tsconfig.json');
      const tsconfigContent = {
        compilerOptions: {
          paths: {
            '@app/*': ['src/*'],
            '@lib/*': ['lib/*'],
          },
        },
        include: ['**/*.ts'],
      };
      await writeFile(tsconfigPath, JSON.stringify(tsconfigContent));

      // Create a dummy TypeScript file so TypeScript can find it
      await writeFile(
        path.join(tempDir, 'dummy.ts'),
        'export const dummy = 42;',
      );

      const result = await readTscByPath(tsconfigPath);
      expect(result).toEqual(
        expect.objectContaining({
          paths: {
            '@app/*': ['src/*'],
            '@lib/*': ['lib/*'],
          },
        }),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should throw if the path is empty', async () => {
    await expect(readTscByPath('')).rejects.toThrow(/Tsconfig file not found/);
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readTscByPath(path.join('non-existent', 'tsconfig.json')),
    ).rejects.toThrow(/Tsconfig file not found/);
  });

  it('should load tsconfig with different basename', async () => {
    const tempDir = path.join(
      'packages/ts-jiti/tmp',
      'should-load-tsconfig-with-different-basename',
    );
    await mkdir(tempDir, { recursive: true });
    try {
      const configPath = path.join(tempDir, 'tsconfig.build.json');
      const tsconfigContent = {
        compilerOptions: {
          paths: {
            '@build/*': ['build/*'],
          },
        },
        include: ['**/*.ts'],
      };
      await writeFile(configPath, JSON.stringify(tsconfigContent));

      // Create a dummy TypeScript file so TypeScript can find it
      await writeFile(
        path.join(tempDir, 'dummy.ts'),
        'export const dummy = 42;',
      );

      const result = await readTscByPath(configPath);
      expect(result).toEqual(
        expect.objectContaining({
          paths: {
            '@build/*': ['build/*'],
          },
        }),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle tsconfig without paths', async () => {
    const tempDir = path.join(
      'packages/ts-jiti/tmp',
      'should-handle-tsconfig-without-paths',
    );
    await mkdir(tempDir, { recursive: true });
    try {
      const tsconfigPath = path.join(tempDir, 'tsconfig.json');
      const tsconfigContent = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
        },
        include: ['**/*.ts'],
      };
      await writeFile(tsconfigPath, JSON.stringify(tsconfigContent));

      // Create a dummy TypeScript file so TypeScript can find it
      await writeFile(
        path.join(tempDir, 'dummy.ts'),
        'export const dummy = 42;',
      );

      const result = await readTscByPath(tsconfigPath);
      expect(result).toEqual(
        expect.objectContaining({
          target: 7, // ES2020
          module: 1, // commonjs
        }),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
