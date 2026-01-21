import { logger } from '../utils/logger.js';

export const HELP_PROMPT = `
Usage: jiti-tsc [command] [options]

Commands:
  jiti                         Run jiti with tsconfig-derived options (default command)
  print-config                 Print resolved jiti configuration from tsconfig
  help                         Print help

Options:
  --output <path>              Output path for print-config command (prints to stdout if not provided)
  -h, --help                   Display help information

Environment Variables:
  JITI_TS_CONFIG_PATH          Path to TypeScript configuration file

Examples:
  # Run jiti with tsconfig options
  jiti-tsc jiti ./path/to/module.ts

  # Run jiti with custom tsconfig
  JITI_TS_CONFIG_PATH=./tsconfig.json jiti-tsc jiti ./path/to/module.ts

  # Print resolved jiti configuration
  JITI_TS_CONFIG_PATH=./tsconfig.json jiti-tsc print-config

  # Print configuration to file
  JITI_TS_CONFIG_PATH=./tsconfig.json jiti-tsc print-config --output=./jiti-config.json
    `;

export function isHelpCommand(args: string[]): boolean {
  return (
    args.length === 0 ||
    args.includes('--help') ||
    args.includes('-h') ||
    args[0] === 'help'
  );
}

export function helpCommand() {
  logger.info(HELP_PROMPT);
}
