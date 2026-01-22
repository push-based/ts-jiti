import path from 'node:path';
import { describe, expect } from 'vitest';
import { deriveTsConfig, loadTargetConfig } from './read-ts-config-file.js';


const TEST_OUTPUT_BASE = 'tmp';

describe('loadTargetConfig', () => {
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

    const configPath = path.join(testDirPath, 'tsconfig.json');

    expect(() => loadTargetConfig(configPath)).toThrow(
      `Error reading TypeScript config file at`,
    );
  });
});

describe('deriveTsConfig', () => {
  it('throws error when tsconfig file does not exist', async () => {
    await expect(deriveTsConfig('missing.json')).rejects.toThrow(
      'Tsconfig file not found at path: missing.json',
    );
  });
});
