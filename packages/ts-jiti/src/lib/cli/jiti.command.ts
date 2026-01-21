import type { JitiOptions } from 'jiti';
import { formatCommandStatus } from '../utils/command.js';
import { executeProcess } from '../utils/execute-process.js';
import { logger } from '../utils/logger.js';

/**
 * Converts jiti options to environment variables for the jiti CLI
 * @param options Jiti options to convert
 * @returns Environment variables object
 */
function jitiOptionsToEnv(options: JitiOptions): Record<string, string> {
  const env: Record<string, string> = {};
  
  if (options.alias) {
    env['JITI_ALIAS'] = JSON.stringify(options.alias);
  }
  
  if (options.interopDefault !== undefined) {
    env['JITI_INTEROP_DEFAULT'] = options.interopDefault ? '1' : '0';
  }
  
  if (options.sourceMaps !== undefined) {
    env['JITI_SOURCE_MAPS'] = options.sourceMaps ? '1' : '0';
  }
  
  if (options.jsx !== undefined) {
    env['JITI_JSX'] = options.jsx ? '1' : '0';
  }
  
  return env;
}

function filterJitiEnvVars(env: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith('JITI_'))
      .map(([key, value]) => [key.replace('JITI_', ''), value]),
  ) as Record<string, string>;
}

/**
 * Filters out tsconfig-related arguments from argv
 * tsconfig should only be set via environment variable, not passed as argument to jiti
 */
function filterTsConfigArgs(argv: string[]): string[] {
  return argv.filter(
    arg => !arg.startsWith('--tsconfig') && !arg.startsWith('-tsconfig'),
  );
}

/**
 * Small wrapper to run jiti command line with options derived from tsconfig.
 * - Forwards process env to the jiti command
 * - Runs the jiti command with the parsed tsconfig path
 * - mirrirs the original API exactly
 * @param opts
 */
export async function jitiCommand(
  jitiOptionsFromTsConfig: JitiOptions,
  argv = process.argv.slice(2),
): Promise<void> {
  // Filter out tsconfig arguments - tsconfig should only come from env vars
  const filteredArgs = filterTsConfigArgs(argv);
  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => value !== undefined),
    ) as Record<string, string>,
    ...jitiOptionsToEnv(jitiOptionsFromTsConfig),
  };

  const commandString = `npx jiti ${filteredArgs.join(' ')}`;
  logger.debug(
    `Running jiti command \n${formatCommandStatus(commandString, {
      env: filterJitiEnvVars(env) as Record<string, string | number | boolean>,
      cwd: process.cwd(),
    })} \n`,
  );

  const { stderr } = await executeProcess({
    command: 'npx',
    args: ['jiti', ...filteredArgs],
    env,
    observer: {
      onStdout: stdout => {
        logger.info(stdout);
      },
      onStderr: error => {
        logger.error(error);
      },
    },
  });

  if (stderr) {
    logger.error(stderr);
    throw new Error(stderr);
  }
}
