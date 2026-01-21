import { logger } from '../utils/logger.js';

export const HELP_PROMPT = `
Usage: ts-jiti [command] [options]

Commands:
  jiti                         Run jiti with tsconfig-derived options (default command)
  print-config                 Print resolved jiti configuration from tsconfig
  help                         Print help

Options:
  --tsconfig <path>            Path to TypeScript configuration file
  --output <path>              Output path for print-config command (prints to stdout if not provided)
  -h, --help                   Display help information

Environment Variables:
  JITI_TS_CONFIG_PATH          Path to TypeScript configuration file (alternative to --tsconfig)

Examples:
  # Run jiti with tsconfig options
  ts-jiti jiti ./path/to/module.ts

  # Run jiti with custom tsconfig
  ts-jiti jiti --tsconfig=./tsconfig.json ./path/to/module.ts

  # Print resolved jiti configuration
  ts-jiti print-config --tsconfig=./tsconfig.json

  # Print configuration to file
  ts-jiti print-config --tsconfig=./tsconfig.json --output=./jiti-config.json
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
