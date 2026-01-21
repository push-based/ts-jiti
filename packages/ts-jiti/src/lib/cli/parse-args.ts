import { parseArgs } from 'node:util';
import { z } from 'zod';
import { stringifyError } from '../utils/errors.js';

export const commandSchema = z.enum(['print-config', 'help']).meta({
  describe: "The command to run (defaults to 'jiti')",
});

export const cliArgsSchema = z
  .object({
    // cli options options
    command: commandSchema.optional(),
    tsconfig: z.string().optional().meta({
      describe:
        'Path to a TypaScript configuration file used to resolve config files',
    }),
    // output only used for the print-config command
    output: z.string().optional().meta({
      describe:
        'Output path for print-config command (if not provided, prints to stdout)',
    }),
    // positional args for jiti command
    positionalArgs: z.array(z.string()).optional().meta({
      describe: 'Additional positional arguments passed to the jiti command',
    }),
  })
  .meta({
    describe:
      'Zod schema for CLI arguments validation. Validates and transforms command line arguments for the ts-jiti tool. Supports both positional and named arguments with sensible defaults.',
  });

export type CliArgs = z.infer<typeof cliArgsSchema>;

export function parseCliArgs(argv = process.argv.slice(2)): CliArgs {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      // named options
      tsconfig: { type: 'string' },
      output: { type: 'string' },

      help: { type: 'boolean', short: 'h' },
    },
  });

  const parsedPositionals = parsePositionals(positionals, values.help === true);

  try {
    return cliArgsSchema.parse({
      ...values,
      ...parsedPositionals,
    });
  } catch (error) {
    throw new Error(`Error parsing CLI arguments: ${stringifyError(error)}`);
  }
}

export function parsePositionals(positionals: string[], isHelp: boolean) {
  try {
    // Only check for explicit commands (print-config, help)
    // Everything else defaults to jiti command
    const firstArg = positionals.at(0);
    const isExplicitCommand = isHelp || commandSchema.safeParse(firstArg).success;
    
    if (isExplicitCommand) {
      const [command, ...rest] = positionals;
      return {
        command,
        // For explicit commands, rest args are passed as positionalArgs
        ...(rest.length > 0 ? { positionalArgs: rest } : {}),
      };
    }
    
    // Default to jiti command, all positionals are arguments to jiti
    return {
      // command is optional for jiti (default)
      ...(positionals.length > 0 ? { positionalArgs: positionals } : {}),
    };
  } catch (error) {
    throw new Error(
      `Error parsing positional arguments: ${stringifyError(error)}`,
    );
  }
}
