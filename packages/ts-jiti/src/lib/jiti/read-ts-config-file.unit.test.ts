import { describe, expect, vi } from 'vitest';
import {
  autoloadTsc,
  loadTargetConfig,
  readTscByPath,
} from './read-ts-config-file.js';

// Mock fileExists
vi.mock('../utils/file-system.js', async importOriginal => {
  const original = await importOriginal();
  return {
    ...(original as object),
    fileExists: vi.fn(),
  };
});

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock TypeScript functions
vi.mock('typescript', async () => {
  const actual = await vi.importActual('typescript');
  return {
    ...actual,
    readConfigFile: vi.fn(),
    parseJsonConfigFileContent: vi.fn(),
    sys: {
      readFile: vi.fn(),
    },
  };
});

// Mock path functions
vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    resolve: vi.fn((...args) => args.at(-1)), // Return the last argument
    dirname: vi.fn(() => '/mock/dir'),
    join: vi.fn((...args) => args.join('/')),
  };
});

// Mock process.cwd
vi.mock('node:process', async () => {
  const actual = await vi.importActual('node:process');
  return {
    ...actual,
    cwd: vi.fn(() => '/test'),
  };
});

describe('loadTargetConfig', () => {
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

  it('throws error when reading config fails', () => {
    readConfigFile.mockReturnValueOnce({
      config: {},
      error: { messageText: 'File not found' },
    });

    expect(() => loadTargetConfig('missing.json')).toThrow(
      'Error reading TypeScript config file at missing.json:\nFile not found',
    );
    expect(readConfigFile).toHaveBeenCalledWith(
      '/test/missing.json',
      expect.any(Function),
    );
  });

  it('throws error when no files match configuration', () => {
    readConfigFile.mockReturnValueOnce({ config: {}, error: undefined });
    parseJsonConfigFileContent.mockReturnValueOnce({
      fileNames: [],
    });

    expect(() => loadTargetConfig('empty.json')).toThrow(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  });

  it('returns parsed config when valid', () => {
    const mockConfig = { compilerOptions: { strict: true } };
    readConfigFile.mockReturnValueOnce({
      config: mockConfig,
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      fileNames: ['src/index.ts'],
      options: { strict: true },
    });

    const result = loadTargetConfig('tsconfig.json');
    expect(result).toEqual({
      fileNames: ['src/index.ts'],
      options: { strict: true },
    });
  });
});

describe('readTscByPath', () => {
  let fileExists: any;
  let readConfigFile: any;
  let parseJsonConfigFileContent: any;

  beforeAll(async () => {
    const fsModule = await import('../utils/file-system.js');
    fileExists = fsModule.fileExists;

    const tsModule = await import('typescript');
    readConfigFile = tsModule.readConfigFile;
    parseJsonConfigFileContent = tsModule.parseJsonConfigFileContent;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when tsconfig file does not exist', async () => {
    fileExists.mockResolvedValueOnce(false);

    await expect(readTscByPath('missing.json')).rejects.toThrow(
      'Tsconfig file not found at path: missing.json',
    );
    expect(fileExists).toHaveBeenCalledWith('missing.json');
  });

  it('returns compiler options when file exists', async () => {
    fileExists.mockResolvedValueOnce(true);
    readConfigFile.mockReturnValueOnce({
      config: { compilerOptions: { esModuleInterop: true } },
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      options: { esModuleInterop: true },
      fileNames: ['src/index.ts'],
    });

    const result = await readTscByPath('tsconfig.json');
    expect(result).toEqual({ esModuleInterop: true });
  });
});

describe('autoloadTsc', () => {
  let fileExists: any;
  let logger: any;
  let readConfigFile: any;
  let parseJsonConfigFileContent: any;

  beforeAll(async () => {
    const fsModule = await import('../utils/file-system.js');
    fileExists = fsModule.fileExists;

    const loggerModule = await import('../utils/logger.js');
    logger = loggerModule.logger;

    const tsModule = await import('typescript');
    readConfigFile = tsModule.readConfigFile;
    parseJsonConfigFileContent = tsModule.parseJsonConfigFileContent;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty object when no config file exists', async () => {
    fileExists.mockResolvedValueOnce(false);

    const result = await autoloadTsc();
    expect(result).toEqual({});
    expect(fileExists).toHaveBeenCalledWith('tsconfig.json');
  });

  it('logs debug message when looking for config file', async () => {
    fileExists.mockResolvedValueOnce(false);

    await autoloadTsc();
    expect(logger.debug).toHaveBeenCalledWith(
      'Looking for default config file tsconfig.json',
    );
  });

  it('logs warning when config file not found', async () => {
    fileExists.mockResolvedValueOnce(false);

    await autoloadTsc();
    expect(logger.warn).toHaveBeenCalledWith(
      'No tsconfig.json file present in /test',
    );
  });

  it('loads config when tsconfig.json exists', async () => {
    fileExists.mockResolvedValueOnce(true); // First call for autoloadTsc check
    fileExists.mockResolvedValueOnce(true); // Second call for readTscByPath check
    readConfigFile.mockReturnValueOnce({
      config: { compilerOptions: { paths: {} } },
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      options: { paths: {} },
      fileNames: ['src/index.ts'],
    });

    const result = await autoloadTsc();
    expect(result).toEqual({ paths: {} });
    expect(fileExists).toHaveBeenCalledWith('tsconfig.json');
    expect(fileExists).toHaveBeenCalledWith('/test/tsconfig.json');
  });

  it('loads config with custom basename', async () => {
    fileExists.mockResolvedValueOnce(true); // First call for autoloadTsc check
    fileExists.mockResolvedValueOnce(true); // Second call for readTscByPath check
    readConfigFile.mockReturnValueOnce({
      config: { compilerOptions: { jsx: 2 } },
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      options: { jsx: 2 },
      fileNames: ['src/index.ts'],
    });

    const result = await autoloadTsc('custom');
    expect(result).toEqual({ jsx: 2 });
    expect(fileExists).toHaveBeenCalledWith('tsconfig.custom.json');
    expect(fileExists).toHaveBeenCalledWith('/test/tsconfig.custom.json');
  });

  it('loads config with multiple basenames', async () => {
    fileExists.mockResolvedValueOnce(true); // First call for autoloadTsc check
    fileExists.mockResolvedValueOnce(true); // Second call for readTscByPath check
    readConfigFile.mockReturnValueOnce({
      config: { compilerOptions: { lib: ['ES2020'] } },
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      options: { lib: ['ES2020'] },
      fileNames: ['src/index.ts'],
    });

    const result = await autoloadTsc(['lib', 'test']);
    expect(result).toEqual({ lib: ['ES2020'] });
    expect(fileExists).toHaveBeenCalledWith('tsconfig.lib.test.json');
    expect(fileExists).toHaveBeenCalledWith('/test/tsconfig.lib.test.json');
  });

  it('logs debug message when config file is found', async () => {
    fileExists.mockResolvedValueOnce(true); // First call for autoloadTsc check
    fileExists.mockResolvedValueOnce(true); // Second call for readTscByPath check
    readConfigFile.mockReturnValueOnce({
      config: { compilerOptions: { paths: {} } },
      error: undefined
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      options: { paths: {} },
      fileNames: ['src/index.ts']
    });

    await autoloadTsc();
    expect(logger.debug).toHaveBeenCalledWith('Found default ts config file tsconfig.json');
  });
});
