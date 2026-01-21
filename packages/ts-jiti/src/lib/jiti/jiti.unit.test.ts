import type { Jiti } from 'jiti';
import { osAgnosticPath } from '@push-based/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { fileExists } from '../utils/file-system.js';
import { createTsJiti, importModule, jitiOptionsFromTsConfig } from './jiti.js';
import { parseTsConfigToJitiConfig } from './jiti.schema.js';
import { readTscByPath } from './read-ts-config-file.js';

vi.mock('jiti', () => ({
  createJiti: vi.fn(),
}));

vi.mock('./read-ts-config-file.js', () => ({
  readTscByPath: vi.fn(),
}));

vi.mock('./jiti.schema.js', () => ({
  parseTsConfigToJitiConfig: vi.fn(),
}));

vi.mock('../utils/file-system.js', () => ({
  fileExists: vi.fn(),
}));

describe('createTsJiti', () => {
  it('creates jiti instance with tsconfig options when tsconfig provided', async () => {
    vi.clearAllMocks();
    const { createJiti } = await import('jiti');
    const mockJitiInstance = {
      options: {},
      import: vi.fn(),
      esmResolve: vi.fn(),
      transform: vi.fn(),
      evalModule: vi.fn(),
      cache: {},
      resolve: Object.assign(vi.fn(), { paths: vi.fn() }),
      extensions: { '.js': vi.fn(), '.json': vi.fn(), '.node': vi.fn() },
      main: undefined,
    } as unknown as Jiti;
    vi.mocked(createJiti).mockReturnValue(mockJitiInstance);
    vi.mocked(readTscByPath).mockResolvedValue({
      paths: { '@/*': ['./src/*'] },
    });
    vi.mocked(parseTsConfigToJitiConfig).mockReturnValue({
      alias: { '@': '/path/to/src' },
    });

    const result = await createTsJiti('/test/file.js', {
      tsconfigPath: '/test/tsconfig.json',
      sourceMaps: false,
    });

    expect(readTscByPath).toHaveBeenCalledWith('/test/tsconfig.json');
    expect(parseTsConfigToJitiConfig).toHaveBeenCalledWith({
      paths: { '@/*': ['./src/*'] },
    }, '/test');
    expect(createJiti).toHaveBeenCalledWith('/test/file.js', {
      sourceMaps: false,
      alias: { '@': '/path/to/src' },
    });
    expect(result).toBe(mockJitiInstance);
  });

  it('creates jiti instance with default options when no tsconfig', async () => {
    vi.clearAllMocks();
    const { createJiti } = await import('jiti');
    const mockJitiInstance = {
      options: {},
      import: vi.fn(),
      esmResolve: vi.fn(),
      transform: vi.fn(),
      evalModule: vi.fn(),
      cache: {},
      resolve: Object.assign(vi.fn(), { paths: vi.fn() }),
      extensions: { '.js': vi.fn(), '.json': vi.fn(), '.node': vi.fn() },
      main: undefined,
    } as unknown as Jiti;
    vi.mocked(createJiti).mockReturnValue(mockJitiInstance);

    const result = await createTsJiti('/test/file.js', {
      tsconfigPath: '',
      sourceMaps: false,
    });

    expect(readTscByPath).not.toHaveBeenCalled();
    expect(parseTsConfigToJitiConfig).not.toHaveBeenCalled();
    expect(createJiti).toHaveBeenCalledWith('/test/file.js', {
      sourceMaps: false,
    });
    expect(result).toBe(mockJitiInstance);
  });
});

describe('jitiOptionsFromTsConfig', () => {
  it('parses tsconfig to jiti options', async () => {
    vi.clearAllMocks();
    const mockCompilerOptions = { paths: { '@/*': ['./src/*'] } };
    const mockJitiOptions = { alias: { '@': '/path/to/src' } };

    vi.mocked(readTscByPath).mockResolvedValue(mockCompilerOptions);
    vi.mocked(parseTsConfigToJitiConfig).mockReturnValue(mockJitiOptions);

    const result = await jitiOptionsFromTsConfig('/test/tsconfig.json');

    expect(readTscByPath).toHaveBeenCalledWith('/test/tsconfig.json');
    expect(parseTsConfigToJitiConfig).toHaveBeenCalledWith(mockCompilerOptions, '/test');
    expect(result).toBe(mockJitiOptions);
  });
});

describe('importModule', () => {
  it('imports module when file exists', async () => {
    vi.clearAllMocks();
    const { createJiti } = await import('jiti');
    const mockJitiInstance = {
      options: {},
      import: vi.fn().mockResolvedValue('imported-module'),
      esmResolve: vi.fn(),
      transform: vi.fn(),
      evalModule: vi.fn(),
      cache: {},
      resolve: Object.assign(vi.fn(), { paths: vi.fn() }),
      extensions: { '.js': vi.fn(), '.json': vi.fn(), '.node': vi.fn() },
      main: undefined,
    } as unknown as Jiti;
    vi.mocked(createJiti).mockReturnValue(mockJitiInstance);
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(readTscByPath).mockResolvedValue({});
    vi.mocked(parseTsConfigToJitiConfig).mockReturnValue({});

    const result = await importModule({
      filepath: '/test/module.js',
      tsconfig: '/test/tsconfig.json',
      sourceMaps: false,
    });

    expect(fileExists).toHaveBeenCalledWith('/test/module.js');
    expect(createJiti).toHaveBeenCalledWith('/test/module.js', {
      sourceMaps: false,
    });
    expect(mockJitiInstance.import).toHaveBeenCalledWith('/test/module.js', {
      default: true,
    });
    expect(result).toBe('imported-module');
  });

  it('imports module with default tsconfig when tsconfig undefined', async () => {
    vi.clearAllMocks();
    const { createJiti } = await import('jiti');
    const mockJitiInstance = {
      options: {},
      import: vi.fn().mockResolvedValue('imported-module'),
      esmResolve: vi.fn(),
      transform: vi.fn(),
      evalModule: vi.fn(),
      cache: {},
      resolve: Object.assign(vi.fn(), { paths: vi.fn() }),
      extensions: { '.js': vi.fn(), '.json': vi.fn(), '.node': vi.fn() },
      main: undefined,
    } as unknown as Jiti;
    vi.mocked(createJiti).mockReturnValue(mockJitiInstance);
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(readTscByPath).mockResolvedValue({});
    vi.mocked(parseTsConfigToJitiConfig).mockReturnValue({});

    const result = await importModule({
      filepath: '/test/module.js',
      sourceMaps: false,
    });

    expect(fileExists).toHaveBeenCalledWith('/test/module.js');
    expect(createJiti).toHaveBeenCalledWith('/test/module.js', {
      sourceMaps: false,
    });
    expect(mockJitiInstance.import).toHaveBeenCalledWith('/test/module.js', {
      default: true,
    });
    expect(result).toBe('imported-module');
  });

  it('throws error when file does not exist', async () => {
    vi.clearAllMocks();
    vi.mocked(fileExists).mockResolvedValue(false);

    await expect(
      importModule({
        filepath: '/test/nonexistent.js',
      }),
    ).rejects.toThrow(`File '${osAgnosticPath('/test/nonexistent.js')}' does not exist`);

    expect(fileExists).toHaveBeenCalledWith('/test/nonexistent.js');
  });
});
