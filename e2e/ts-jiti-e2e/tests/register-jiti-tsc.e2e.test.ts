import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  executeProcess,
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

const binImportJitiTscContent = `#!/usr/bin/env node
console.log(\`Executed over --import @push-based/jiti-tsc/register\`);
console.log('args:', process.argv.slice(2));
`;

const loadTsAContent = `import { x } from './b.ts'; console.log(x);
console.log('args:', process.argv.slice(2));`;

const loadTsBContent = `export const x = 'load-ts-loader';`;

const execTsAContent = `console.log('exec-ts-loader');
console.log('args:', process.argv.slice(2));`;

const execTsLoadTsAContent = `import { x } from './b.js'; console.log(x);
console.log('args:', process.argv.slice(2));`;

const execTsLoadTsBContent = `export const x = 'exec-ts-load-ts-loader';`;

const tsconfigPathAContent = `import { x } from '@/b.js'; console.log(x);
console.log('args:', process.argv.slice(2));`;

const tsconfigPathBContent = `export const x = 'exec-ts-tsconfig-load-ts-loader';`;

const tsconfigPathComplexBContent = `import { y } from '@/c.js'; export const x = y;`;

const tsconfigPathComplexCContent = `export const y = 'exec-ts-tsconfig-load-ts-tsconfig-loader';`;

const tsconfigPathContent = {
  compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } },
};

const tsconfigMultiplePathsContent = {
  compilerOptions: {
    baseUrl: '.',
    paths: {
      '@/*': ['./*'],
      '@components/*': ['./src/components/*'],
      '@utils/*': ['./src/utils/*'],
      '@lib': ['./src/lib/index.ts'],
      '~/*': ['./src/*'],
    },
  },
};

const tsconfigPathUtilsContent = `import { helper } from '@utils/helpers'; console.log(helper);
console.log('args:', process.argv.slice(2));`;

const tsconfigPathUtilsHelperContent = `export const helper = 'utils-helper-loader';`;

const tsconfigPathComponentsContent = `import { Button } from '@components/Button'; console.log(Button);
console.log('args:', process.argv.slice(2));`;

const tsconfigPathButtonContent = `export const Button = 'Button-component-loader';`;

const tsconfigPathLibContent = `import lib from '@lib'; console.log(lib);
console.log('args:', process.argv.slice(2));`;

const tsconfigPathLibIndexContent = `export default 'lib-index-loader';`;

const tsconfigPathTildeContent = `import { config } from '~/config/app'; console.log(config);
console.log('args:', process.argv.slice(2));`;

const tsconfigPathAppConfigContent = `export const config = { app: 'config-loader' };`;

