import db, { Adres, Plaats } from '@prisma/client';
import { readImportJson, writeOutputJson } from './seed-utils.js';
import fs from 'fs/promises';
import { toCsv } from '@rock-solid/shared';

class PlaatsMatcher {
  private plaatsenByPostcode = new Map<string, Plaats[]>();

  constructor(private client: db.PrismaClient) {}

  async init() {
    const records = await this.client.plaats.findMany();
    for (const record of records) {
      let existing = this.plaatsenByPostcode.get(record.postcode);
      if (!existing) {
        existing = [];
        this.plaatsenByPostcode.set(record.postcode, existing);
      }
      existing.push(record);
    }
  }

  findPlaatsMatches(rawPostcode: string) {
    const postCode = postcodeFromRaw(rawPostcode);
    const plaatsen = this.plaatsenByPostcode.get(postCode);
    if (plaatsen === undefined) {
      return undefined;
    }
    return plaatsen;
  }
}

type Matcher = (
  plaatsen: Plaats[],
  rawDeelgemeente: string,
  currentPlaats: Plaats,
) => Plaats | undefined;
const [from, to] = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

function normalize(gemeenteNaam: string) {
  return gemeenteNaam
    .replaceAll('-', ' ')
    .replaceAll('.', '')
    .trim()
    .toLowerCase();
}

function postcodeFromRaw(raw: string): string {
  return [...raw]
    .filter((char) => {
      const charCode = char.charCodeAt(0);
      return charCode >= from && charCode <= to;
    })
    .join('');
}

interface Work {
  rawGemeente: string;
  adres: Adres & { plaats: Plaats };
  plaatsCandidates: Plaats[];
  naam: string;
  type: EntityType;
}

type EntityType = 'deelnemer' | 'vrijwilliger' | 'organisatie';

interface CsvResultRow {
  matchGevonden: boolean;
  matcher: string;
  veranderd: boolean;
  oudePlaats: string | undefined;
  nieuwePlaats: string | undefined;
  type: EntityType;
  naam: string;
  oorspronkelijkeText: string;
}

