import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  TEST_OUTPUT_DIR,
  fsFromJson,
  osAgnosticPath,
} from '@push-based/test-utils';
import { createJiti } from 'jiti';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { TsConfigJson } from 'type-fest';
import { describe, expect, it } from 'vitest';
import { importModule, jitiOptionsFromTsConfig } from './jiti.js';

type Plugin = {
  slug: string;
  runner: () => { result: number };
};
const pluginContent = (
  slug: string,
  isCommonJS = false,
  utilImport?: string,
) => {
  const importStatement = utilImport
    ? `import { formatString } from '${utilImport}';\n`
    : '';
  const pluginObj = `
${importStatement}const plugin = {
  slug: '${slug}',
  runner: () => ({ result: ${utilImport ? `formatString('${slug}')` : `'${slug}'`} }),
};`;
  return isCommonJS
    ? `${pluginObj}\nmodule.exports = plugin;`
    : `${pluginObj}\nexport default plugin;`;
};

const utilsContent = `
export function formatString(str: string): string {
  return \`formatted-\${str}\`;
}
`;

const testFileDir = () =>
  path.join('tmp/int', nxTargetProject(), TEST_OUTPUT_DIR);

describe('jiti', () => {
  it('should use jiti.esmResolve to resolve module paths', async () => {
    const baseFolder = path.join(testFileDir(), 'jiti-esm-resolve');
    const testFile = path.join(baseFolder, 'test.mjs');

    const cleanup = await fsFromJson({
      [testFile]: `export const value = 'esm-resolved';`,
    });

    const absolutePath = path.resolve(testFile);
    const j = createJiti(absolutePath);
    // jiti.esmResolve(id) is similar to import.meta.resolve(id)
    // Returns a file:// URL, so we need to convert it to a file path for comparison
    const resolvedPath = j.esmResolve('./test.mjs', baseFolder);
    // Expected: file://<workspace>/tmp/int/jiti-tsc/__test__/jiti-esm-resolve/test.mjs
    const expectedPath = `file://${path.resolve(baseFolder, 'test.mjs')}`;

    expect(resolvedPath).toMatchPath(expectedPath);

    await cleanup();
  });

  it('should use jiti.esmResolve to resolve module paths with alias', async () => {
    const baseFolder = path.join(testFileDir(), 'jiti-esm-resolve-alias');
    const testFile = path.join(baseFolder, 'test.mjs');
    const utilsFile = path.join(baseFolder, 'utils', 'helper.mjs');

    const cleanup = await fsFromJson({
      [testFile]: `export const value = 'esm-resolved-alias';`,
      [utilsFile]: `export const helper = 'helper-value';`,
    });

    const absolutePath = path.resolve(testFile);
    const utilsDir = path.resolve(baseFolder, 'utils');
    const j = createJiti(absolutePath, {
      alias: {
        '@utils': utilsDir,
      },
    });
    // jiti.esmResolve(id) is similar to import.meta.resolve(id)
    // Returns a file:// URL, so we need to convert it to a file path for comparison
    // Test that alias resolution works with esmResolve
    const resolvedPath = j.esmResolve('@utils/helper.mjs', baseFolder);
    // Expected: file://<workspace>/tmp/int/jiti-tsc/__test__/jiti-esm-resolve-alias/utils/helper.mjs
    const expectedPath = pathToFileURL(
      path.resolve(baseFolder, 'utils', 'helper.mjs'),
    ).href;

    expect(resolvedPath).toBe(expectedPath);

    await cleanup();
  });

  it('should use jiti.import with default option', async () => {
    const baseFolder = path.join(testFileDir(), 'jiti-default-export');
    const testFile = path.join(baseFolder, 'test.mjs');

    const cleanup = await fsFromJson({
      [testFile]: `const value = 'default-export'; export default value;`,
    });

    const absolutePath = path.resolve(testFile);
    const j = createJiti(absolutePath);
    // jiti.import(id, { default: true }) is shortcut to mod?.default ?? mod
    const modDefault = await j.import(absolutePath, { default: true });

    expect(modDefault).toBe('default-export');

    await cleanup();
  });

  it('should use jiti.import with alias option single @utils', async () => {
    const baseFolder = path.join(testFileDir(), 'jiti-alias-single');
    const mainFile = path.join(baseFolder, 'main.mjs');
    const utilsFile = path.join(baseFolder, 'utils', 'helper.mjs');

    const cleanup = await fsFromJson({
      [mainFile]: `
      import { helper } from '@utils/helper';
      export const result = helper('test');
    `,
      [utilsFile]: `
      export function helper(str) {
        return \`helper-\${str}\`;
      }
    `,
    });

    const absolutePath = path.resolve(mainFile);
    const utilsDir = path.resolve(path.dirname(utilsFile));
    const j = createJiti(absolutePath, {
      alias: {
        '@utils': utilsDir,
      },
    });

    const mod = (await j.import(absolutePath)) as { result: string };
    expect(mod.result).toBe('helper-test');

    await cleanup();
  });

  it('should use jiti.import with alias option wildcard @utils/*', async () => {
    const baseFolder = path.join(testFileDir(), 'jiti-alias-wildcard');
    const mainFile = path.join(baseFolder, 'main.mjs');
    const utilsFile = path.join(baseFolder, 'utils', 'helper.mjs');

    const cleanup = await fsFromJson({
      [mainFile]: `
      import { helper } from '@utils/helper';
      export const result = helper('test');
    `,
      [utilsFile]: `
      export function helper(str) {
        return \`helper-\${str}\`;
      }
    `,
    });

    const absolutePath = path.resolve(mainFile);
    const utilsDir = path.resolve(path.dirname(utilsFile));
    const j = createJiti(absolutePath, {
      alias: {
        '@utils': utilsDir,
      },
    });

    const mod = (await j.import(absolutePath)) as { result: string };
    expect(mod.result).toBe('helper-test');

    await cleanup();
  });
});

