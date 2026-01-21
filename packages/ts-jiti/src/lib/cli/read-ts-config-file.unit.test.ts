import type { CompilerOptions } from 'typescript';
import { osAgnosticPath } from '@push-based/test-utils';
import { describe, expect, vi } from 'vitest';
import { parseTsConfigToJitiConfig } from '../jiti/jiti.schema.js';
import { autoloadTsc, readTscByPath } from './read-ts-config-file.js';

// Mock dependencies
vi.mock('../utils/file-system.js', async importOriginal => {
  const original = await importOriginal();
  return {
    ...(original as object),
    fileExists: vi.fn(),
    readJsonFile: vi.fn(),
  };
});

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    newline: vi.fn(),
    group: vi.fn(async (_, worker) => {
      const value = await worker();
      return typeof value === 'object' ? value.result : undefined;
    }),
    task: vi.fn(async (message, fn) => {
      const value = await fn();
      return typeof value === 'object' ? value.result : undefined;
    }),
    command: vi.fn((_, worker) => worker()),
  },
}));

// Mock TypeScript functions used by loadTargetConfig
vi.mock('typescript', async () => {
  const actual = await vi.importActual('typescript');
  return {
    ...actual,
    readConfigFile: vi.fn(),
    parseJsonConfigFileContent: vi.fn(),
    sys: {
      ...actual.sys,
      readFile: vi.fn(),
    },
  };
});

// Mock path functions
vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    join: vi.fn((...args) => args.join('/')),
    relative: vi.fn((from, to) => to),
  };
});

describe('readTscByPath', () => {
  let readConfigFile: any;
  let parseJsonConfigFileContent: any;

  beforeAll(async () => {
    const tsModule = await import('typescript');
    readConfigFile = tsModule.readConfigFile;
    parseJsonConfigFileContent = tsModule.parseJsonConfigFileContent;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed compiler options when reading config file', async () => {
    const mockConfig = { compilerOptions: { paths: { '@/*': ['./src/*'] } } };
    const mockParsedConfig = {
      options: mockConfig.compilerOptions,
      fileNames: ['src/index.ts'],
    };

    readConfigFile.mockReturnValueOnce({
      config: mockConfig,
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce(mockParsedConfig);

    const result = await readTscByPath('/path/to/tsconfig.json');

    expect(result).toStrictEqual(mockConfig.compilerOptions);
    expect(readConfigFile).toHaveBeenCalledWith(
      '/path/to/tsconfig.json',
      expect.any(Function),
    );
  });

  it('throws error when config file has errors', async () => {
    readConfigFile.mockReturnValueOnce({
      config: {},
      error: { messageText: 'Invalid config' },
    });

    await expect(readTscByPath('invalid.json')).rejects.toThrow(
      `Error reading TypeScript config file at ${osAgnosticPath('invalid.json')}:\nInvalid config`,
    );
  });
});

describe('autoloadTsc', () => {
  let fileExists: any;
  let readConfigFile: any;
  let parseJsonConfigFileContent: any;

  beforeAll(async () => {
    const fsModule = await import('../utils/file-system.js');
    const tsModule = await import('typescript');
    fileExists = fsModule.fileExists;
    readConfigFile = tsModule.readConfigFile;
    parseJsonConfigFileContent = tsModule.parseJsonConfigFileContent;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns config when tsconfig.json exists', async () => {
    const mockConfig = { compilerOptions: { paths: {} } };
    const mockParsedConfig = {
      options: mockConfig.compilerOptions,
      fileNames: ['file1.ts'],
    };

    fileExists.mockResolvedValueOnce(true);
    readConfigFile.mockReturnValueOnce({
      config: mockConfig,
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce(mockParsedConfig);

    const result = await autoloadTsc();

    expect(result).toStrictEqual(mockConfig.compilerOptions);
    expect(fileExists).toHaveBeenCalledWith('tsconfig.json');
  });

  it('returns empty object when no config file exists', async () => {
    fileExists.mockResolvedValueOnce(false);

    const result = await autoloadTsc();

    expect(result).toStrictEqual({});
    expect(fileExists).toHaveBeenCalledWith('tsconfig.json');
  });

  it('uses provided basename in search pattern', async () => {
    const mockConfig = { compilerOptions: { paths: {} } };
    const mockParsedConfig = {
      options: mockConfig.compilerOptions,
      fileNames: ['file1.ts'],
    };

    fileExists.mockResolvedValueOnce(true);
    readConfigFile.mockReturnValueOnce({
      config: mockConfig,
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce(mockParsedConfig);

    const result = await autoloadTsc('custom');

    expect(result).toStrictEqual(mockConfig.compilerOptions);
    expect(fileExists).toHaveBeenCalledWith('tsconfig.custom.json');
  });
});

describe('parseTsConfigToJitiConfig', () => {
  it('returns empty object when no paths exist', () => {
    const result = parseTsConfigToJitiConfig({});

    expect(result).toStrictEqual({});
  });

  it('returns empty object when paths object is empty', () => {
    const compilerOptions = {
      paths: {},
    } as CompilerOptions;

    const result = parseTsConfigToJitiConfig(compilerOptions);

    expect(result).toStrictEqual({});
  });

  it('returns empty object when compilerOptions has no paths', () => {
    const compilerOptions = {} as CompilerOptions;

    const result = parseTsConfigToJitiConfig(compilerOptions);

    expect(result).toStrictEqual({});
  });

  it('converts paths to alias format', () => {
    const compilerOptions = {
      paths: {
        '@/*': ['./src/*'],
        '@/components/*': ['./src/components/*'],
      },
      baseUrl: '/base',
    } as CompilerOptions;

    const result = parseTsConfigToJitiConfig(compilerOptions);

    expect(result).toStrictEqual({
      alias: {
        '@': '/base/src',
        '@/components': '/base/src/components',
      },
    });
  });

  it('removes trailing /* from both keys and values', () => {
    const compilerOptions = {
      paths: {
        '@app/*': ['src/app/*'],
        'utils/*': ['lib/utils/*'],
      },
      baseUrl: '/base',
    } as CompilerOptions;

    const result = parseTsConfigToJitiConfig(compilerOptions);

    expect(result).toStrictEqual({
      alias: {
        '@app': '/base/src/app',
        utils: '/base/lib/utils',
      },
    });
  });

  it('handles paths with multiple mappings by using first one', () => {
    const compilerOptions = {
      paths: {
        '@/*': ['./src/*', './lib/*'],
      },
      baseUrl: '/base',
    } as CompilerOptions;

    const result = parseTsConfigToJitiConfig(compilerOptions);

    expect(result).toStrictEqual({
      alias: {
        '@': '/base/src',
      },
    });
  });

  it('ignores invalid path mappings', () => {
    const compilerOptions = {
      paths: {
        '@/*': ['./src/*'],
        'invalid/*': null as any,
        'empty/*': [],
      },
      baseUrl: '/base',
    } as CompilerOptions;

    const result = parseTsConfigToJitiConfig(compilerOptions);

    expect(result).toStrictEqual({
      alias: {
        '@': '/base/src',
      },
    });
  });
});
