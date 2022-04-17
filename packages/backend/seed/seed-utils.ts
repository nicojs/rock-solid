import fs from 'fs/promises';

export async function readImportJson<T>(relativeFileName: string) {
  return JSON.parse(
    await fs.readFile(
      new URL(`../../import/${relativeFileName}`, import.meta.url),
      'utf-8',
    ),
  ) as T;
}

export async function writeOutputJson(relativeFileName: string, obj: unknown) {
  await fs.writeFile(
    new URL(`../../import/${relativeFileName}`, import.meta.url),
    JSON.stringify(obj, null, 2),
    'utf-8',
  );
}
export function stringFromRaw(str: string) {
  return str === '' ? undefined : str;
}
