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

export function toDateString(val: Date | undefined): string | undefined {
  if (val === undefined) {
    return;
  }
  function leadingZeroIfNeeded(n: number): string {
    if (n < 10) {
      return `0${n}`;
    } else {
      return `${n}`;
    }
  }
  return `${val.getFullYear()}-${leadingZeroIfNeeded(
    val.getMonth(),
  )}-${leadingZeroIfNeeded(val.getDate())}`;
}
