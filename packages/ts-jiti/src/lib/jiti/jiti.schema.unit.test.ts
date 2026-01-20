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
});

describe('parseTsConfigToJitiConfig', () => {
  it('returns empty object when compiler options are empty', () => {
    expect(parseTsConfigToJitiConfig({})).toStrictEqual({});
  });

  it('includes all options jiti can use', () => {
    const compilerOptions: CompilerOptions = {
      paths: {
        '@app/*': ['src/*'],
        '@lib/*': ['lib/*'],
      },
      esModuleInterop: true,
      sourceMap: true,
      jsx: 2, // JsxEmit.React
      include: ['**/*.ts'],

      baseUrl: '/base',
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      alias: { '@app': '/base/src', '@lib': '/base/lib' },
      interopDefault: true,
      sourceMaps: true,
      jsx: true,
    });
  });
});
