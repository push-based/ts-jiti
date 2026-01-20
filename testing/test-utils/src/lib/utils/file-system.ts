import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, { recursive: true });
    return;
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    console.error(fsError.message);
    if (fsError.code !== 'EEXIST') {
      throw error;
    }
  }
}

export type FileContent = string | Record<string, any>;
export type FileEntry = Record<string, FileContent>;
export type FileSystem = Record<string, string | FileEntry>;

/**
 * Creates files in file system based on the JSON object.
 * @param fsJson - The file system structure to create
 * @param baseUrl - The base directory to create the file system
 * @returns A function to cleanup the file system
 */
export async function fromJson(
  fsJson: FileSystem,
  baseUrl: string = process.cwd(),
): Promise<() => void> {
  const createdPaths: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const [relativePath, content] of Object.entries(fsJson)) {
    const fullPath = path.join(baseUrl, relativePath);
    const dirPath = path.dirname(fullPath);

    await mkdir(dirPath, { recursive: true });

    const fileContent =
      typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await writeFile(fullPath, fileContent);
    // eslint-disable-next-line functional/immutable-data
    createdPaths.push(fullPath);
  }

  return async () => {
    await Promise.all(
      createdPaths.map(filePath => rm(filePath, { force: true })),
    );
  };
}
