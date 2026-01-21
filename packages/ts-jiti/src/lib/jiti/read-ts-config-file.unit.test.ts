import { osAgnosticPath, removeColorCodes } from '@push-based/test-utils';
import { describe, expect, vi } from 'vitest';
import {
  autoloadTsc,
  loadTargetConfig,
  deriveTsConfig,
} from './read-ts-config-file.js';

vi.mock('../utils/file-system.js', async importOriginal => {
  const original = await importOriginal();
  return {
    ...(original as object),
    fileExists: vi.fn(),
  };
});

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
    task: vi.fn(async (_, worker) => {
      const value = await worker();
      return typeof value === 'object' ? value.result : undefined;
    }),
    command: vi.fn((_, worker) => worker()),
  },
}));

vi.mock('node:process', async () => {
  const actual = await vi.importActual('node:process');
  return {
    ...actual,
    cwd: vi.fn(() => '/test'),
  };
});

vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  return {
    ...actual,
    resolve: vi.fn((...args) => args.at(-1)), // Return the last argument
    dirname: vi.fn(() => '/mock/dir'),
    join: vi.fn((...args) => args.join('/')),
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
      `Error reading TypeScript config file at ${osAgnosticPath('missing.json')}:\nFile not found`,
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

describe('deriveTsConfig', () => {
  let fileExists: any;
  let readConfigFile: any;
  let parseJsonConfigFileContent: any;

  beforeAll(async () => {
    const fsUtilsModule = await import('../utils/file-system.js');
    fileExists = vi.spyOn(fsUtilsModule, 'fileExists');

    const tsModule = await import('typescript');
    readConfigFile = tsModule.readConfigFile;
    parseJsonConfigFileContent = tsModule.parseJsonConfigFileContent;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when tsconfig file does not exist', async () => {
    fileExists.mockResolvedValueOnce(false);

    await expect(deriveTsConfig('missing.json')).rejects.toThrow(
      `Tsconfig file not found at path: ${osAgnosticPath('missing.json')}`,
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

    const result = await deriveTsConfig('tsconfig.json');
    expect(result).toEqual({ esModuleInterop: true });
  });

  it('call loadTargetConfig to parse config file', async () => {
    fileExists.mockResolvedValueOnce(true);
    readConfigFile.mockReturnValueOnce({
      config: { compilerOptions: { paths: { '@/*': ['./src/*'] } } },
      error: undefined,
    });
    parseJsonConfigFileContent.mockReturnValueOnce({
      options: { paths: { '@/*': ['./src/*'] } },
      fileNames: ['src/index.ts'],
    });

    await expect(
      deriveTsConfig('/path/to/tsconfig.json'),
    ).resolves.not.toThrow();
  });
});
