import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@push-based/test-utils';
import { executeProcess } from '@push-based/ts-jiti';
import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Original jiti cli', () => {
  const jitiEnvVarsDefaults = () => ({
    JITI_FS_CACHE: 'true',
    JITI_CACHE: 'true',
    JITI_REBUILD_FS_CACHE: 'false',
    JITI_MODULE_CACHE: 'true',
    JITI_REQUIRE_CACHE: 'true',
    JITI_DEBUG: 'false',
    JITI_SOURCE_MAPS: 'false',
    JITI_INTEROP_DEFAULT: 'true',
    JITI_EXTENSIONS: JSON.stringify([
      '.js',
      '.mjs',
      '.cjs',
      '.ts',
      '.tsx',
      '.mts',
      '.cts',
      '.mtsx',
      '.ctsx',
    ]),
    JITI_ALIAS: JSON.stringify({}),
    JITI_NATIVE_MODULES: JSON.stringify([]),
    JITI_TRANSFORM_MODULES: JSON.stringify([]),
    JITI_TRY_NATIVE: JSON.stringify('Bun' in globalThis),
    JITI_JSX: 'false',
  });
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'jiti');

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

  it('should execute cli over jiti', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['-y', 'jiti', path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'cli.ts')],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toContain('42');
  });

  it('should FAIL jiti with code depending on path alias', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'cli-import-path-alias.ts'),
      ],
      cwd: envRoot,
    });

    expect(code).not.toBe(0);
    expect(removeColorCodes(stderr)).toMatchInlineSnapshot();
  });

  it('should run jiti with environment variables', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'cli-import-path-alias.ts'),
      ],
      cwd: envRoot,
      env: {
        ...jitiEnvVarsDefaults(),
        JITI_ALIAS: JSON.stringify({
          '@utils': path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'utils'),
        }),
      },
    });

    expect(code).not.toBe(0);
    expect(removeColorCodes(stderr)).toMatchInlineSnapshot();
  });
});
