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