describe('Loader hook (--import)', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const describeName = 'Loader hook (--import)';
  const describeSlug = toSlug(describeName);

  const getTestDir = (itName: string) =>
    path.join(
      envRoot,
      TEST_OUTPUT_DIR,
      testFileName,
      describeSlug,
      toSlug(itName),
    );

  it('should execute ts file with --import @push-based/jiti-tsc/register loader hook', async () => {
    const baseFolder = getTestDir('exec-loader-hook');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'bin.ts')]: binImportJitiTscContent,
    });

    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(baseFolder, 'bin.ts')),
        '--myArg=42',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'Executed over --import @push-based/jiti-tsc/register',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--myArg=42' ]",
    );

    await cleanup();
  });

  it('should load .ts files through loader hook', async () => {
    const d = getTestDir('load-ts-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: loadTsAContent,
      [path.join(d, 'b.ts')]: loadTsBContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--load-arg=test',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'load-ts-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--load-arg=test' ]",
    );
    await cleanup();
  });

  it('should exec .ts through loader hook', async () => {
    const d = getTestDir('exec-ts-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: execTsAContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--exec-arg=value',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'exec-ts-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--exec-arg=value' ]",
    );
    await cleanup();
  });

  it('should exec .ts loading .ts through loader hook', async () => {
    const d = getTestDir('exec-ts-load-ts-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'a.ts')]: execTsLoadTsAContent,
      [path.join(d, 'b.ts')]: execTsLoadTsBContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--load-ts-arg=hello',
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'exec-ts-load-ts-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--load-ts-arg=hello' ]",
    );
    await cleanup();
  });

  it('should exec .ts with tsconfig.path loading .ts through loader hook', async () => {
    const d = getTestDir('exec-ts-tsconfig-load-ts-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: tsconfigPathContent,
      [path.join(d, 'a.ts')]: tsconfigPathAContent,
      [path.join(d, 'b.ts')]: tsconfigPathBContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
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
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'exec-ts-tsconfig-load-ts-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--tsconfig-arg=path-test' ]",
    );
    await cleanup();
  });

  it('should exec .ts with tsconfig.path loading .ts with tsconfig.path through loader hook', async () => {
    const d = getTestDir('exec-ts-tsconfig-load-ts-tsconfig-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: tsconfigPathContent,
      [path.join(d, 'a.ts')]: tsconfigPathAContent,
      [path.join(d, 'b.ts')]: tsconfigPathComplexBContent,
      [path.join(d, 'c.ts')]: tsconfigPathComplexCContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
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
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'exec-ts-tsconfig-load-ts-tsconfig-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--complex-arg=multi-file' ]",
    );
    await cleanup();
  });

  it('should exec .ts with multiple path aliases (@utils) through loader hook', async () => {
    const d = getTestDir('exec-ts-multiple-paths-utils-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: tsconfigMultiplePathsContent,
      [path.join(d, 'a.ts')]: tsconfigPathUtilsContent,
      [path.join(d, 'src', 'utils', 'helpers.ts')]:
        tsconfigPathUtilsHelperContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--utils-arg=test',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
      },
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'utils-helper-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--utils-arg=test' ]",
    );
    await cleanup();
  });

  it('should exec .ts with multiple path aliases (@components) through loader hook', async () => {
    const d = getTestDir('exec-ts-multiple-paths-components-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: tsconfigMultiplePathsContent,
      [path.join(d, 'a.ts')]: tsconfigPathComponentsContent,
      [path.join(d, 'src', 'components', 'Button.ts')]:
        tsconfigPathButtonContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--components-arg=test',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
      },
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'Button-component-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--components-arg=test' ]",
    );
    await cleanup();
  });

  it('should exec .ts with multiple path aliases (@lib exact match) through loader hook', async () => {
    const d = getTestDir('exec-ts-multiple-paths-lib-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: tsconfigMultiplePathsContent,
      [path.join(d, 'a.ts')]: tsconfigPathLibContent,
      [path.join(d, 'src', 'lib', 'index.ts')]: tsconfigPathLibIndexContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--lib-arg=test',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
      },
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'lib-index-loader',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--lib-arg=test' ]",
    );
    await cleanup();
  });

  it('should exec .ts with multiple path aliases (~ alias) through loader hook', async () => {
    const d = getTestDir('exec-ts-multiple-paths-tilde-loader');
    const cleanup = await fsFromJson({
      [path.join(d, 'tsconfig.json')]: tsconfigMultiplePathsContent,
      [path.join(d, 'a.ts')]: tsconfigPathTildeContent,
      [path.join(d, 'src', 'config', 'app.ts')]: tsconfigPathAppConfigContent,
    });
    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        '--import',
        '@push-based/jiti-tsc/register',
        path.relative(envRoot, path.join(d, 'a.ts')),
        '--tilde-arg=test',
      ],
      cwd: envRoot,
      env: {
        ...process.env,
        JITI_TSCONFIG_PATH: path.resolve(path.join(d, 'tsconfig.json')),
      },
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "{ app: 'config-loader' }",
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--tilde-arg=test' ]",
    );
    await cleanup();
  });

  it('should work with NODE_OPTIONS environment variable', async () => {
    const baseFolder = getTestDir('exec-node-options');
    const cleanup = await fsFromJson({
      [path.join(baseFolder, 'bin.ts')]: binImportJitiTscContent,
    });

    const { code, stdout, stderr } = await executeProcess({
      command: process.execPath,
      args: [
        path.relative(envRoot, path.join(baseFolder, 'bin.ts')),
        '--myArg=42',
      ],
      cwd: envRoot,
      silent: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--import @push-based/jiti-tsc/register',
      },
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      'Executed over --import @push-based/jiti-tsc/register',
    );
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain(
      "args: [ '--myArg=42' ]",
    );

    await cleanup();
  });
});
