import { executeProcess, tsconfig } from '@push-based/jiti-tsc';
import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  fsFromJson,
  removeColorCodes,
} from '@push-based/test-utils';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const testFileName = path.basename(__filename);

const toSlug = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z\d-]/g, '');

describe('CLI print-config', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const describeName = 'CLI print-config';
  const describeSlug = toSlug(describeName);

  const getTestDir = (itName: string) =>
    path.join(
      envRoot,
      TEST_OUTPUT_DIR,
      testFileName,
      describeSlug,
      toSlug(itName),
    );

  const configFilePath = (baseDir: string) =>
    path.resolve(path.join(baseDir, 'config', `${tsconfig}.json`));

  it('should load tsconfig.json config file with correct arguments', async () => {
    const baseFolder = getTestDir(
      'should load tsconfig.json config file with correct arguments',
    );
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
      [path.join(baseFolder, 'src', 'utils', 'string.ts')]:
        `export function to42(): number {
  return 42;
}
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@push-based/jiti-tsc', 'print-config'],
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: configFilePath(baseFolder),
      },
      cwd: baseFolder,
    });

    expect(code).toBe(0);
    const json = JSON.parse(removeColorCodes(stdout));
    expect(json.tsconfigPath).toMatchPath(
      path.resolve(path.join(baseFolder, 'config', 'tsconfig.json')),
    );
    expect(json.alias).toStrictEqual({
      '@utils': expect.pathToMatch(
        path.resolve(path.join(baseFolder, 'src', 'utils')),
      ),
    });
    expect(json.interopDefault).toBe(true);
    expect(json.sourceMaps).toBe(true);
    expect(json.jsx).toBe(true);

    await cleanup();
  });

  it('should use default ./tsconfig.json when JITI_TSCONFIG_PATH is not set', async () => {
    const baseFolder = getTestDir(
      'should use default ./tsconfig.json when JITI_TSCONFIG_PATH is not set',
    );
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
      [path.join(baseFolder, 'src', 'utils', 'string.ts')]:
        `export function to42(): number {
  return 42;
}
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@push-based/jiti-tsc', 'print-config'],
      cwd: baseFolder,
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) => key !== 'JITI_TSCONFIG_PATH',
          ),
        ),
      },
    });

    expect(code).toBe(0);
    const json = JSON.parse(removeColorCodes(stdout));
    expect(json.tsconfigPath).toMatchPath(
      path.resolve(path.join(baseFolder, 'tsconfig.json')),
    );
    expect(json.alias).toStrictEqual({
      '@utils': expect.pathToMatch(
        path.resolve(path.join(baseFolder, 'src', 'utils')),
      ),
    });
    expect(json.interopDefault).toBe(true);
    expect(json.sourceMaps).toBe(true);
    expect(json.jsx).toBe(true);

    await cleanup();
  });
});
