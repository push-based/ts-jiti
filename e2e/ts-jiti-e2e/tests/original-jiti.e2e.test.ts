import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  executeProcess,
  fsFromJson,
  removeColorCodes,
} from '@push-based/test-utils';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const testFileName = path.basename(__filename);

const toSlug = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z\d-]/g, '');

const utilsContent = `
export function to42(value?: unknown): number {
  return 42;
}
export default to42;
`;

const binBasicContent = `#!/usr/bin/env node
import { to42 } from './utils/string';

console.log('Example: cli');
console.log(\`Random number: \${to42()}\`);
`;

const binTsconfigAllContent = `#!/usr/bin/env node
import { to42 } from '@utils/string';

console.log('Example: cli');
console.log(\`Random number: \${to42()}\`);
`;

const binImportContent = `#!/usr/bin/env node
import { to42 } from '@utils/string';

console.log('Example: cli-load-import');
console.log(\`Random number: \${to42()}\`);
`;

describe('Original jiti cli', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const describeName = 'Original jiti cli';
  const describeSlug = toSlug(describeName);

  const getTestDir = (itName: string) =>
    path.join(
      envRoot,
      TEST_OUTPUT_DIR,
      testFileName,
      describeSlug,
      toSlug(itName),
    );

  it('should execute cli over original jiti default', async () => {
    const testFileDir = getTestDir(
      'should execute cli over original jiti default',
    );
    const cleanup = await fsFromJson({
      [path.join(testFileDir, 'tsconfig.json')]: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@utils/*': ['./src/utils/*'],
          },
        },
      },
      [path.join(testFileDir, 'src', 'utils', 'string.ts')]: utilsContent,
      [path.join(testFileDir, 'src', 'bin.jiti-tsc.basic.ts')]: binBasicContent,
    });

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.relative(
          envRoot,
          path.join(testFileDir, 'src', 'bin.jiti-tsc.basic.ts'),
        ),
      ],
      cwd: envRoot,
      silent: true,
    });

    expect(code).toBe(0);
    expect(removeColorCodes(stdout) + removeColorCodes(stderr)).toContain('42');

    await cleanup();
  });

  it('should FAIL original jiti with code depending on path alias', async () => {
    const testFileDir = getTestDir(
      'should FAIL original jiti with code depending on path alias',
    );
    const cleanup = await fsFromJson({
      [path.join(testFileDir, 'tsconfig.json')]: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@utils/*': ['./src/utils/*'],
          },
        },
      },
      [path.join(testFileDir, 'src', 'utils', 'string.ts')]: utilsContent,
      [path.join(testFileDir, 'src', 'bin.jiti-tsc.tsconfig-all.ts')]:
        binTsconfigAllContent,
    });

    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.relative(
          envRoot,
          path.join(testFileDir, 'src', 'bin.jiti-tsc.tsconfig-all.ts'),
        ),
      ],
      cwd: envRoot,
      ignoreExitCode: true,
    });

    expect(code).not.toBe(0);
    expect(removeColorCodes(stderr)).toContain(
      `Error: Cannot find module '@utils/string'`,
    );

    await cleanup();
  });

  it('should run original jiti with environment variables', async () => {
    const testFileDir = getTestDir(
      'should run original jiti with environment variables',
    );
    const cleanup = await fsFromJson({
      [path.join(testFileDir, 'tsconfig.json')]: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@utils/*': ['./src/utils/*'],
          },
        },
      },
      [path.join(testFileDir, 'src', 'utils', 'string.ts')]: utilsContent,
      [path.join(testFileDir, 'src', 'bin.jiti-tsc.import.ts')]:
        binImportContent,
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '-y',
        'jiti',
        path.relative(
          envRoot,
          path.join(testFileDir, 'src', 'bin.jiti-tsc.import.ts'),
        ),
      ],
      cwd: envRoot,
      ignoreExitCode: true,
      env: {
        JITI_ALIAS: JSON.stringify({
          '@utils': path.join(testFileDir, 'src', 'utils'),
        }),
      },
    });

    expect(code).not.toBe(0);
    // When original jiti fails with path aliases, it doesn't execute the bin file
    // so stdout should be empty
    expect(removeColorCodes(stdout)).toBe('');

    await cleanup();
  });
});
