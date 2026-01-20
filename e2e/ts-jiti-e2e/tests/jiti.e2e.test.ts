import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@push-based/test-utils';
import { executeProcess } from '@push-based/ts-jiti';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CLI jiti', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'jiti');
  const schemaFile = path.join(testFileDir, 'src', 'schema.ts');

  beforeAll(async () => {
    await cp(
      path.join(__dirname, '..', 'mocks', 'fixtures', 'minimal-setup'),
      testFileDir,
      { recursive: true },
    );
    await restoreNxIgnoredFiles(testFileDir);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should execute cli over ts-jiti', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/ts-jiti',
        'jiti',
        path.join(testFileDir, 'src', 'cli.ts'),
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toContain('42');
  });

  it('should execute cli over ts-jiti with path alias', async () => {
    const tsconfigPath = path.join(testFileDir, 'tsconfig.json');
    const relativeTsconfigPath = path.relative(envRoot, tsconfigPath);
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/ts-jiti',
        'jiti',
        `--tsconfig=${relativeTsconfigPath}`,
        path.join(testFileDir, 'src', 'cli-import-path-alias.ts'),
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toContain('Random number: 42');
  });

  it('should execute cli over ts-jiti with importModule', async () => {
    const tsconfigPath = path.join(testFileDir, 'tsconfig.json');
    const relativeTsconfigPath = path.relative(envRoot, tsconfigPath);
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/ts-jiti',
        'jiti',
        `--tsconfig=${relativeTsconfigPath}`,
        path.join(testFileDir, 'src', 'cli-load-import.ts'),
        path.join(testFileDir, 'src', 'utils', 'string.ts'),
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toContain('Random number: 42');
  });
});
