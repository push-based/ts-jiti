import type { JitiOptions } from 'jiti';
import { TS_JITI_TS_CONFIG_PATH_ENV_VAR } from '../jiti/constants.js';
import { jitiOptionsFromTsConfig } from '../jiti/jiti.js';
import { helpCommand, isHelpCommand } from './help.command.js';
import { jitiCommand } from './jiti.command.js';
import { parseCliArgs } from './parse-args.js';
import {
  isPrintConfigCommand,
  printConfigCommand,
} from './print-config.command.js';

export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);

  const { tsconfig, output, positionalArgs } = parseCliArgs(args);

  const tsconfigPath = process.env[TS_JITI_TS_CONFIG_PATH_ENV_VAR] ?? tsconfig;

  if (isHelpCommand(args)) {
    helpCommand();
    return;
  }

  // eslint-disable-next-line functional/no-let
  let jitiOptions = {} satisfies JitiOptions;
  if (tsconfigPath) {
    try {
      jitiOptions = await jitiOptionsFromTsConfig(tsconfigPath);
    } catch (error) {
      console.warn(`Failed to load tsconfig from ${tsconfigPath}:`, error);
    }
  }

  if (isPrintConfigCommand(args)) {
    await printConfigCommand(jitiOptions ?? {}, {
      tsconfigPath,
      output,
    });
    return;
  }

  await jitiCommand(jitiOptions, positionalArgs);
}
