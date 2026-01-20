import type { JitiOptions } from 'jiti';
import { formatCommandStatus } from '../utils/command.js';
import { executeProcess } from '../utils/execute-process.js';
import { logger } from '../utils/logger.js';
import { objectToCliArgs } from '../utils/transform.js';

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
  // Convert jiti options to environment variables that jiti recognizes
  const env = { ...process.env };

  if (jitiOptionsFromTsConfig.alias) {
    env['JITI_ALIAS'] = JSON.stringify(jitiOptionsFromTsConfig.alias);
  }

  if (jitiOptionsFromTsConfig.interopDefault !== undefined) {
    env['JITI_INTEROP_DEFAULT'] = jitiOptionsFromTsConfig.interopDefault
      ? '1'
      : '0';
  }

  if (jitiOptionsFromTsConfig.sourceMaps !== undefined) {
    env['JITI_SOURCE_MAPS'] = jitiOptionsFromTsConfig.sourceMaps ? '1' : '0';
  }

  if (jitiOptionsFromTsConfig.jsx !== undefined) {
    env['JITI_JSX'] = jitiOptionsFromTsConfig.jsx ? '1' : '0';
  }

  const commandString = `npx jiti ${argv.join(' ')}`;
  logger.debug(
    `Running jiti command \n${formatCommandStatus(commandString, {
      env: env as Record<string, string | number | boolean>,
      cwd: process.cwd(),
    })} \n`,
  );

  const { stderr } = await executeProcess({
    command: 'npx',
    args: ['jiti', ...argv],
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
