import {
  Plaats,
  Adres,
  Decimal,
  foldersoorten,
  empty,
  Foldervoorkeur,
  communicatievoorkeuren,
  Options,
  Provincie,
  Organisatieonderdeel,
  organisatieonderdelen,
  OverigPersoonSelectie,
  overigPersoonSelecties,
  calculateAge,
  showDatum,
  provincies,
} from '@rock-solid/shared';
import { html } from 'lit';

export const unknown = 'onbekend';
export const notAvailable = 'n/a';
export const none = 'geen';

export function show<T>(value: T, nullishValue = notAvailable): string {
  if (value === undefined || value === null) {
    return nullishValue;
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
    return value.substring(0, value.length - 2);
  }
  return value;
}

export function entities(amount: number | undefined, entityName: string) {
  if (amount === 1) {
    return `${amount} ${entityName}`;
  }
  return `${amount ?? 0} ${pluralize(entityName)}`;
}

export function pluralize(val: string) {
  switch (val) {
    case 'cursus':
      return 'cursussen';
    case 'overigPersoon':
      return 'overige personen';
    case 'plaats':
    case 'activiteit':
    case 'aanmelding':
      return `${val}en`;
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
  return `${val.getFullYear()}-${(val.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${val.getDate().toString().padStart(2, '0')}`;
}
export function toDateTimeString(
  val: Date | number | undefined,
): string | undefined {
  if (val === undefined || typeof val === 'number') {
    return;
  }

  // 2017-06-01T08:30
  return `${toDateString(val)}T${val
    .getHours()
    .toString()
    .padStart(2, '0')}:${val.getMinutes().toString().padStart(2, '0')}`;
}

export function showDatumWithAge(val?: Date): string {
  return `${showDatum(val)}${val ? ` (${calculateAge(val)} jaar)` : ''}`;
}

export function showPlaats(plaats?: Plaats): string {
  if (plaats) {
    if (plaats.id === 1) {
      return unknown;
    }
    return `${plaats.postcode} ${plaats.deelgemeente} (${plaats.gemeente})`;
  } else {
    return '';
  }
}

export function showProvincie(provincie?: Provincie): string {
  return (typeof provincie === 'string' && provincies[provincie]) || unknown;
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
  return notAvailable;
}

export function showMoney(decimal?: Decimal) {
  if (decimal) {
    let currency = decimal.toFixed(2);
    if (currency.endsWith('.00')) {
      currency = `${currency.substring(0, currency.length - 2)}-`;
    }
    currency = currency.replace('.', ',');
    return html`€&nbsp;${currency}`;
  }
  return '';
}

export function showOrganisatieonderdeel(
  organisatie?: Organisatieonderdeel,
): string {
  if (organisatie) {
    return organisatieonderdelen[organisatie];
  }
  return unknown;
}

export function showOverigPersoonSelectie(selectie: OverigPersoonSelectie[]) {
  return selectie.map((item) => overigPersoonSelecties[item]).join(', ');
}

export function showFoldervoorkeurBadges(
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
