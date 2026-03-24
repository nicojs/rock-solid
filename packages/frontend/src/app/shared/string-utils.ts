import {
  Aanmelding,
  aanmeldingLabels,
  Adres,
  BasePersoon,
  Deelnemer,
  deelnemerLabels,
  Organisatie,
  organisatieLabels,
  organisatieContactColumnNames,
  organisatieSoorten,
  OverigPersoon,
  overigPersoonLabels,
  toCsv,
  Project,
  CursusActiviteit,
  VakantieActiviteit,
  showDatum,
} from '@rock-solid/shared';
import { foldervoorkeurenCsv, optionsCsv, show } from './utility.pipes';

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 * @returns the decimal separator in the current language
 */
export function decimalSeparator(): ',' | '.' {
  return new Intl.NumberFormat().format(1.2).substring(1, 2) as ',' | '.';
}

export function downloadCsv(csv: string, fileName = 'download') {
  // Adding BOM to the CSV string, see https://hilton.org.uk/blog/csv-excel#unicode-misidentification
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;

  // Creating a Blob for having a csv file format
  // and passing the data with type
  const blob = new Blob([csvWithBom], { type: 'text/csv' });
  download(blob, fileName);
}

export function download(blob: Blob, fileName: string) {
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
  'voedingswens',
  'voedingswensOpmerking',
  'opmerking',
] as const) satisfies readonly (keyof BasePersoon)[];

const adresCsvColumns = Object.freeze([
  'adres',
  'postcode',
  'gemeente',
  'deelgemeente',
  'land',
] as const) satisfies readonly (keyof ReturnType<typeof adresCsvFields>)[];

const aanmeldingCsvColumns = Object.freeze([
  'tijdstipVanAanmelden',
  'rekeninguittrekselNummer',
  'opmerking',
  'status',
] as const) satisfies readonly (keyof Aanmelding)[];

export function toOverigePersonenCsv(personen: OverigPersoon[]) {
  return toCsv(
    personen.map(({ verblijfadres, domicilieadres, ...deelnemer }) => ({
      ...deelnemer,
      ...adresCsvFields(verblijfadres),
    })),
    [...basePersoonColumns, ...adresCsvColumns, 'selectie', 'foldervoorkeuren'],
    overigPersoonLabels,
    {
      selectie: show,
      foldervoorkeuren: foldervoorkeurenCsv,
    },
  );
}

interface AdresCsvFields {
  postcode: string;
  adres: string;
  gemeente: string;
  deelgemeente: string;
  land: string;
}

function adresCsvFields(adres: Adres | undefined): AdresCsvFields {
  if (adres) {
    const {
      plaats: { postcode, gemeente, deelgemeente, land },
      straatnaam,
      huisnummer,
      busnummer,
    } = adres;
    return {
      postcode,
      adres: toStraatEnHuisnummer({ straatnaam, huisnummer, busnummer }),
      gemeente,
      deelgemeente,
      land,
    };
  }
  return {
    adres: '',
    deelgemeente: '',
    gemeente: '',
    postcode: '',
    land: '',
  };
}

function projectCsvFields(project: Project) {
  return {
    projectNaam: project.naam,
    projectType: project.type,
    prijs: project.prijs,
    saldo: project.saldo,
    voorschot: project.voorschot,
  };
}

const projectCsvColumns = Object.freeze([
  'projectNaam',
  'projectType',
  'prijs',
  'saldo',
  'voorschot',
] as const) satisfies readonly (keyof ReturnType<typeof projectCsvFields>)[];

function activiteitenCsvFields(
  activiteiten: CursusActiviteit[] | VakantieActiviteit[],
): Record<`activiteit-${number}-${'van' | 'totEnMet'}`, string> {
  return activiteiten
    .map((activiteit, index) => ({
      [`activiteit-${index + 1}-van`]: showDatum(activiteit.van),
      [`activiteit-${index + 1}-totEnMet`]: showDatum(activiteit.totEnMet),
    }))
    .reduce((acc, cur) => ({ ...acc, ...cur }), {});
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

export function toAanmeldingenCsv(
  aanmeldingen: Aanmelding[],
  project: Project,
): string {
  const projectCsv = projectCsvFields(project);
  const activiteitenCsv = activiteitenCsvFields(project.activiteiten);
  return toCsv(
    aanmeldingen.map(({ deelnemer, ...aanmelding }) => ({
      ...aanmelding,
      ...deelnemer,
      ...adresCsvFields(deelnemer?.verblijfadres),
      ...projectCsv,
      ...activiteitenCsv,
    })),
    [
      ...basePersoonColumns,
      ...adresCsvColumns,
      ...aanmeldingCsvColumns,
      ...projectCsvColumns,
      ...(Object.keys(activiteitenCsv) as any), // 🤷‍♂️
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
      'emailadres',
      'telefoonnummer',
      'soorten',
      ...adresCsvColumns,
    ],
    { ...organisatieLabels, ...organisatieContactColumnNames },
    {
      foldervoorkeuren: foldervoorkeurenCsv,
      soorten: optionsCsv(organisatieSoorten),
    },
  );
}
