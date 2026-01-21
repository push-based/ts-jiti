import type { Jiti } from 'jiti';
import { describe, expect, it, vi } from 'vitest';
import { fileExists } from '../utils/file-system.js';
import { createTsJiti, importModule, jitiOptionsFromTsConfig } from './jiti.js';
import { parseTsConfigToJitiConfig } from './jiti.schema.js';
import { deriveTsConfig } from './read-ts-config-file.js';

vi.mock('jiti', () => ({
  createJiti: vi.fn(),
}));

vi.mock('./read-ts-config-file.js', () => ({
  deriveTsConfig: vi.fn(),
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
    vi.mocked(deriveTsConfig).mockResolvedValue({
      paths: { '@/*': ['./src/*'] },
    });
    vi.mocked(parseTsConfigToJitiConfig).mockReturnValue({
      alias: { '@': '/path/to/src' },
    });

    const result = await createTsJiti('/test/file.js', {
      tsconfigPath: '/test/tsconfig.json',
      sourceMaps: false,
    });

    expect(deriveTsConfig).toHaveBeenCalledWith('/test/tsconfig.json');
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

    expect(deriveTsConfig).not.toHaveBeenCalled();
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

    vi.mocked(deriveTsConfig).mockResolvedValue(mockCompilerOptions);
    vi.mocked(parseTsConfigToJitiConfig).mockReturnValue(mockJitiOptions);

    const result = await jitiOptionsFromTsConfig('/test/tsconfig.json');

    expect(deriveTsConfig).toHaveBeenCalledWith('/test/tsconfig.json');
    expect(parseTsConfigToJitiConfig).toHaveBeenCalledWith(mockCompilerOptions, '/test');
    expect(result).toBe(mockJitiOptions);
  });

  it('throws error when tsconfig has path overloads (multiple mappings)', async () => {
    vi.clearAllMocks();
    const mockCompilerOptions = {
      paths: {
        // Multiple mappings - overloads not supported
        '@/*': ['./src/*', './lib/*'], 
      },
      baseUrl: '/test',
    };

    vi.mocked(deriveTsConfig).mockResolvedValue(mockCompilerOptions);
    const actualModule = await vi.importActual<typeof import('./jiti.schema.js')>('./jiti.schema.js');
    vi.mocked(parseTsConfigToJitiConfig).mockImplementation(actualModule.parseTsConfigToJitiConfig);

    await expect(
      jitiOptionsFromTsConfig('/test/tsconfig.json'),
    ).rejects.toThrow(
      "TypeScript path overloads are not supported by jiti. Path pattern '@/*' has 2 mappings: ./src/*, ./lib/*. Jiti only supports a single alias mapping per pattern.",
    );

    expect(deriveTsConfig).toHaveBeenCalledWith('/test/tsconfig.json');
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
    vi.mocked(deriveTsConfig).mockResolvedValue({});
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
    vi.mocked(deriveTsConfig).mockResolvedValue({});
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
    ).rejects.toThrow(`File '/test/nonexistent.js' does not exist`);

    expect(fileExists).toHaveBeenCalledWith('/test/nonexistent.js');
  });
});
