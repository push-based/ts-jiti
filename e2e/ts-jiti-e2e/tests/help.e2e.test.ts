import { nxTargetProject } from '@push-based/test-nx-utils';
import { E2E_ENVIRONMENTS_DIR, removeColorCodes } from '@push-based/test-utils';
import { executeProcess } from '@push-based/jiti-tsc';
import path from 'node:path';

describe('CLI help', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());

  it('should print help with help command', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@push-based/jiti-tsc', 'help'],
      cwd: envRoot,
    });
    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toMatchSnapshot();
  });

  it('should produce the same output to stdout for both help argument and help command', async () => {
    const helpArgResult = await executeProcess({
      command: 'npx',
      args: ['@push-based/jiti-tsc', 'help'],
      cwd: envRoot,
    });
    const helpCommandResult = await executeProcess({
      command: 'npx',
      args: ['@push-based/jiti-tsc', '--help'],
      cwd: envRoot,
    });
    expect(helpArgResult.code).toBe(0);
    expect(helpCommandResult.code).toBe(0);
    expect(helpArgResult.stdout).toBe(helpCommandResult.stdout);
  });
});
