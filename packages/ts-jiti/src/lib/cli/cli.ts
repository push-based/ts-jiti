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

  const { tsconfig, output } = parseCliArgs(args);

  // - Parses ts-jitienv var process.env[TS_JITI_TS_CONFIG_PATH_ENV_VAR]
  const tsconfigPath = process.env[TS_JITI_TS_CONFIG_PATH_ENV_VAR] ?? tsconfig;

  if (isHelpCommand(args)) {
    helpCommand();
    return;
  }

  // Load tsconfig if provided and parse it for jiti options
  const jitiOptions = {} satisfies JitiOptions;
  if (tsconfigPath) {
    try {
      jitiOptions = jitiOptionsFromTsConfig(tsconfigPath);
    } catch (error) {
      // If tsconfig loading fails, continue without config
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

  await jitiCommand(jitiOptions);
}
