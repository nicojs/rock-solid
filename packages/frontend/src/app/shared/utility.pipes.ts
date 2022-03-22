export const notAvailable = 'n/a';
export const none = 'geen';

export function show(value: unknown) {
  if (value === undefined || value === null) {
    return notAvailable;
  } else if (Array.isArray(value)) {
    if (value.length) {
      return value.join(', ');
    } else {
      return none;
    }
  } else {
    return value;
  }
}

export function showBoolean(val: boolean | undefined) {
  switch (val) {
    case true:
      return 'Ja';
    case false:
      return 'Nee';
    default:
      return notAvailable;
  }
}

export function capitalize<T extends string>(value: T): Capitalize<T> {
  const [firstLetter = '', ...rest] = value;
  return `${firstLetter.toUpperCase()}${rest.join('')}` as Capitalize<T>;
}

export function uncapitalize<T extends string>(value: T): Uncapitalize<T> {
  const [firstLetter = '', ...rest] = value;
  return `${firstLetter.toLocaleLowerCase()}${rest.join(
    '',
  )}` as Uncapitalize<T>;
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
    case 'overigPersoon':
      return 'overige personen';
    case 'plaats':
      return 'plaatsen';
    default:
      return `${val}s`;
  }
}

export function toDateString(
  val: Date | number | undefined,
): string | undefined {
  if (val === undefined || typeof val === 'number') {
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
