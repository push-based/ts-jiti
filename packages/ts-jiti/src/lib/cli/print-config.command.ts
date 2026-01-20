import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import type { JitiOptions } from './read-ts-config-file.js';

export function isPrintConfigCommand(args: string[]): boolean {
  return args[0] === 'print-config';
}

export async function printConfigCommand(
  opt: JitiOptions,
  o?: {
    tsconfigPath?: string;
    output?: string;
  },
) {
  const { output, tsconfigPath } = o ?? {};
  const json = {
    tsconfigPath,
    ...opt,
  };
  const jsonOutput = JSON.stringify(json, null, 2);

  if (typeof output === 'string') {
    const dir = path.dirname(output);
    if (dir !== '.') {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(output, jsonOutput);
  } else {
    logger.info(JSON.stringify(json));
  }
}