describe('jitiOptionsFromTsConfig', () => {
  it('throws error when tsconfig has path overloads (multiple mappings)', async () => {
    const baseFolder = path.join(testFileDir(), 'tsconfig-path-overloads');
    const tsconfigFile = path.join(baseFolder, 'tsconfig.json');
    const indexFile = path.join(baseFolder, 'index.ts');

    const cleanup = await fsFromJson({
      [indexFile]: 'export const t = 42;',
      [tsconfigFile]: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*', './lib/*'], // Multiple mappings - overloads not supported
          },
        },
        include: ['*.ts'],
      },
    });

    const tsconfigPath = path.resolve(tsconfigFile);

    await expect(jitiOptionsFromTsConfig(tsconfigPath)).rejects.toThrow(
      "TypeScript path overloads are not supported by jiti. Path pattern '@/*' has 2 mappings: ./src/*, ./lib/*. Jiti only supports a single alias mapping per pattern.",
    );

    await cleanup();
  });
});

describe('importModule', () => {
  const testCaseDir = (name: string) =>
    path.join(testFileDir(), 'importModule', name);
  const setupRegistry = new Set<() => Promise<void>>();

  /**
   * Sets up a test case for the importModule function.
   * It aims to simulate a real-world scenario where a modules are loaded at runtime.
   *
   * Folder structure:
   * <root>/
   * ├── utils/
   * │   └── string.ts
   * ├── plugin.<ext> (imports utils/string.ts from <utilImport>)
   * ├─? tsconfig.base.json (configured with <tsconfigBase>)
   * └─? tsconfig.json (configured with <tsconfig>, extends tsconfig.base.json if given)
   */
  async function setupTestCase(options: {
    case: string;
    plugin?: { slug?: string; ext?: string; utilImport?: string };
    tsconfig: TsConfigJson;
    tsconfigBase?: TsConfigJson;
  }): Promise<{
    filepath: string;
    tsconfig: string;
    tsconfigBase?: string;
    cleanup: () => Promise<void>;
  }>;
  async function setupTestCase(options: {
    case: string;
    plugin?: { slug?: string; ext?: string; utilImport?: string };
    tsconfig?: undefined;
    tsconfigBase?: TsConfigJson;
  }): Promise<{
    filepath: string;
    tsconfig?: undefined;
    tsconfigBase?: string;
    cleanup: () => Promise<void>;
  }>;
  async function setupTestCase({
    case: testCase,
    plugin = {},
    tsconfig,
    tsconfigBase,
  }: {
    case: string;
    plugin?: { slug?: string; ext?: string; utilImport?: string };
    tsconfig?: TsConfigJson;
    tsconfigBase?: TsConfigJson;
  }) {
    const base = testCaseDir(testCase);
    const slug = plugin.slug ?? testCase;
    const ext = plugin.ext ?? 'mjs';
    const isCjs = ext === 'cjs';

    const pluginPath = path.join(base, `plugin.${ext}`);
    const basePath = tsconfigBase
      ? path.join(base, 'tsconfig.base.json')
      : undefined;
    const configPath = tsconfig ? path.join(base, 'tsconfig.json') : undefined;

    const utilFiles = plugin.utilImport
      ? (() => {
          const [, alias, rest] =
            plugin.utilImport.match(/^@([^/]+)\/(.+)$/) ?? [];
          const utilPath = path.join(
            base,
            alias ?? '',
            `${(rest ?? plugin.utilImport.replace(/^@[^/]+\//, '')).replace(/\/$/, '')}.ts`,
          );
          return { [utilPath]: utilsContent };
        })()
      : {};

    const tsconfigFiles = {
      ...(basePath && { [basePath]: tsconfigBase }),
      ...(configPath && {
        [configPath]: basePath
          ? { ...tsconfig, extends: './tsconfig.base.json' }
          : tsconfig,
      }),
    };

    const files: Record<string, unknown> = {
      [pluginPath]: pluginContent(slug, isCjs, plugin.utilImport),
      ...utilFiles,
      ...tsconfigFiles,
    };

    const tsconfigBasePath = basePath;
    const tsconfigPath = configPath;

    const cleanup = await fsFromJson(files);
    setupRegistry.add(cleanup);

    return {
      filepath: path.join(base, `plugin.${ext}`),
      ...(tsconfigPath ? { tsconfig: tsconfigPath } : {}),
      ...(tsconfigBasePath ? { tsconfigBase: tsconfigBasePath } : {}),
      cleanup,
    };
  }

  beforeAll(async () => {
    await Promise.all([...setupRegistry].map(cleanup => cleanup()));
  });

  afterEach(async () => {
    await Promise.all([...setupRegistry].map(cleanup => cleanup()));
  });

  it.each([
    { ext: 'mjs', slug: 'load-esm' },
    { ext: 'js', slug: 'load-js' },
    { ext: 'ts', slug: 'load-ts' },
  ])('should load a module with $ext extension', async ({ ext, slug }) => {
    const { filepath } = await setupTestCase({
      case: slug,
      plugin: { slug, ext },
    });

    const plugin = await importModule<Plugin>({
      filepath: path.resolve(filepath),
    });

    expect(plugin).toStrictEqual({ slug, runner: expect.any(Function) });
    expect(plugin.runner()).toStrictEqual({ result: slug });
  });

  it('should load a valid TS module with a tsconfig', async () => {
    const slug = 'load-ts-tscconfig';
    const { filepath, tsconfig } = await setupTestCase({
      case: slug,
      plugin: { slug, ext: 'ts' },
      tsconfig: {
        compilerOptions: {
          module: 'ESNext',
        },
      },
    });

    const plugin = await importModule<Plugin>({
      filepath: path.resolve(filepath),
      tsconfig: path.resolve(tsconfig),
    });

    expect(plugin).toStrictEqual({ slug, runner: expect.any(Function) });
    expect(plugin.runner()).toStrictEqual({ result: slug });
  });

  it('should load a valid TS module with a tsconfig containing all jiti mappable options', async () => {
    const slug = 'load-ts-all-options';
    const { filepath, tsconfig } = await setupTestCase({
      case: slug,
      plugin: { slug, ext: 'ts', utilImport: '@utils/string' },
      tsconfig: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@utils/*': ['./utils/*'],
          },
          esModuleInterop: true,
          sourceMap: true,
          jsx: 'react',
        },
      },
    });

    const plugin = await importModule<Plugin>({
      filepath: path.resolve(filepath),
      tsconfig: tsconfig ? path.resolve(tsconfig) : undefined,
    });

    expect(plugin).toStrictEqual({ slug, runner: expect.any(Function) });
    expect(plugin.runner()).toStrictEqual({ result: `formatted-${slug}` });
  });

  it('should load a valid TS module with a extending tsconfig containing all jiti mappable options', async () => {
    const slug = 'load-ts-extending-tsconfig';
    const { filepath, tsconfig } = await setupTestCase({
      case: slug,
      plugin: { slug, ext: 'ts', utilImport: '@utils/string' },
      tsconfig: {
        compilerOptions: {
          baseUrl: '.',
        },
      },
      tsconfigBase: {
        compilerOptions: {
          paths: {
            '@utils/*': ['./utils/*'],
          },
          esModuleInterop: true,
          sourceMap: true,
          jsx: 'react',
        },
      },
    });

    const plugin = await importModule<Plugin>({
      filepath: path.resolve(filepath),
      tsconfig: tsconfig ? path.resolve(tsconfig) : undefined,
    });

    expect(plugin).toStrictEqual({ slug, runner: expect.any(Function) });
    expect(plugin.runner()).toStrictEqual({ result: `formatted-${slug}` });
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      importModule({ filepath: 'path/to/non-existent-export.mjs' }),
    ).rejects.toThrow(
      `File '${osAgnosticPath('path/to/non-existent-export.mjs')}' does not exist`,
    );
  });

  it('should throw if path is a directory', async () => {
    await expect(importModule({ filepath: '/tmp/' })).rejects.toThrow(
      `File '${osAgnosticPath('/tmp/')}' does not exist`,
    );
  });
});
