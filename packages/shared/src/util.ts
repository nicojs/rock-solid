export function empty<T>(val: T | null | undefined): val is null | undefined {
  return val === undefined || val === null;
}

export function notEmpty<T>(val: T | null | undefined): val is T {
  return !empty(val);
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function split<T>(
  values: Iterable<T>,
  predicate: (value: T, index: number) => boolean,
): [T[], T[]] {
  const left: T[] = [];
  const right: T[] = [];
  let index = 0;
  for (const value of values) {
    if (predicate(value, index++)) {
      left.push(value);
    } else {
      right.push(value);
    }
  }
  return [left, right];
}

export function calculateAge(geboortedatum: Date, now = new Date()): number {
  const then = geboortedatum;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (
    today.getFullYear() -
    then.getFullYear() -
    (today.valueOf() >=
    new Date(today.getFullYear(), then.getMonth(), then.getDate()).valueOf()
      ? 0
      : 1)
  );
}

export type Queryfied<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K]
    : T[K] extends string | undefined
      ? T[K]
      : undefined extends T[K]
        ? string | undefined
        : string;
};

export function filterMetaQuery<T extends Record<string, unknown>>(query: T) {
  return Object.entries(query)
    .filter(([key]) => !key.startsWith('_'))
    .reduce(
      (acc, [k, v]) => {
        acc[k] = v;
        return acc;
      },
      {} as Record<string, unknown>,
    ) as T;
}

export function tryParseInt(val: string | undefined): number | undefined {
  if (val === undefined) {
    return undefined;
  }
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

export function tryParseBoolean(val: string | undefined): boolean | undefined {
  if (val === undefined) {
    return undefined;
  }
  if (val === 'true') {
    return true;
  }
  if (val === 'false') {
    return false;
  }
  return undefined;
}

/**
 * Represents a URL query (e.g. `?foo=bar&baz=qux` = `{ foo: 'bar', baz: 'qux' }`)
 */
export type Query = Record<string, string>;
