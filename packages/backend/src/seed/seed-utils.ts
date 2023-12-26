import fs from 'fs/promises';

export async function readImportJson<T>(relativeFileName: string) {
  return JSON.parse(
    await fs.readFile(
      new URL(`../../import/${relativeFileName}`, import.meta.url),
      'utf-8',
    ),
  ) as T;
}

export async function writeOutputJson(
  relativeFileName: string,
  obj: object,
  readonly: boolean,
) {
  if (readonly) {
    console.log(`Skipping ${relativeFileName} (readonly mode)`);
    return;
  }
  await fs.writeFile(
    new URL(`../../import/${relativeFileName}`, import.meta.url),
    JSON.stringify(obj, null, 2),
    'utf-8',
  );
}
export function stringFromRaw(str: string) {
  return str === '' ? undefined : str;
}

export function groupBy<T>(keySelector: (item: T) => string) {
  return [
    (acc: Map<string, T[]>, item: T) => {
      const key = keySelector(item);
      const items = acc.get(key) ?? [];
      items.push(item);
      acc.set(key, items);
      return acc;
    },
    new Map<string, T[]>(),
  ] as const;
}

export function pickNotEmpty<T, TProp extends keyof T>(
  items: T[],
  prop: TProp,
) {
  return items.map((item) => item[prop]).filter(Boolean)[0];
}

export function datumFromRaw(datum: string): Date | undefined {
  // 1971-11-13
  if (datum) {
    const d = new Date(datum);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date: ${datum}`);
    }
    return d;
  }
  return undefined;
}

export function prijsFromRaw(prijs: string) {
  if (prijs.startsWith('€')) {
    return Number.parseFloat(prijs.substring(1));
  }
  return undefined;
}
