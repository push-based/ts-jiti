import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTscByPath } from './read-ts-config-file.js';

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
    };
    await writeFile(tsconfigPath, JSON.stringify(tsconfigContent));

    const result = await readTscByPath(tsconfigPath);
    expect(result).toEqual(tsconfigContent);
  });

  it('should throw if the path is empty', async () => {
    await expect(readTscByPath('')).rejects.toThrow(/ENOENT.*open/);
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readTscByPath(path.join('non-existent', 'tsconfig.json')),
    ).rejects.toThrow(/ENOENT.*no such file or directory/);
  });

  it('should load tsconfig with different basename', async () => {
    const configPath = path.join(tempDir, 'tsconfig.build.json');
    const tsconfigContent = {
      compilerOptions: {
        paths: {
          '@build/*': ['build/*'],
        },
      },
    };
    await writeFile(configPath, JSON.stringify(tsconfigContent));

    const result = await readTscByPath(configPath);
    expect(result).toEqual(tsconfigContent);
  });

  it('should handle tsconfig without paths', async () => {
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    const tsconfigContent = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
      },
    };
    await writeFile(tsconfigPath, JSON.stringify(tsconfigContent));

    const result = await readTscByPath(tsconfigPath);
    expect(result).toEqual(tsconfigContent);
  });
});
