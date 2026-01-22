import { jitiCommand } from './jiti.command.js';

export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  await jitiCommand(args);
}
