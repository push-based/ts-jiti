import { executeProcess } from '@push-based/jiti-tsc';
import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  fsFromJson,
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

describe('CLI jiti', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const describeName = 'CLI jiti';
  const describeSlug = toSlug(describeName);

  const getTestDir = (itName: string) =>
    path.join(
      envRoot,
      TEST_OUTPUT_DIR,
      testFileName,
      describeSlug,
      toSlug(itName),
    );

  it('should execute ts file with jiti-tsc', async () => {
    const baseFolder = getTestDir('exec-jiti-tsc');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'bin.ts')]: `#!/usr/bin/env node
console.log(\`Executed over jiti-tsc\`);
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(baseFolder, 'bin.ts')),
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Executed over jiti-tsc');

    await cleanup();
  });

  it('should load .ts', async () => {
    const d = getTestDir('load-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.js')]: `import { x } from './b.ts'; console.log(x);`,
      [path.join(d, 'b.ts')]: `export const x = 'load-ts';`,
    });
    await expect(
      executeProcess({
        command: 'npx',
        args: [
          '@push-based/jiti-tsc',
          path.relative(envRoot, path.join(d, 'a.js')),
        ],
        cwd: envRoot,
        silent: true,
      }),
    ).resolves.toMatchObject({
      code: 0,
      stdout: expect.stringContaining('load-ts'),
    });
    await cleanup();
  });

  it('should exec .ts', async () => {
    const d = getTestDir('exec-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: `console.log('exec-ts');`,
    });
    await expect(
      executeProcess({
        command: 'npx',
        args: [
          '@push-based/jiti-tsc',
          path.relative(envRoot, path.join(d, 'a.ts')),
        ],
        cwd: envRoot,
        silent: true,
      }),
    ).resolves.toMatchObject({
      code: 0,
      stdout: expect.stringContaining('exec-ts'),
    });
    await cleanup();
  });

  it('should exec .ts loading .ts', async () => {
    const d = getTestDir('exec-ts-load-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: `import { x } from './b.js'; console.log(x);`,
      [path.join(d, 'b.ts')]: `export const x = 'exec-ts-load-ts';`,
    });
    await expect(
      executeProcess({
        command: 'npx',
        args: [
          '@push-based/jiti-tsc',
          path.relative(envRoot, path.join(d, 'a.ts')),
        ],
        cwd: envRoot,
        silent: true,
      }),
    ).resolves.toMatchObject({
      code: 0,
      stdout: expect.stringContaining('exec-ts-load-ts'),
    });
    await cleanup();
  });

  it('should exec .ts with tsconfig.path loading .ts', async () => {
    const d = getTestDir('exec-ts-tsconfig-load-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: {
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } },
      },
      [path.join(d, 'a.ts')]: `import { x } from '@/b.js'; console.log(x);`,
      [path.join(d, 'b.ts')]: `export const x = 'exec-ts-tsconfig-load-ts';`,
    });
    await expect(
      executeProcess({
        command: 'npx',
        args: [
          '@push-based/jiti-tsc',
          path.relative(envRoot, path.join(d, 'a.ts')),
        ],
        cwd: envRoot,
        env: {
          ...process.env,
          JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
        },
        silent: true,
      }),
    ).resolves.toMatchObject({
      code: 0,
      stdout: expect.stringContaining('exec-ts-tsconfig-load-ts'),
    });
    await cleanup();
  });

  it('should exec .ts with tsconfig.path loading .ts with tsconfig.path', async () => {
    const d = getTestDir('exec-ts-tsconfig-load-ts-tsconfig');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: {
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } },
      },
      [path.join(d, 'a.ts')]: `import { x } from '@/b.js'; console.log(x);`,
      [path.join(d, 'b.ts')]: `import { y } from '@/c.js'; export const x = y;`,
      [path.join(d, 'c.ts')]:
        `export const y = 'exec-ts-tsconfig-load-ts-tsconfig';`,
    });
    await expect(
      executeProcess({
        command: 'npx',
        args: [
          '@push-based/jiti-tsc',
          path.relative(envRoot, path.join(d, 'a.ts')),
        ],
        cwd: envRoot,
        env: {
          ...process.env,
          JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
        },
        silent: true,
      }),
    ).resolves.toMatchObject({
      code: 0,
      stdout: expect.stringContaining('exec-ts-tsconfig-load-ts-tsconfig'),
    });
    await cleanup();
  });

  it('should execute ts file with --import jiti-tsc', async () => {
    const baseFolder = getTestDir('exec-jiti-tsc');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'bin.ts')]: `#!/usr/bin/env node
console.log(\`Executed over --import jiti-tsc\`);
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'node',
      args: [
        path.relative(envRoot, path.join(baseFolder, 'bin.ts')),
      ],
      cwd: envRoot,
      silent: true,
      env: {
        NODE_OPTIONS: "--import jiti-tsc"
      }
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Executed over --import jiti-tsc');

    await cleanup();
  });

});
