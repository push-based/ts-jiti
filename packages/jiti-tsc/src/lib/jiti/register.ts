import { createTsJiti } from './import-module.js';

export async function registerJitiTsconfig() {
  const jitiInstance = await createTsJiti(import.meta.url);
  // @ts-expect-error - register method exists but is not in types
  return jitiInstance.register();
}
