import { MEMFS_VOLUME } from '@push-based/test-utils';
import { vol } from 'memfs';
import { describe } from 'vitest';
import { readJsonFile, readTextFile } from './file-system.js';

describe('readTextFile', () => {
  it('should read a text file', async () => {
    vol.fromJSON(
      {
        'test.txt': 'Hello, world!',
      },
      MEMFS_VOLUME,
    );

    const result = await readTextFile('test.txt');
    expect(result).toBe('Hello, world!');
  });
});

describe('readJsonFile', () => {
  it('should read a json file', async () => {
    vol.fromJSON(
      {
        'test.json': '{"name": "test", "version": "1.0.0"}',
      },
      MEMFS_VOLUME,
    );

    const result = await readJsonFile('test.json');
    expect(result).toEqual({ name: 'test', version: '1.0.0' });
  });
});
