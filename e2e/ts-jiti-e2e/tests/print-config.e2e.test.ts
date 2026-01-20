import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@push-based/test-utils';
import { executeProcess, tsconfig } from '@push-based/ts-jiti';
import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CLI print-config', () => {
  const fixtureDummyDir = path.join(
    __dirname,
    '..',
    'mocks',
    'fixtures',
    'minimal-setup',
  );

  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'print-config');

  const configFilePath = () =>
    path.relative(
      envRoot,
      path.join(testFileDir, 'config', `${tsconfig}.json`),
    );

  beforeAll(async () => {
    await cp(fixtureDummyDir, testFileDir, { recursive: true });
    await restoreNxIgnoredFiles(testFileDir);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should load tsconfig.json config file with correct arguments', async () => {
    // Ensure setup runs even when test is run in isolation
    await cp(fixtureDummyDir, testFileDir, { recursive: true });
    await restoreNxIgnoredFiles(testFileDir);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/ts-jiti',
        'print-config',
        `--tsconfig=${configFilePath()}`,
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    const json = JSON.parse(removeColorCodes(stdout));
    expect(json).toStrictEqual({
      tsconfigPath: expect.pathToEndWith(
        'tmp/e2e/ts-jiti-e2e/__test__/print-config/config/tsconfig.json',
      ),
      alias: {
        '@utils/*': expect.pathToEndWith(
          'tmp/e2e/ts-jiti-e2e/__test__/print-config/src/utils',
        ),
      },
      interopDefault: true,
      sourceMaps: true,
      jsx: true,
    });
  });
});
