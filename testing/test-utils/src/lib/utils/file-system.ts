import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { PackageJson } from 'type-fest';

export async function fsFromJson<T extends  Record<string, unknown> = Record<string, unknown>,
>(files: T, baseDir?: string): Promise<() => Promise<void>> {
  const createdPaths: string[] = [];
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = baseDir ? join(baseDir, filePath) : filePath;
    if (fullPath.endsWith('/')) {
      continue;
    }
    const dir = dirname(fullPath);
    if (dir !== '.' && dir !== fullPath) {
      await mkdir(dir, { recursive: true });
    }
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await writeFile(fullPath, fileContent, 'utf-8');
    createdPaths.push(fullPath);
  }
  const cleanup = async () => {
    for (const filePath of createdPaths) {
      try {
        await rm(filePath, { force: true });
      } catch {}
    }
  };
  return cleanup;
}