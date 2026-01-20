import { MEMFS_VOLUME } from '@push-based/test-utils';
import { vol } from 'memfs';
import type { CompilerOptions } from 'typescript';
import {
  mapTsPathsToJitiAlias,
  parseTsConfigToJitiConfig,
} from './jiti.schema';

describe('mapTsPathsToJitiAlias', () => {
  it('returns empty object when paths is empty', () => {
    expect(mapTsPathsToJitiAlias({}, '/base')).toStrictEqual({});
  });

  it('returns empty object when all path mappings are empty arrays', () => {
    expect(mapTsPathsToJitiAlias({ '@/*': [] }, '/base')).toStrictEqual({});
  });

  it('maps single path pattern without wildcards', () => {
    expect(mapTsPathsToJitiAlias({ '@': ['src'] }, '/base')).toStrictEqual({
      '@': '/base/src',
    });
  });

  it('strips /* from path pattern and mapping', () => {
    expect(mapTsPathsToJitiAlias({ '@/*': ['src/*'] }, '/base')).toStrictEqual({
      '@': '/base/src',
    });
  });

  it('resolves relative path mappings to absolute', () => {
    expect(mapTsPathsToJitiAlias({ '@/*': ['src/*'] }, '/app')).toStrictEqual({
      '@': '/app/src',
    });
  });

  it('keeps absolute path mappings as-is', () => {
    expect(
      mapTsPathsToJitiAlias({ '@/*': ['/absolute/path/*'] }, '/base'),
    ).toStrictEqual({ '@': '/absolute/path' });
  });

  it('uses first mapping when multiple exist', () => {
    expect(
      mapTsPathsToJitiAlias({ '@/*': ['first/*', 'second/*'] }, '/base'),
    ).toStrictEqual({ '@': '/base/first' });
  });

  it('maps multiple path patterns', () => {
    expect(
      mapTsPathsToJitiAlias(
        {
          '@/*': ['src/*'],
          '~/*': ['lib/*'],
        },
        '/base',
      ),
    ).toStrictEqual({
      '@': '/base/src',
      '~': '/base/lib',
    });
  });

  it('filters out invalid mappings and keeps valid ones', () => {
    expect(
      mapTsPathsToJitiAlias(
        {
          'invalid/*': [],
          '@/*': ['src/*'],
          'also-invalid': [],
        },
        '/base',
      ),
    ).toStrictEqual({
      '@': '/base/src',
    });
  });

  describe('with vol.fromJSON file system setup', () => {
    it('tests both absolute and relative path resolution', () => {
      // Set up a virtual file system with both absolute and relative path scenarios
      vol.fromJSON(
        {
          // Files to test absolute paths (these should remain unchanged)
          '/absolute/src/index.ts': 'export const absolute = true;',
          '/absolute/lib/utils.ts': 'export const utils = true;',

          // Files to test relative paths (these should be resolved relative to baseUrl)
          'project/src/components/Button.ts': 'export const Button = () => {};',
          'project/lib/helpers.ts': 'export const helpers = () => {};',

          // Base directory structure
          'project/package.json': '{"name": "test-project"}',
        },
        MEMFS_VOLUME,
      );

      const baseUrl = '/test/project';

      // Test case 1: Absolute paths should remain absolute
      const absolutePathsResult = mapTsPathsToJitiAlias(
        {
          '@absolute/*': ['/absolute/src/*'],
          '~/*': ['/absolute/lib/*'],
        },
        baseUrl,
      );

      expect(absolutePathsResult).toStrictEqual({
        '@absolute': '/absolute/src',
        '~': '/absolute/lib',
      });

      // Test case 2: Relative paths should be resolved relative to baseUrl
      const relativePathsResult = mapTsPathsToJitiAlias(
        {
          '@/*': ['src/*'],
          'helpers/*': ['lib/*'],
        },
        baseUrl,
      );

      expect(relativePathsResult).toStrictEqual({
        '@': '/test/project/src',
        helpers: '/test/project/lib',
      });

      // Test case 3: Mixed absolute and relative paths
      const mixedPathsResult = mapTsPathsToJitiAlias(
        {
          '@/*': ['src/*'], // relative -> should resolve to /test/project/src
          '~/*': ['/absolute/lib/*'], // absolute -> should remain /absolute/lib
          'components/*': ['src/components/*'], // relative -> should resolve to /test/project/src/components
        },
        baseUrl,
      );

      expect(mixedPathsResult).toStrictEqual({
        '@': '/test/project/src',
        '~': '/absolute/lib',
        components: '/test/project/src/components',
      });
    });
  });
});

describe('parseTsConfigToJitiConfig', () => {
  it('returns empty object when compiler options are empty', () => {
    expect(parseTsConfigToJitiConfig({})).toStrictEqual({});
  });

  it('includes alias when paths exist', () => {
    const compilerOptions: CompilerOptions = {
      paths: { '@/*': ['src/*'] },
      baseUrl: '/base',
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      alias: { '@': '/base/src' },
    });
  });

  it('includes interopDefault when esModuleInterop exists', () => {
    const compilerOptions: CompilerOptions = {
      esModuleInterop: true,
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      interopDefault: true,
    });
  });

  it('includes sourceMaps when sourceMap exists', () => {
    const compilerOptions: CompilerOptions = {
      sourceMap: true,
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      sourceMaps: true,
    });
  });

  it('includes jsx when jsx is set and not zero', () => {
    const compilerOptions: CompilerOptions = {
      jsx: 'react', // JsxEmit.React
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      jsx: true,
    });
  });

  it('excludes jsx when jsx is none', () => {
    const compilerOptions: CompilerOptions = {
      jsx: 'none', // JsxEmit.None
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({});
  });

  it('combines multiple options when present', () => {
    const compilerOptions: CompilerOptions = {
      paths: { '@/*': ['src/*'] },
      baseUrl: '/base',
      esModuleInterop: true,
      sourceMap: false,
      jsx: 'preserve', // JsxEmit.Preserve
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      alias: { '@': '/base/src' },
      interopDefault: true,
      sourceMaps: false,
      jsx: true,
    });
  });

  it('uses process.cwd when baseUrl is missing', () => {
    const compilerOptions: CompilerOptions = {
      paths: { '@/*': ['src/*'] },
    };

    const result = parseTsConfigToJitiConfig(compilerOptions);
    expect(result.alias?.['@']).toBeDefined();
    expect(result.alias?.['@']).toMatch(/^\/.*\/src$/);
  });
});
