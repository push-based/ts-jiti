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
      jsx: 2, // JsxEmit.React
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({
      jsx: true,
    });
  });

  it('excludes jsx when jsx is zero', () => {
    const compilerOptions: CompilerOptions = {
      jsx: 0, // JsxEmit.None
    };

    expect(parseTsConfigToJitiConfig(compilerOptions)).toStrictEqual({});
  });

  it('combines multiple options when present', () => {
    const compilerOptions: CompilerOptions = {
      paths: { '@/*': ['src/*'] },
      baseUrl: '/base',
      esModuleInterop: true,
      sourceMap: false,
      jsx: 1, // JsxEmit.Preserve
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
