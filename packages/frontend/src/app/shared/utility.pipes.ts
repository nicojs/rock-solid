export function show(value: unknown) {
  if (value === undefined || value === null) {
    return 'N/A';
  } else {
    return value;
  }
}

export function capitalize<T extends string>(value: T): Capitalize<T> {
  const [firstLetter = '', ...rest] = value;
  return `${firstLetter.toUpperCase()}${rest.join('')}` as Capitalize<T>;
}
