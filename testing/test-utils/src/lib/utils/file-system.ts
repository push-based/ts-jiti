import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function fsFromJson<T extends  Record<string, unknown> = Record<string, unknown>,
>(files: T, baseDir?: string): Promise<() => Promise<void>> {
  const createdPaths = await Promise.all(
    Object.entries(files).map(async ([filePath, content]) => {
      const fullPath = baseDir ? path.join(baseDir, filePath) : filePath;
      if (fullPath.endsWith('/')) {
        return null;
      }
      const dir = path.dirname(fullPath);
      if (dir !== '.' && dir !== fullPath) {
        await mkdir(dir, { recursive: true });
      }
      const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await writeFile(fullPath, fileContent, 'utf8');
      return fullPath;
    }),
  );
  const validPaths = createdPaths.filter((p): p is string => p != null);
  return async () => {
    await Promise.allSettled(
      validPaths.map(async filePath => {
        try {
          await rm(filePath, { force: true });
        } catch {
          // Ignore errors when cleaning up
        }
      }),
    );
  };
}