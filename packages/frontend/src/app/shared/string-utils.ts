import {
  Aanmelding,
  aanmeldingLabels,
  Adres,
  BasePersoon,
  Deelnemer,
  deelnemerLabels,
  Organisatie,
  organisatieColumnNames,
  organisatieContactColumnNames,
  organisatieSoorten,
  OverigPersoon,
  overigPersoonLabels,
} from '@rock-solid/shared';
import {
  capitalize,
  foldervoorkeurenCsv,
  optionsCsv,
  show,
  showBoolean,
  showDatum,
} from './utility.pipes';

export type ValueFactory<T> = {
  [Prop in keyof T]?: (val: T[Prop]) => string;
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 * @returns the decimal separator in the current language
 */
export function decimalSeparator(): ',' | '.' {
  return new Intl.NumberFormat().format(1.2).substring(1, 2) as ',' | '.';
}

export function downloadCsv(csv: string, fileName = 'download') {
  // Creating a Blob for having a csv file format
  // and passing the data with type
  const blob = new Blob([csv], { type: 'text/csv' });

  // Creating an object for downloading url
  const url = window.URL.createObjectURL(blob);

  // Creating an anchor(a) tag of HTML
  const a = document.createElement('a');

  // Passing the blob downloading url
  a.setAttribute('href', url);

  // Setting the anchor tag attribute for downloading
  // and passing the download file name
  a.setAttribute('download', `${fileName}`);

  // Performing a download with click
  a.click();
}

const basePersoonColumns = Object.freeze([
  'voornaam',
  'achternaam',
  'emailadres',
  'geboortedatum',
  'geslacht',
  'geslachtOpmerking',
  'gsmNummer',
  'telefoonnummer',
  'rekeningnummer',
  'rijksregisternummer',
  'opmerking',
] as const) satisfies readonly (keyof BasePersoon)[];

const adresCsvColumns = Object.freeze([
  'postcode',
  'adres',
  'gemeente',
  'deelgemeente',
] as const) satisfies readonly (keyof ReturnType<typeof adresCsvFields>)[];

const aanmeldingCsvColumns = Object.freeze([
  'tijdstipVanAanmelden',
  'rekeninguittrekselNummer',
  'opmerking',
  'status',
] as const) satisfies readonly (keyof Aanmelding)[];

export function toOverigePersonenCsv(personen: OverigPersoon[]) {
  return toCsv(
    personen.map(
      ({
        verblijfadres: {
          plaats: { postcode, gemeente, deelgemeente },
          straatnaam,
          huisnummer,
          busnummer,
        },
        domicilieadres,
        ...deelnemer
      }) => ({
        ...deelnemer,
        postcode,
        adres: `${straatnaam} ${huisnummer}${
          busnummer ? ` bus ${busnummer}` : ''
        }`,
        gemeente,
        deelgemeente,
      }),
    ),
    [...basePersoonColumns, ...adresCsvColumns, 'selectie', 'foldervoorkeuren'],
    overigPersoonLabels,
    {
      selectie: show,
      foldervoorkeuren: foldervoorkeurenCsv,
    },
  );
}

function adresCsvFieldsOrDefault(adres?: Adres): AdresCsvFields {
  return adres
    ? adresCsvFields(adres)
    : {
        adres: '',
        deelgemeente: '',
        gemeente: '',
        postcode: '',
      };
}

interface AdresCsvFields {
  postcode: string;
  adres: string;
  gemeente: string;
  deelgemeente: string;
}

function adresCsvFields({
  plaats: { postcode, gemeente, deelgemeente },
  straatnaam,
  huisnummer,
  busnummer,
}: Adres): AdresCsvFields {
  return {
    postcode,
    adres: toStraatEnHuisnummer({ straatnaam, huisnummer, busnummer }),
    gemeente,
    deelgemeente,
  };
}

/**
 * To personen csv for mailings
 */
export function toDeelnemersCsv(personen: Deelnemer[]): string {
  return toCsv(
    personen.map(({ verblijfadres, domicilieadres, ...deelnemer }) => ({
      ...deelnemer,
      ...adresCsvFields(verblijfadres),
    })),
    [...basePersoonColumns, ...adresCsvColumns],
    deelnemerLabels,
    {},
  );
}

export function toAanmeldingenCsv(aanmeldingen: Aanmelding[]): string {
  return toCsv(
    aanmeldingen.map(({ deelnemer, ...aanmelding }) => ({
      ...aanmelding,
      ...deelnemer,
      ...adresCsvFieldsOrDefault(deelnemer?.verblijfadres),
    })),
    [
      ...basePersoonColumns,
      'toestemmingFotos',
      ...adresCsvColumns,
      ...aanmeldingCsvColumns,
    ],
    { ...deelnemerLabels, ...aanmeldingLabels },
    {},
  );
}

function toStraatEnHuisnummer({
  straatnaam,
  huisnummer,
  busnummer,
}: Pick<Adres, 'straatnaam' | 'busnummer' | 'huisnummer'>): string {
  return `${straatnaam} ${huisnummer}${busnummer ? ` bus ${busnummer}` : ''}`;
}

export function toOrganisatiesCsv(organisaties: Organisatie[]): string {
  return toCsv(
    organisaties.flatMap((org) =>
      org.contacten.map(({ adres, ...contact }) => ({
        ...(adres ? adresCsvFields(adres) : {}),
        ...org,
        ...contact,
      })),
    ),
    [
      'naam',
      'website',
      'terAttentieVan',
      'foldervoorkeuren',
      'adres',
      'emailadres',
      'telefoonnummer',
      'soorten',
      ...adresCsvColumns,
    ],
    { ...organisatieColumnNames, ...organisatieContactColumnNames },
    {
      foldervoorkeuren: foldervoorkeurenCsv,
      soorten: optionsCsv(organisatieSoorten),
    },
  );
}

export function toCsv<T>(
  values: T[],
  columns: ReadonlyArray<keyof T & string>,
  columnLabels: Partial<Record<keyof T, string>>,
  valueFactory: ValueFactory<T>,
): string {
  // The excel csv delimiter is the opposite of the decimal separator, see https://www.ablebits.com/office-addins-blog/change-excel-csv-delimiter/
  const delimiter = decimalSeparator() === ',' ? ';' : ',';

  let csv = columns
    .map((column) => columnLabels[column] ?? capitalize(column))
    .map(escape)
    .join(delimiter);
  csv += '\n';

  csv += values
    .map((row) => columns.map((column) => toValue(row, column)).join(delimiter))
    .join('\n');
  return csv;

  function toValue(row: T, column: keyof T & string) {
    const val = row[column];
    return escape(mapValue(column, val));
  }

  function mapValue(column: keyof T & string, val: T[keyof T & string]) {
    const factory = valueFactory[column];
    if (factory) {
      return factory(val);
    }
    if (typeof val === 'boolean') {
      return showBoolean(val);
    }
    if (val instanceof Date) {
      return showDatum(val);
    }
    if (typeof val === 'object' || typeof val === 'function') {
      throw new Error(
        `Csv of ${typeof val} is not supported. Requested ${column}: ${val}`,
      );
    }

    if (val === undefined || val === null) {
      return '';
    }
    return String(val);
  }

  function escape(str: string) {
    if (str.includes(delimiter) || str.includes('"') || str.includes("'")) {
      return `"${str.replace(/"/, '""')}"`;
    }
    return str;
  }
}