export async function adresSeeder2(client: db.PrismaClient) {
  const plaatsMatcher = new PlaatsMatcher(client);
  await plaatsMatcher.init();
  const deelnemerIdByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>('deelnemers-lookup.json'),
    ),
  );

  const personenById = new Map(
    (
      await client.persoon.findMany({
        include: {
          verblijfadres: { include: { plaats: true } },
          domicilieadres: { include: { plaats: true } },
        },
      })
    ).map((p) => [p.id, p]),
  );
  const deelnemersRaw = await readImportJson<RawDeelnemer[]>('deelnemers.json');
  const organisatiesRaw =
    await readImportJson<RawOrganisatie[]>('deelnemers.json');

  const backlog: Set<Work> = new Set();
  for (const deelnemer of deelnemersRaw) {
    const deelnemerId = deelnemerIdByTitles.get(deelnemer[''])!;
    const persoon = personenById.get(deelnemerId);
    const matchedPlaatsen = plaatsMatcher.findPlaatsMatches(deelnemer.postcode);
    if (persoon && persoon.verblijfadres && matchedPlaatsen) {
      backlog.add({
        naam: persoon.volledigeNaam,
        type: 'deelnemer',
        adres: persoon.verblijfadres,
        plaatsCandidates: matchedPlaatsen,
        rawGemeente: deelnemer.gemeente,
      });
    }

    const matchedPlaatsenDomicilie = plaatsMatcher.findPlaatsMatches(
      deelnemer['postnummer domicilie'],
    );
    if (persoon && persoon.domicilieadres && matchedPlaatsenDomicilie) {
      backlog.add({
        naam: persoon.volledigeNaam,
        type: 'deelnemer',
        adres: persoon.domicilieadres,
        plaatsCandidates: matchedPlaatsenDomicilie,
        rawGemeente: deelnemer['gemeente domicilie'],
      });
    }
  }
  for (const organisatie of organisatiesRaw) {
    
  }
  const matchers: Record<string, Matcher> = {
    updatedSinceRelease(plaatsen, _, currentPlaats) {
      return currentPlaats.postcode !== plaatsen[0]!.postcode
        ? currentPlaats
        : undefined;
    },
    exact(plaatsen, rawDeelgemeente) {
      return plaatsen.find((p) => p.deelgemeente === rawDeelgemeente.trim());
    },
    normalize(plaatsen, rawDeelgemeente) {
      const normalized = normalize(rawDeelgemeente);
      return plaatsen.find((p) => normalize(p.deelgemeente) === normalized);
    },
    splitOnDash(plaatsen, rawDeelgemeente) {
      const parts = rawDeelgemeente.split('-');
      if (parts.length === 2) {
        const [deelgemeente, gemeente] = parts;
        return plaatsen.find(
          (p) =>
            normalize(p.deelgemeente) === normalize(deelgemeente!) &&
            normalize(p.gemeente) === normalize(gemeente!),
        );
      }
    },
    splitOnDashReverse(plaatsen, rawDeelgemeente) {
      const parts = rawDeelgemeente.split('-');
      if (parts.length === 2) {
        const [gemeente, deelgemeente] = parts;
        return plaatsen.find(
          (p) =>
            normalize(p.deelgemeente) === normalize(deelgemeente!) &&
            normalize(p.gemeente) === normalize(gemeente!),
        );
      }
    },
    single(plaatsen) {
      if (plaatsen.length === 1) {
        return plaatsen[0];
      }
      return;
    },
    sint(plaatsen, rawDeelgemeente) {
      if (rawDeelgemeente.startsWith('St.')) {
        const normalized = normalize(rawDeelgemeente.replace('St.', 'Sint'));
        return plaatsen.find(
          (p) =>
            normalize(p.deelgemeente) === normalized ||
            normalize(p.deelgemeente) === normalized.replace('sint', 'sint '),
        );
      }
    },
    splitOnSpace(plaatsen, rawDeelgemeente) {
      const parts = rawDeelgemeente.split(' ');
      if (parts.length === 2) {
        const [deelgemeente] = parts;
        return plaatsen.find(
          (p) => normalize(p.deelgemeente) === normalize(deelgemeente!),
        );
      }
    },
    splitOnSpaceReverse(plaatsen, rawDeelgemeente) {
      const parts = rawDeelgemeente.split(' ');
      if (parts.length === 2) {
        const [, deelgemeente] = parts;
        return plaatsen.find(
          (p) => normalize(p.deelgemeente) === normalize(deelgemeente!),
        );
      }
    },
    uitzonderingen(plaatsen, rawDeelgemeente) {
      const map: Record<string, string> = {
        "St.Job in 't Goor": "Sint-Job-In-'T-Goor",
        'Sint-Job-Brecht': "Sint-Job-In-'T-Goor",
        'Sint Michiels Brugge': 'Sint-Michiels',
        'Korbeek - Lo': 'Korbeek-Lo',
        'Sint-Andries-Brugge': 'Sint-Andries',
        Echtegem: 'Ichtegem',
        'Dilsen-Lanklaar': 'Lanklaar',
        'Meeuwen-Gruitrode': 'Meeuwen',
        'S.P. Leeuw': 'Sint-Pieters-Leeuw',
        'Sint-Antonius-Zoersel': 'Zoersel',
        'St.-Antonius-Zoersel': 'Zoersel',
        Laneken: 'Lanaken',
        'Sint-Leenaarts': 'Sint-Lenaarts',
        'Kapelle o/d Bos': 'Kapelle-op-den-Bos',
        'Asse - Terheide': 'Asse',
        'Dilbeek(St.Ulriks-Kapelle': 'Sint-Ulriks-Kapelle',
        Veltem: 'Veltem-Beisem',
        'Hombeek-Leest': 'Hombeek',
        'St.Lenaerts': 'Sint-Lenaarts',
        Oelegem: 'Oeselgem',
        Bonheide: 'Bonheiden',
        'St.-Gillis (Dendermonde)': 'Sint-Gillis-Dendermonde',
        Guldenberg: 'Huldenberg',
        'Landen (Attenhoven)': 'Attenhoven',
        'Henre-Herfelingen': 'Herfelingen',
      };
      if (map[rawDeelgemeente]) {
        return plaatsen.find((p) => p.deelgemeente === map[rawDeelgemeente]);
      }
    },
  };

  const jsonResults: Record<string, Record<string, string>> = {};
  const csvResults: CsvResultRow[] = [];
  for (const [name, matcher] of Object.entries(matchers)) {
    const result: Record<string, string> = (jsonResults[name] = {});
    for (const workItem of backlog) {
      const match = matcher(
        workItem.plaatsCandidates,
        workItem.rawGemeente,
        workItem.adres.plaats,
      );
      if (match) {
        if (match.id === workItem.adres.plaatsId) {
          result[workItem.rawGemeente] = '✅';
          csvResults.push({
            matchGevonden: true,
            veranderd: false,
            oudePlaats: workItem.adres.plaats.volledigeNaam,
            nieuwePlaats: workItem.adres.plaats.volledigeNaam,
            type: 'deelnemer',
            naam: workItem.naam,
            oorspronkelijkeText: workItem.rawGemeente,
            matcher: name,
          });
        } else {
          result[workItem.rawGemeente] = `👉 ${match.volledigeNaam}`;
          csvResults.push({
            matchGevonden: true,
            veranderd: true,
            oudePlaats: workItem.adres.plaats.volledigeNaam,
            nieuwePlaats: match.volledigeNaam,
            type: 'deelnemer',
            naam: workItem.naam,
            oorspronkelijkeText: workItem.rawGemeente,
            matcher: name,
          });
          await client.adres.update({
            where: { id: workItem.adres.id },
            data: { plaatsId: match.id },
          });
        }
        backlog.delete(workItem);
      }
    }
  }
  console.log(`Remaining: ${backlog.size}`);
  jsonResults['remaining'] = Object.fromEntries(
    [...backlog].map(
      ({ rawGemeente, plaatsCandidates }) =>
        [
          rawGemeente,
          `❌ ${plaatsCandidates
            .map(
              ({ volledigeNaam, deelgemeente }) =>
                `'${deelgemeente}' - '${volledigeNaam}'`,
            )
            .join(',')}`,
        ] as const,
    ),
  );
  for (const { adres, rawGemeente } of backlog) {
    csvResults.push({
      matchGevonden: false,
      veranderd: false,
      oudePlaats: adres.plaats.volledigeNaam,
      nieuwePlaats: undefined,
      type: 'deelnemer',
      naam: adres.plaats.deelgemeente,
      oorspronkelijkeText: rawGemeente,
      matcher: 'none',
    });
  }
  await writeOutputJson('adres-seeder-2.json', jsonResults, false);
  await fs.writeFile(
    new URL(`../../import/plaats-correctie-cursisten.csv`, import.meta.url),
    toCsv(csvResults, [
      'naam',
      'type',
      'matchGevonden',
      'veranderd',
      'nieuwePlaats',
      'oudePlaats',
      'oorspronkelijkeText',
      'matcher',
    ]),
    'utf-8',
  );
}

interface RawOrganisatie {
  Naam: string;
  TAV: string;
  soort: string;
  adres: string;
  postcode: string;
  plaats: string;
  'e-mail': string;
  telefoon: string;
  website: string;
  'mailing op e-mail': string;
  opmerkingen: string;
  'folders Kei-Jong (niet Buso)': 'ja' | 'nee';
  'folders Kei-Jong Buso': 'ja' | 'nee';
  'folders cursussen De Kei': 'ja' | 'nee';
  'folders wintervakanties De Kei': 'ja' | 'nee';
  'folders zomervakanties De Kei': 'ja' | 'nee';
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
