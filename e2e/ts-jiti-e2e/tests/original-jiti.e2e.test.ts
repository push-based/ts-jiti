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

  it('should execute cli over original jiti default', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['-y', 'jiti', path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'bin.ts-jiti.basic.ts')],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toContain('42');
  });

  it('should FAIL original jiti with code depending on path alias', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'bin.ts-jiti.tsconfig-all.ts'),
      ],
      cwd: envRoot,
      ignoreExitCode: true,
    });

    expect(code).not.toBe(0);
    expect(removeColorCodes(stderr)).toMatchInlineSnapshot(`
      "Error: Cannot find module '@utils/string'
      Require stack:
      - /Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/__test__/jiti/src/bin.ts-jiti.tsconfig-all.ts
          at Module._resolveFilename (node:internal/modules/cjs/loader:1405:15)
          at require.resolve (node:internal/modules/helpers:145:19)
          at jitiResolve (/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/dist/jiti.cjs:1:148703)
          at jitiRequire (/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/dist/jiti.cjs:1:150290)
          at import (/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/dist/jiti.cjs:1:158307)
          at /Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/__test__/jiti/src/bin.ts-jiti.tsconfig-all.ts:2:34
          at eval_evalModule (/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/dist/jiti.cjs:1:155533)
          at jitiRequire (/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/dist/jiti.cjs:1:150967)
          at Function.import (/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/dist/jiti.cjs:1:158307)
          at file:///Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/node_modules/jiti/lib/jiti-cli.mjs:31:18 {
        code: 'MODULE_NOT_FOUND',
        requireStack: [
          '/Users/michael_hladky/WebstormProjects/ts-jiti/tmp/e2e/ts-jiti-e2e/__test__/jiti/src/bin.ts-jiti.tsconfig-all.ts'
        ]
      }
      "
    `);
  });

  it('should run original jiti with environment variables', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.join(TEST_OUTPUT_DIR, 'jiti', 'src', 'bin.ts-jiti.import.ts'),
      ],
      cwd: envRoot,
      ignoreExitCode: true,
      env: {
        JITI_ALIAS: JSON.stringify({
          '@utils': path.join(envRoot, TEST_OUTPUT_DIR, 'jiti', 'src', 'utils'),
        }),
      },
    });

    expect(code).not.toBe(0);
    expect(removeColorCodes(stderr)).toMatchInlineSnapshot(`
      "env: node: No such file or directory
      "
    `);
  });
});
