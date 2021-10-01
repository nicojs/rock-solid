export function empty<T>(val: T | null | undefined): val is null | undefined {
  return val === undefined || val === null;
}

export function notEmpty<T>(val: T | null | undefined): val is T {
  return !empty(val);
}
