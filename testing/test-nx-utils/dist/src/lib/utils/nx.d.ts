import type { ExecutorContext } from '@nx/devkit';
export declare function executorContext<T extends {
    projectName: string;
    cwd?: string;
}>(nameOrOpt: string | T): ExecutorContext;
/**
 * Sets up a test workspace by copying a mock fixture and restoring ignored files.
 * This is a simpler alternative to using Nx Tree for e2e tests.
 *
 * @param mockSourceDir - Full path to the mock fixture folder
 * @param targetDir - Directory where the mock should be copied to
 * @returns Promise that resolves when setup is complete
 *
 * @example
 * ```ts
 * const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
 * const testDir = path.join(TEST_OUTPUT_DIR, 'my-test');
 * await setupTestWorkspace(mockDir, testDir);
 * // Now testDir contains a copy of the nx-monorepo mock with files restored
 * ```
 */
export declare function setupTestWorkspace(mockSourceDir: string, targetDir: string): Promise<void>;
export declare function registerPluginInWorkspaceFile(workspaceRoot: string, configuration: string | {
    plugin: string;
    options?: Record<string, unknown>;
}): Promise<void>;
/**
 * Runs `nx show project <project> --json` and returns the parsed project configuration.
 * This is a helper for e2e tests to verify project configuration after plugin execution.
 *
 * @param workspaceRoot - Full path to the workspace root
 * @param projectName - Name of the project to show
 * @returns Object with code (exit code) and projectJson (parsed project configuration)
 *
 * @example
 * ```ts
 * const { code, projectJson } = await nxShowProjectJson(testDir, 'my-lib');
 * expect(projectJson['targets']).toBeDefined();
 * ```
 */
export declare function nxShowProjectJson(workspaceRoot: string, projectName: string): Promise<{
    code: number | null;
    projectJson: Record<string, unknown>;
    error?: {
        message: string;
        stderr?: string;
        stdout?: string;
    };
}>;
