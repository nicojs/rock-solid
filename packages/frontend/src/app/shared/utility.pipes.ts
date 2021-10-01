export const notAvailable = 'n/a';

export function show(value: unknown) {
  if (value === undefined || value === null) {
    return notAvailable;
  } else {
    return value;
  }
}

export function capitalize<T extends string>(value: T): Capitalize<T> {
  const [firstLetter = '', ...rest] = value;
  return `${firstLetter.toUpperCase()}${rest.join('')}` as Capitalize<T>;
}

export function singularize(value: string): string {
  if (value.endsWith('en')) {
    return value.substr(0, value.length - 2);
  }
  return value;
}

export function pluralize(val: string) {
  switch (val) {
    case 'cursus':
      return 'cursussen';
    default:
      return `${val}s`;
  }
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

export function showDatum(val: Date | undefined): string {
  if (val) {
    return val.toLocaleDateString();
  }
  return notAvailable;
}
