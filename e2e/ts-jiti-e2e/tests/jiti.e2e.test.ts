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
console.log('args:', process.argv.slice(2));
`,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(baseFolder, 'bin.ts')),
        '--test-arg=123',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Executed over jiti-tsc');
    expect(stdout).toBe("args: [ '--test-arg=123' ]");

    await cleanup();
  });

  it('should load .ts', async () => {
    const d = getTestDir('load-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.js')]: `import { x } from './b.ts'; console.log(x);
console.log('args:', process.argv.slice(2));`,
      [path.join(d, 'b.ts')]: `export const x = 'load-ts';`,
    });
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(d, 'a.js')),
        '--load-arg=test',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toBe("args: [ '--load-arg=test' ]");
    await cleanup();
  });

  it('should exec .ts', async () => {
    const d = getTestDir('exec-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: `console.log('exec-ts');
console.log('args:', process.argv.slice(2));`,
    });
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--exec-arg=value',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toBe("args: [ '--exec-arg=value' ]");
    await cleanup();
  });

  it('should exec .ts loading .ts', async () => {
    const d = getTestDir('exec-ts-load-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: `import { x } from './b.js'; console.log(x);
console.log('args:', process.argv.slice(2));`,
      [path.join(d, 'b.ts')]: `export const x = 'exec-ts-load-ts';`,
    });
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--load-ts-arg=hello',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toBe("args: [ '--load-ts-arg=hello' ]");
    await cleanup();
  });

  it('should exec .ts with tsconfig.path loading .ts', async () => {
    const d = getTestDir('exec-ts-tsconfig-load-ts');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: {
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } },
      },
      [path.join(d, 'a.ts')]: `import { x } from '@/b.js'; console.log(x);
console.log('args:', process.argv.slice(2));`,
      [path.join(d, 'b.ts')]: `export const x = 'exec-ts-tsconfig-load-ts';`,
    });
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--tsconfig-arg=path-test',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
      },
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toBe("args: [ '--tsconfig-arg=path-test' ]");
    await cleanup();
  });

  it('should exec .ts with tsconfig.path loading .ts with tsconfig.path', async () => {
    const d = getTestDir('exec-ts-tsconfig-load-ts-tsconfig');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: {
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } },
      },
      [path.join(d, 'a.ts')]: `import { x } from '@/b.js'; console.log(x);
console.log('args:', process.argv.slice(2));`,
      [path.join(d, 'b.ts')]: `import { y } from '@/c.js'; export const x = y;`,
      [path.join(d, 'c.ts')]:
        `export const y = 'exec-ts-tsconfig-load-ts-tsconfig';`,
    });
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/jiti-tsc',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--complex-arg=multi-file',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
      },
      silent: true,
    });

    expect(code).toBe(0);
    expect(stdout).toBe("args: [ '--complex-arg=multi-file' ]");
    await cleanup();
  });

  it('should execute ts file with --import jiti-tsc', async () => {
    const baseFolder = getTestDir('exec-jiti-tsc');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'bin.ts')]: `#!/usr/bin/env node
console.log(\`Executed over --import jiti-tsc\`);
console.log('args:', process.argv.slice(2));
`,
    });

    const { code, stdout } = await executeProcess({
      command: process.execPath,
      args: [
        path.relative(envRoot, path.join(baseFolder, 'bin.ts')),
        '--myArg=42',
      ],
      cwd: envRoot,
      silent: true,
      env: {
        NODE_OPTIONS: '--import @push-based/jiti-tsc',
      },
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Executed over --import jiti-tsc');
    expect(stdout).toContain("args: [ '--myArg=42' ]");

    await cleanup();
  });
});
