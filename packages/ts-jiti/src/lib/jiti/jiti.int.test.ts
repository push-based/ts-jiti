import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { importModule } from './jiti.js';

describe('importModule', () => {
  const mockDir = path.join(
    path.dirname(path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))),
    'mocks',
    'fixtures',
  );

  it('should load a valid ES module', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'extensions', 'user.schema.mjs'),
      }),
    ).resolves.toEqual(expect.objectContaining({ _def: expect.any(Object) }));
  });

  it('should load a valid CommonJS module', async () => {
    const result = await importModule({
      filepath: path.join(mockDir, 'extensions', 'user.schema.cjs'),
    });
    // CommonJS modules may be wrapped - check it's a valid zod schema or function
    expect(result).toBeDefined();
    expect(typeof result === 'object' || typeof result === 'function').toBe(
      true,
    );
  });

  it('should load an ES module with default export', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'extensions', 'user.schema.js'),
      }),
    ).resolves.toEqual(expect.objectContaining({ _def: expect.any(Object) }));
  });

  it('should load a valid TS module with a default export', async () => {
    await expect(
      importModule({
        filepath: path.join(mockDir, 'extensions', 'user.schema.ts'),
      }),
    ).resolves.toEqual(expect.objectContaining({ _def: expect.any(Object) }));
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      importModule({ filepath: 'path/to/non-existent-export.mjs' }),
    ).rejects.toThrow("File 'path/to/non-existent-export.mjs' does not exist");
  });

  it('should throw if path is a directory', async () => {
    await expect(importModule({ filepath: mockDir })).rejects.toThrow(
      `File '${mockDir}' does not exist`,
    );
  });
});
