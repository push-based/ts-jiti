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
  const { output, positionalArgs } = parseCliArgs(args);
  const tsconfigPath = process.env[TS_JITI_TS_CONFIG_PATH_ENV_VAR] ?? './tsconfig.json';

  if (isHelpCommand(args)) {
    helpCommand();
    return;
  }

  const jitiOptions: JitiOptions = tsconfigPath ?await jitiOptionsFromTsConfig(tsconfigPath) : {};

  if (isPrintConfigCommand(args)) {
    await printConfigCommand(jitiOptions, {
      tsconfigPath,
      output,
    });
    return;
  }

  await jitiCommand(jitiOptions, positionalArgs);
}
