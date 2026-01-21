import { readFile, stat } from 'node:fs/promises';

export async function readTextFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString();
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const text = await readTextFile(filePath);
  return JSON.parse(text) as T;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
