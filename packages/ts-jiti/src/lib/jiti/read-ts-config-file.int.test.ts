import { osAgnosticPath } from '@push-based/test-utils';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as tsModule from 'typescript';
import { describe, expect, it } from 'vitest';
import { loadTargetConfig, readTscByPath } from './read-ts-config-file.js';

describe('loadTargetConfig', () => {
  const readConfigFileSpy = vi.spyOn(tsModule, 'readConfigFile');
  const parseJsonConfigFileContentSpy = vi.spyOn(
    tsModule,
    'parseJsonConfigFileContent',
  );

  it('should return the parsed content of a tsconfig file and ist TypeScript helper to parse it', () => {
    expect(
      loadTargetConfig(
        osAgnosticPath(
          'packages/ts-jiti/mocks/fixtures/basic-setup/tsconfig.init.json',
        ),
      ),
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

  it('should return the parsed content of a tsconfig file that extends another config', () => {
    expect(
      loadTargetConfig(
        'packages/ts-jiti/mocks/fixtures/basic-setup/tsconfig.extends-extending.json',
      ),
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
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'tsconfig-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should load a valid tsconfig.json file', async () => {
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
    await writeFile(path.join(tempDir, 'dummy.ts'), 'export const dummy = 42;');

    const result = await readTscByPath(tsconfigPath);
    expect(result).toEqual(
      expect.objectContaining({
        paths: {
          '@app/*': ['src/*'],
          '@lib/*': ['lib/*'],
        },
      }),
    );
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
    await writeFile(path.join(tempDir, 'dummy.ts'), 'export const dummy = 42;');

    const result = await readTscByPath(configPath);
    expect(result).toEqual(
      expect.objectContaining({
        paths: {
          '@build/*': ['build/*'],
        },
      }),
    );
  });

  it('should handle tsconfig without paths', async () => {
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
    await writeFile(path.join(tempDir, 'dummy.ts'), 'export const dummy = 42;');

    const result = await readTscByPath(tsconfigPath);
    expect(result).toEqual(
      expect.objectContaining({
        target: 7, // ES2020
        module: 1, // commonjs
      }),
    );
  });
});
