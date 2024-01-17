import db from '@prisma/client';
import { ImportDiagnostics } from './import-errors.js';
import { readImportJson, writeOutputJson } from './seed-utils.js';

const adresRegex = /^(\D+)\s*(\d+)\s?(:?bus)?\s?(.*)?$/;

class AdresSeeder<TRaw> {
  private plaatsenByPostcode = new Map<
    string,
    Array<{
      id: number;
      deelgemeente: string;
      gemeente: string;
    }>
  >();

  constructor(
    private client: db.PrismaClient,
    private importErrors: ImportDiagnostics<TRaw>,
  ) {}

  async init() {
    const records = await this.client.plaats.findMany({
      select: { postcode: true, id: true, deelgemeente: true, gemeente: true },
    });
    for (const record of records) {
      let existing = this.plaatsenByPostcode.get(record.postcode);
      if (!existing) {
        existing = [];
        this.plaatsenByPostcode.set(record.postcode, existing);
      }
      existing.push({
        id: record.id,
        deelgemeente: record.deelgemeente,
        gemeente: record.gemeente,
      });
    }
  }

  fromRaw(
    raw: TRaw,
    adres: string,
    rawPostcode: string,
    rawDeelgemeente: string,
  ) {
    if (!adres.length) {
      return undefined;
    }
    const adresMatch = adresRegex.exec(adres);

    if (!adresMatch) {
      this.importErrors.addWarning('adres_parse_error', {
        item: raw,
        detail: `Adres "${adres}" doesn\'t match pattern`,
      });
      return;
    }
    const [, straatnaam, huisnummer, busnummer] = adresMatch as unknown as [
      string,
      string,
      string,
      string | undefined,
    ];

    const postCode = postcodeFromRaw(rawPostcode);
    const gemeenten = this.plaatsenByPostcode.get(postCode);
    if (gemeenten === undefined) {
      this.importErrors.addWarning('postcode_doesnt_exist', {
        detail: `Cannot find postcode "${postCode}", using onbekend`,
        item: raw,
      });
      return;
    }

    const deelgemeente = rawDeelgemeente.trim();
    let gemeente = gemeenten.find(
      ({ deelgemeente: dg, gemeente: g }) =>
        dg === deelgemeente ||
        normalize(dg) === normalize(deelgemeente) ||
        normalize(`${dg}-${g}`) === normalize(deelgemeente),
    );
    if (gemeente === undefined) {
      const newGemeente = gemeenten.find(
        ({ deelgemeente, gemeente }) => deelgemeente === gemeente,
      );
      if (newGemeente) {
        this.importErrors.addInfo('deelgemeente_doesnt_exist', {
          detail: `Cannot find deelgemeente "${deelgemeente}" for postcode "${postCode}" in list: ${gemeenten
            .map(({ deelgemeente }) => deelgemeente)
            .join(', ')}. Using ${newGemeente.deelgemeente} instead`,
          item: raw,
        });
        gemeente = newGemeente;
      } else if (
        gemeenten.length === 1 &&
        normalize(gemeenten[0]!.gemeente) === normalize(deelgemeente)
      ) {
        gemeente = gemeenten[0]!;
      } else {
        this.importErrors.addWarning('deelgemeente_doesnt_exist', {
          detail: `Cannot find deelgemeente "${deelgemeente}" for postcode "${postCode}" in list: ${gemeenten
            .map(({ deelgemeente }) => deelgemeente)
            .join(', ')}. Using onbekend instead`,
          item: raw,
        });
        return;
      }
    }

    return {
      create: {
        huisnummer,
        straatnaam,
        busnummer,
        plaats: { connect: { id: gemeente.id } },
      },
    } satisfies db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput;
  }
}
const [from, to] = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

function normalize(gemeenteNaam: string) {
  return gemeenteNaam.replaceAll('-', ' ').replaceAll('.', '').toLowerCase();
}

function postcodeFromRaw(raw: string): string {
  return [...raw]
    .filter((char) => {
      const charCode = char.charCodeAt(0);
      return charCode >= from && charCode <= to;
    })
    .join('');
}

export async function seedCorrectGemeenteAdres(client: db.PrismaClient) {
  const importDiagnostics = new ImportDiagnostics<unknown>();

  const adresSeeder = new AdresSeeder(client, importDiagnostics);
  await adresSeeder.init();
  const deelnemerIdByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>('deelnemers-lookup.json'),
    ),
  );

  const personenById = new Map(
    (
      await client.persoon.findMany({
        include: { verblijfadres: { include: { plaats: true } } },
      })
    ).map((p) => [p.id, p]),
  );
  const deelnemersRaw = await readImportJson<RawDeelnemer[]>('deelnemers.json');

  let count = 0;
  for (const deelnemer of deelnemersRaw) {
    const deelnemerId = deelnemerIdByTitles.get(deelnemer[''])!;
    const persoon = personenById.get(deelnemerId);
    if (persoon && persoon.verblijfadres) {
      const newAdres = adresSeeder.fromRaw(
        deelnemer,
        deelnemer.adres,
        deelnemer.postcode,
        deelnemer.gemeente,
      );
      if (
        newAdres &&
        newAdres.create.plaats.connect.id !== persoon.verblijfadres.plaatsId
      ) {
        console.log(
          `Updating ${persoon.id} with ${JSON.stringify(
            newAdres.create.plaats,
          )}`,
        );
        count++;
      }
    }
  }
  // console.log(`Updated ${records.length} verblijfplaatsen`);
  console.log(`(${importDiagnostics.report}), ${count}`);
  await writeOutputJson(
    'seed-correct-gemeenten-diagnostics.json',
    importDiagnostics,
    false,
  );
}

interface RawDeelnemer {
  '': string;
  achternaam: string;
  adres: string;
  'adres domicilie': string;
  'Begeleidende dienst': string; // ?
  'contactpersonen cursussen': string; // ?
  'contactpersonen vakanties': string; // ?
  cursussen: 'Ja' | 'Nee'; // ?
  'e-mail': string;
  Eid: string; // ?
  'folder aangevraagd': string; // ?
  geboortedatum: string;
  geboorteplaats: string;
  gemeente: string;
  'gemeente domicilie': string;
  geslacht: 'man' | 'vrouw' | '';
  GSM: string;
  instelling: string; // ?
  'Kei-Jong BUSO': 'Ja' | 'Nee';
  mutualiteit: string; // ?
  naam: string;
  'naam domicilie': string; // ?
  opmerkingen: string;
  'opstapplaats langlopende cursussen': string;
  'opstapplaats vakanties': string;
  'opstapplaats weekends': string;
  postcode: string;
  postnummer: string;
  'postnummer domicilie': string;
  rijksregisternummer: string;
  telefoon: string;
  'telefoon domicilie': string;
  vakanties: 'Ja' | 'Nee';
  'volwassen minderjarig': string;
  werksituatie: string;
  woonsituatie: string;
}
