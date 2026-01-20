import { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { type ProcessObserver, executeProcess } from './execute-process.js';

// Mock utility for testing async process execution
function getAsyncProcessRunnerConfig(
  options: {
    interval?: number;
    runs?: number;
    throwError?: boolean;
  } = {},
) {
  const { interval = 100, runs = 1, throwError = false } = options;

  return {
    command: 'node',
    args: [
      path.join(
        'testing',
        'test-utils',
        'src',
        'lib',
        'utils',
        'execute-process.mock.mjs',
      ),
      interval.toString(),
      runs.toString(),
      throwError ? '1' : '0',
    ],
  };
}

describe('executeProcess', () => {
  const spyObserver: ProcessObserver = {
    onStdout: vi.fn(),
    onStderr: vi.fn(),
    onError: vi.fn(),
    onComplete: vi.fn(),
  };
  const errorSpy = vi.fn();

  it('should work with node command `node -v`', async () => {
    const processResult = await executeProcess({
      command: 'node',
      args: ['-v'],
      observer: spyObserver,
    });

    // Note: called once or twice depending on environment (2nd time for a new line)
    expect(spyObserver.onStdout).toHaveBeenCalled();
    expect(spyObserver.onComplete).toHaveBeenCalledOnce();
    expect(spyObserver.onError).not.toHaveBeenCalled();
    expect(processResult.stdout).toMatch(/v\d{1,2}(\.\d{1,2}){0,2}/);
  });

  it('should work with npx command `npx --help`', async () => {
    const processResult = await executeProcess({
      command: 'npx',
      args: ['--help'],
      observer: spyObserver,
    });
    expect(spyObserver.onStdout).toHaveBeenCalledOnce();
    expect(spyObserver.onComplete).toHaveBeenCalledOnce();
    expect(spyObserver.onError).not.toHaveBeenCalled();
    expect(processResult.stdout).toContain('npm exec');
  });

  it('should work with script `node custom-script.js`', async () => {
    const processResult = await executeProcess({
      ...getAsyncProcessRunnerConfig({ interval: 10, runs: 4 }),
      observer: spyObserver,
    }).catch(errorSpy);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(processResult.stdout).toContain('process:complete');
    expect(spyObserver.onStdout).toHaveBeenCalledTimes(6); // intro + 4 runs + complete
    expect(spyObserver.onError).not.toHaveBeenCalled();
    expect(spyObserver.onComplete).toHaveBeenCalledOnce();
  });

  it('should work with async script `node custom-script.js` that throws an error', async () => {
    const processResult = await executeProcess({
      ...getAsyncProcessRunnerConfig({
        interval: 10,
        runs: 1,
        throwError: true,
      }),
      observer: spyObserver,
    }).catch(errorSpy);

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(processResult).toBeUndefined();
    expect(spyObserver.onStdout).toHaveBeenCalledTimes(2); // intro + 1 run before error
    expect(spyObserver.onStdout).toHaveBeenLastCalledWith(
      'process:update\n',
      expect.any(ChildProcess),
    );
    expect(spyObserver.onStderr).toHaveBeenCalled();
    expect(spyObserver.onStderr).toHaveBeenCalledWith(
      expect.stringContaining('dummy-error'),
      expect.any(ChildProcess),
    );
    expect(spyObserver.onError).toHaveBeenCalledOnce();
    expect(spyObserver.onComplete).not.toHaveBeenCalled();
  });

  it('should successfully exit process after an error is thrown when ignoreExitCode is set', async () => {
    const processResult = await executeProcess({
      ...getAsyncProcessRunnerConfig({
        interval: 10,
        runs: 1,
        throwError: true,
      }),
      observer: spyObserver,
      ignoreExitCode: true,
    }).catch(errorSpy);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(processResult.code).toBe(1);
    expect(processResult.stdout).toContain('process:update');
    expect(processResult.stderr).toContain('dummy-error');
    expect(spyObserver.onStdout).toHaveBeenCalledTimes(2); // intro + 1 run before error
    expect(spyObserver.onStderr).toHaveBeenCalled();
    expect(spyObserver.onError).not.toHaveBeenCalled();
    expect(spyObserver.onComplete).toHaveBeenCalledOnce();
  });

  it('should execute simple commands successfully', async () => {
    const result = await executeProcess({ command: 'echo', args: ['hello'] });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('hello');
  });

  it('should handle process errors', async () => {
    await expect(
      executeProcess(
        getAsyncProcessRunnerConfig({
          interval: 10,
          runs: 1,
          throwError: true,
        }),
      ),
    ).rejects.toThrow('Process failed with exit code 1');
  });

  it('should respect silent flag', async () => {
    const result = await executeProcess({
      ...getAsyncProcessRunnerConfig({ runs: 1 }),
      silent: true,
    });
    expect(result.code).toBe(0);
  });
});
