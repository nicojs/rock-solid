import {
  Plaats,
  Adres,
  Decimal,
  foldersoorten,
  empty,
  Foldervoorkeur,
  communicatievoorkeuren,
  Options,
} from '@rock-solid/shared';
import { html } from 'lit';
import { decimalSeparator } from './string-utils';

export const notAvailable = 'n/a';
export const none = 'geen';

export function show<T>(value: T): string {
  if (value === undefined || value === null) {
    return notAvailable;
  } else if (Array.isArray(value)) {
    if (value.length) {
      return value.join(', ');
    } else {
      return none;
    }
  } else {
    return String(value);
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

export function showPlaats(plaats?: Plaats): string {
  if (plaats) {
    if (plaats.id === 1) {
      return 'Onbekend';
    }
    return `${plaats.postcode} ${plaats.deelgemeente} (${plaats.gemeente})`;
  } else {
    return '';
  }
}

export function showAdres(adres?: Adres) {
  if (adres) {
    const straatNaamEnHuisnummer = [adres.straatnaam, adres.huisnummer]
      .filter(Boolean)
      .join(' ');
    const straatHuisnummerBus = `${straatNaamEnHuisnummer}${
      adres.busnummer ? ` bus ${adres.busnummer}` : ''
    }`;
    return [straatHuisnummerBus, showPlaats(adres.plaats)]
      .filter(Boolean)
      .join(', ');
  }
  return ' ';
}

export function showMoney(decimal?: Decimal) {
  if (decimal) {
    return `€ ${decimal.toFixed(2).replace('.', decimalSeparator())}`;
  }
  return notAvailable;
}

export function foldervoorkeurBadges(
  folderVoorkeur: Foldervoorkeur[] | undefined,
) {
  if (folderVoorkeur) {
    return folderVoorkeur.map(
      ({ folder, communicatie }) =>
        html`<span
          title="${foldersoorten[folder]} per ${communicatievoorkeuren[
            communicatie
          ]}"
          class="badge bg-success me-1"
        >
          ${foldersoorten[folder]}</span
        >`,
    );
  }
  return empty;
}

export function foldervoorkeurenCsv(
  foldervoorkeuren: Foldervoorkeur[],
): string {
  return foldervoorkeuren
    .map(
      ({ folder, communicatie }) =>
        `${foldersoorten[folder]} per ${communicatievoorkeuren[communicatie]}`,
    )
    .join(', ');
}

export function optionsCsv<T extends string>(options: Options<T>) {
  return (values: T[]) => values.map((value) => options[value]).join(', ');
}
