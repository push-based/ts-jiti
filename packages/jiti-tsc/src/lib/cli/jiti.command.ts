import type { JitiOptions } from 'jiti';
import { JITI_TSCONFIG_PATH_ENV_VAR, JITI_VERBOSE_ENV_VAR } from '../jiti/constants.js';
import { jitiOptionsFromTsConfig } from '../jiti/jiti.js';
import { filterJitiEnvVars, jitiOptionsToEnv } from '../jiti/jiti.schema.js';
import { formatCommandStatus } from '../utils/command.js';
import { executeProcess } from '../utils/execute-process.js';


/**
 * Small wrapper to run jiti command line with options derived from tsconfig.
 * - Forwards process env to the jiti command
 * - Runs the jiti command with the parsed tsconfig path
 * - mirrirs the original API exactly
 * @param opts
 */
export async function jitiCommand(argv: string[]): Promise<void> {
  const tsconfigPath =
    process.env[JITI_TSCONFIG_PATH_ENV_VAR] ?? './tsconfig.json';

  const jitiOptions: JitiOptions = tsconfigPath
    ? await jitiOptionsFromTsConfig(tsconfigPath)
    : {};

  const env: Record<string, string> = {
    ...(Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => value !== undefined),
    ) as Record<string, string>),
    ...jitiOptionsToEnv(jitiOptions),
  };

  const commandString = `npx jiti ${argv.join(' ')}`;

  if (process.env[JITI_VERBOSE_ENV_VAR]) {
    console.info(
      `Running jiti command \n${formatCommandStatus(commandString, {
        env: filterJitiEnvVars(env) as Record<
          string,
          string | number | boolean
        >,
        cwd: process.cwd(),
      })} \n`,
    );
  }

  const { stderr } = await executeProcess({
    command: 'npx',
    args: ['jiti', ...argv],
    env,
    observer: {
      onStdout: stdout => {
        // eslint-disable-next-line no-console
        console.log(stdout);
      },
      onStderr: error => {
        console.error(error);
      },
    },
  });

  if (stderr) {
    console.error(stderr);
    throw new Error(stderr);
  }
}
