import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readTscByPath } from './read-ts-config-file.js';

describe('readTscByPath', () => {
  it('should load a valid tsconfig.json file', async () => {
    const fixturePath = path.join(
      path.dirname(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))),
      'mocks',
      'fixtures',
      'cli-integration',
      'with-paths',
      'tsconfig.json'
    );

    const result = await readTscByPath(fixturePath);
    expect(result).toMatchObject({
      paths: {
        '@app/*': ['src/*'],
        '@lib/*': ['lib/*'],
      },
    });
    expect(result).toHaveProperty('pathsBasePath');
  });

  it('should throw if the path is empty', async () => {
    await expect(readTscByPath('')).rejects.toThrow(/Error reading TypeScript config file/);
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readTscByPath(path.join('non-existent', 'tsconfig.json')),
    ).rejects.toThrow(/Error reading TypeScript config file/);
  });

  it('should load tsconfig with different basename', async () => {
    const fixturePath = path.join(
      path.dirname(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))),
      'mocks',
      'fixtures',
      'cli-integration',
      'different-basename',
      'tsconfig.build.json'
    );

    const result = await readTscByPath(fixturePath);
    expect(result).toMatchObject({
      paths: {
        '@build/*': ['build/*'],
      },
    });
    expect(result).toHaveProperty('pathsBasePath');
  });

  it('should handle tsconfig without paths', async () => {
    const fixturePath = path.join(
      path.dirname(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))),
      'mocks',
      'fixtures',
      'cli-integration',
      'without-paths',
      'tsconfig.json'
    );

    const result = await readTscByPath(fixturePath);
    expect(result).toMatchObject({
      target: 7, // ScriptTarget.ES2020
      module: 1, // ModuleKind.CommonJS
    });
  });
});
