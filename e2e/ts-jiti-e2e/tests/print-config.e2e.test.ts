import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  fsFromJson,
} from '@push-based/test-utils';
import { executeProcess, tsconfig } from '@push-based/jiti-tsc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const testFileName = path.basename(__filename);

const toSlug = (str: string): string => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z\d-]/g, '');

describe('CLI print-config', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const describeName = 'CLI print-config';
  const describeSlug = toSlug(describeName);

  const getTestDir = (itName: string) => path.join(
      envRoot,
      TEST_OUTPUT_DIR,
      testFileName,
      describeSlug,
      toSlug(itName),
    );

  const configFilePath = (baseDir: string) =>
    path.relative(
      envRoot,
      path.join(baseDir, 'config', `${tsconfig}.json`),
    );

  it('should load tsconfig.json config file with correct arguments', async () => {
    const baseFolder = getTestDir('should load tsconfig.json config file with correct arguments');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'tsconfig.json')]: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@utils/*': ['./src/utils'],
          },
          esModuleInterop: true,
          sourceMap: true,
          jsx: 'preserve',
        },
      },
      [path.join(baseFolder, 'config', 'tsconfig.json')]: {
        compilerOptions: {
          baseUrl: '..',
          paths: {
            '@utils/*': ['./src/utils'],
          },
          esModuleInterop: true,
          sourceMap: true,
          jsx: 'preserve',
        },
        include: ['../src/**/*.ts'],
        exclude: ['../src/**/*.test.ts', '../dist', '../node_modules'],
      },
      [path.join(baseFolder, 'src', 'utils', 'string.ts')]: `export function to42(): number {
  return 42;
}
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        'print-config',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TS_CONFIG_PATH: configFilePath(baseFolder),
      },
    });

    expect(code).toBe(0);
    const json = JSON.parse(removeColorCodes(stdout));
    const expectedSlug = toSlug('should load tsconfig.json config file with correct arguments');
    expect(json).toStrictEqual({
      tsconfigPath: expect.pathToEndWith(
        `print-config.e2e.test.ts/${describeSlug}/${expectedSlug}/config/tsconfig.json`,
      ),
      alias: {
        '@utils': expect.pathToEndWith(
          `print-config.e2e.test.ts/${describeSlug}/${expectedSlug}/src/utils`,
        ),
      },
      interopDefault: true,
      sourceMaps: true,
      jsx: true,
    });

    await cleanup();
  });

  it('should use default ./tsconfig.json when JITI_TS_CONFIG_PATH is not set', async () => {
    const baseFolder = getTestDir('should use default ./tsconfig.json when JITI_TS_CONFIG_PATH is not set');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'tsconfig.json')]: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@utils/*': ['./src/utils'],
          },
          esModuleInterop: true,
          sourceMap: true,
          jsx: 'preserve',
        },
      },
      [path.join(baseFolder, 'src', 'utils', 'string.ts')]: `export function to42(): number {
  return 42;
}
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        'print-config',
      ],
      cwd: baseFolder,
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(([key]) => key !== 'JITI_TS_CONFIG_PATH')
        ),
      },
    });

    expect(code).toBe(0);
    const json = JSON.parse(removeColorCodes(stdout));
    const expectedSlug = toSlug('should use default ./tsconfig.json when JITI_TS_CONFIG_PATH is not set');
    expect(json).toStrictEqual({
      tsconfigPath: expect.pathToEndWith(
        `print-config.e2e.test.ts/${describeSlug}/${expectedSlug}/tsconfig.json`,
      ),
      alias: {
        '@utils': expect.pathToEndWith(
          `print-config.e2e.test.ts/${describeSlug}/${expectedSlug}/src/utils`,
        ),
      },
      interopDefault: true,
      sourceMaps: true,
      jsx: true,
    });

    await cleanup();
  });
});
