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
