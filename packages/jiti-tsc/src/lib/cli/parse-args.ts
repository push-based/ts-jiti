import { parseArgs } from 'node:util';
import { z } from 'zod';
import { stringifyError } from '../utils/errors.js';

export const commandSchema = z.enum(['print-config', 'help']).meta({
  describe: "The command to run (defaults to 'jiti')",
});

export const cliArgsSchema = z
  .object({
    command: commandSchema.optional(),
    output: z.string().optional().meta({
      describe:
        'Output path for print-config command (if not provided, prints to stdout)',
    }),
    positionalArgs: z.array(z.string()).optional().meta({
      describe: 'Additional positional arguments passed to the jiti command',
    }),
  })
  .meta({
    describe:
      'Zod schema for CLI arguments validation. Validates and transforms command line arguments for the jiti-tsc tool. Supports both positional and named arguments with sensible defaults.',
  });

export type CliArgs = z.infer<typeof cliArgsSchema>;

export function parseCliArgs(argv = process.argv.slice(2)): CliArgs {
  const firstArg = argv[0];
  const isExplicitCommand = commandSchema.safeParse(firstArg).success;

  // eslint-disable-next-line functional/no-let
  let values: Record<string, string | boolean>;
  // eslint-disable-next-line functional/no-let
  let positionals: string[];

  if (isExplicitCommand) {
    const result = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: false,
      options: {
        output: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    });

    values = {
      ...(result.values.output && { output: result.values.output }),
      ...(result.values.help && { help: result.values.help }),
    };
    positionals = [...result.positionals];
  } else {
    values = {};
    positionals = [...argv];
  }

  const parsedPositionals = parsePositionals(
    positionals,
    values['help'] === true,
  );

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
    const firstArg = positionals.at(0);
    const isExplicitCommand =
      isHelp || commandSchema.safeParse(firstArg).success;

    if (isExplicitCommand) {
      const [command, ...rest] = positionals;
      return {
        command,
        ...(rest.length > 0 ? { positionalArgs: rest } : {}),
      };
    }

    return {
      ...(positionals.length > 0 ? { positionalArgs: positionals } : {}),
    };
  } catch (error) {
    throw new Error(
      `Error parsing positional arguments: ${stringifyError(error)}`,
    );
  }
}
