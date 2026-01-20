import { describe, expect, vi } from 'vitest';
import { logger } from '../utils/logger.js';
import {
  autoloadTsc,
  parseTsConfigToJitiConfig,
  readTscByPath,
} from './read-ts-config-file.js';

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
    task: vi.fn((message, fn) => fn()),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('readTscByPath', () => {
  let readJsonFile: any;

  beforeAll(async () => {
    const fsModule = await import('../utils/file-system.js');
    readJsonFile = fsModule.readJsonFile;
  });

  beforeEach(() => {
    vi.mocked(logger.task).mockImplementation(async (message, fn) => fn());
  });

  it('returns parsed JSON when reading config file', async () => {
    const mockConfig = { compilerOptions: { paths: { '@/*': ['./src/*'] } } };
    readJsonFile.mockResolvedValueOnce(mockConfig);

    const result = await readTscByPath('/path/to/tsconfig.json');

    expect(result).toStrictEqual(mockConfig);
    expect(readJsonFile).toHaveBeenCalledWith('/path/to/tsconfig.json');
  });

  it('handles undefined path', async () => {
    const mockConfig = { compilerOptions: {} };
    readJsonFile.mockResolvedValueOnce(mockConfig);

    const result = await readTscByPath(undefined);

    expect(result).toStrictEqual(mockConfig);
    expect(readJsonFile).toHaveBeenCalledWith(undefined);
  });
});

describe('autoloadTsc', () => {
  let fileExists: any;
  let readJsonFile: any;

  beforeAll(async () => {
    const fsModule = await import('../utils/file-system.js');
    fileExists = fsModule.fileExists;
    readJsonFile = fsModule.readJsonFile;
  });

  it('returns config when tsconfig.json exists', async () => {
    const mockConfig = { compilerOptions: { paths: {} } };
    fileExists.mockResolvedValueOnce(true);
    readJsonFile.mockResolvedValueOnce(mockConfig);

    const result = await autoloadTsc();

    expect(result).toStrictEqual(mockConfig);
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
    fileExists.mockResolvedValueOnce(true);
    readJsonFile.mockResolvedValueOnce(mockConfig);

    const result = await autoloadTsc('custom');

    expect(result).toStrictEqual(mockConfig);
    expect(fileExists).toHaveBeenCalledWith('tsconfig.json');
  });
});

describe('parseTsConfigToJitiConfig', () => {
  it('returns undefined when no paths exist', () => {
    const result = parseTsConfigToJitiConfig({});

    expect(result).toBeUndefined();
  });

  it('returns undefined when paths object is empty', () => {
    const result = parseTsConfigToJitiConfig({
      compilerOptions: { paths: {} },
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when compilerOptions is missing', () => {
    const result = parseTsConfigToJitiConfig({ someOtherProp: {} });

    expect(result).toBeUndefined();
  });

  it('converts paths to alias format', () => {
    const tsConfig = {
      compilerOptions: {
        paths: {
          '@/*': ['./src/*'],
          '@/components/*': ['./src/components/*'],
        },
      },
    };

    const result = parseTsConfigToJitiConfig(tsConfig);

    expect(result).toStrictEqual({
      alias: {
        '@': './src',
        '@/components': './src/components',
      },
    });
  });

  it('removes trailing /* from both keys and values', () => {
    const tsConfig = {
      compilerOptions: {
        paths: {
          '@app/*': ['src/app/*'],
          'utils/*': ['lib/utils/*'],
        },
      },
    };

    const result = parseTsConfigToJitiConfig(tsConfig);

    expect(result).toStrictEqual({
      alias: {
        '@app': 'src/app',
        utils: 'lib/utils',
      },
    });
  });

  it('handles paths with multiple mappings by using first one', () => {
    const tsConfig = {
      compilerOptions: {
        paths: {
          '@/*': ['./src/*', './lib/*'],
        },
      },
    };

    const result = parseTsConfigToJitiConfig(tsConfig);

    expect(result).toStrictEqual({
      alias: {
        '@': './src',
      },
    });
  });

  it('ignores invalid path mappings', () => {
    const tsConfig = {
      compilerOptions: {
        paths: {
          '@/*': ['./src/*'],
          'invalid/*': null as any,
          'empty/*': [],
        },
      },
    };

    const result = parseTsConfigToJitiConfig(tsConfig);

    expect(result).toStrictEqual({
      alias: {
        '@': './src',
      },
    });
  });
});
