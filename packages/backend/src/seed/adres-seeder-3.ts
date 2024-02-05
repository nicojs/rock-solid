import db from '@prisma/client';
import fs from 'fs/promises';
import { readImportJson } from './seed-utils.js';
import { persoonTypeMapper } from '../services/enum.mapper.js';
import { notEmpty, toCsv } from '@rock-solid/shared';

interface RawRitaDeelnemer {
  '': string;
  achternaam: string;
  naam: string;
  geboortedatum: 'string';
  adres: 'string';
  postcode: string;
  gemeente: string;
  'adres domicilie': string;
  'Begeleidende dienst': string;
  'contactpersonen cursussen': string;
  'contactpersonen vakanties': string;
  cursussen: 'Ja' | 'Nee';
  'e-mail': string;
  Eid: string;
  'folder aangevraagd': string;
  postnummer: string;
  'postnummer domicilie': string;
  'gemeente domicilie': string;
  geboorteplaats: string;
  geslacht: 'man' | 'vrouw' | '';
  GSM: string;
  instelling: string;
  'Kei-Jong BUSO': 'Ja' | 'Nee';
  mutualiteit: string;
  'naam domicilie': string;
  opmerkingen: string;
  'opstapplaats langlopende cursussen': string;
  'opstapplaats vakanties': string;
  'opstapplaats weekends': string;
  rijksregisternummer: string;
  telefoon: string;
  'telefoon domicilie': string;
  vakanties: string;
  'volwassen minderjarig': string;
  werksituatie: string;
  woonsituatie: string;
  'direct verwijderen na migreren': 'ja' | '';
  'adres verwijderen na migreren': 'ja' | '';
}

interface WorkItem {
  currentAdres?: db.Adres;
  naam: string;
  rawAdes: string;
  type: 'deelnemer' | 'organisatiecontact' | 'vrijwilliger' | 'extra persoon';
}

export async function adresSeeder3(client: db.PrismaClient) {
  const actions: UpdateAction[] = [];
  interface UpdateAction extends WorkItem {
    busnummer?: string;
    straatnaam: string;
    huisnummer: string;
  }
  const work: WorkItem[] = [];

  work.push(...(await deelnemerWork(client)));
  work.push(...(await organisatieWork(client)));
  work.push(...(await vrijwilligersWork(client)));
  work.push(...(await extraPersonenWork(client)));

  for (const workItem of work) {
    const adresMatch = adresFromRaw(workItem['rawAdes']);
    if (!adresMatch) {
      continue;
    }
    const { huisnummer, straatnaam, busnummer } = adresMatch;
    if (
      (workItem.currentAdres?.huisnummer !== huisnummer ||
        (workItem.currentAdres?.busnummer ?? undefined) !== busnummer) &&
      workItem.currentAdres?.straatnaam.trim() === straatnaam
    ) {
      actions.push({ ...workItem, huisnummer, straatnaam, busnummer });
    }
  }

  await fs.writeFile(
    new URL(`../../import/adres-correcties.json`, import.meta.url),
    JSON.stringify(
      actions
        .map(({ huisnummer, straatnaam, currentAdres, busnummer }) => {
          if (currentAdres) {
            return {
              id: currentAdres.id,
              huisnummer,
              straatnaam,
              busnummer,
            };
          } else {
            console.warn('no current adres', {
              huisnummer,
              straatnaam,
              busnummer,
            });
          }
        })
        .filter(notEmpty),
      null,
      2,
    ),
    'utf-8',
  );

  await fs.writeFile(
    new URL(`../../import/adres-correcties.csv`, import.meta.url),
    toCsv(
      actions.map(({ currentAdres, ...fields }) => ({
        ...fields,
        currentStraatnaam: currentAdres?.straatnaam,
        currentHuisnummer: currentAdres?.huisnummer,
        currentBus: currentAdres?.busnummer ?? undefined,
      })),
      [
        'naam',
        'type',
        'rawAdes',
        'currentStraatnaam',
        'straatnaam',
        'currentHuisnummer',
        'huisnummer',
        'currentBus',
        'busnummer',
      ],
      {
        rawAdes: 'oorspronkelijke adres',
        currentBus: 'oude busnummer',
        busnummer: 'nieuw busnummer',
        currentHuisnummer: 'oude huisnummer',
        currentStraatnaam: 'oude straatnaam',
        huisnummer: 'nieuw huisnummer',
        straatnaam: 'nieuwe straatnaam',
      },
    ),
    'utf-8',
  );
  console.log('✅ adres-correcties.csv written');
}

async function organisatieWork(client: db.PrismaClient): Promise<WorkItem[]> {
  const workItems: WorkItem[] = [];
  const orgContactIdByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>(
        'organisatie-contact-lookup.json',
      ),
    ),
  );
  const organisatiesRaw =
    await readImportJson<RawOrganisatie[]>('organisaties.json');
  const orgContactById = new Map(
    (
      await client.organisatie.findMany({
        include: {
          contacten: { include: { adres: { include: { plaats: true } } } },
        },
      })
    ).flatMap((organisatie) =>
      organisatie.contacten.map((contact) => [
        contact.id,
        { contact, organisatie },
      ]),
    ),
  );
  for (const organisatie of organisatiesRaw) {
    const orgContactId =
      orgContactIdByTitles.get(`${organisatie.Naam}${organisatie.TAV}`) ??
      orgContactIdByTitles.get(organisatie.Naam)!;
    const orgContact = orgContactById.get(orgContactId);
    if (!orgContact) {
      continue;
    }
    workItems.push({
      type: 'organisatiecontact',
      naam: `${orgContact.organisatie.naam} - ${orgContact.contact.terAttentieVan}`,
      rawAdes: organisatie.adres,
      currentAdres: orgContact.contact.adres ?? undefined,
    });
  }
  return workItems;
}

async function vrijwilligersWork(client: db.PrismaClient) {
  const vrijwilligersRaw =
    await readImportJson<RawVrijwilliger[]>('vrijwilligers.json');

  const personenById = new Map(
    (
      await client.persoon.findMany({
        where: { type: persoonTypeMapper.toDB('overigPersoon') },
        include: {
          verblijfadres: { include: { plaats: true } },
          domicilieadres: { include: { plaats: true } },
        },
      })
    ).map((p) => [p.id, p]),
  );

  const vrijwilligersByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>('vrijwilligers-lookup.json'),
    ),
  );

  const workItems: WorkItem[] = [];
  for (const rawVrijwilliger of vrijwilligersRaw) {
    const persoonId = vrijwilligersByTitles.get(rawVrijwilliger.titel)!;
    const persoon = personenById.get(persoonId);
    if (!persoon) {
      continue;
    }
    workItems.push({
      type: 'vrijwilliger',
      naam: persoon.volledigeNaam,
      rawAdes: rawVrijwilliger.adres,
      currentAdres: persoon.verblijfadres ?? undefined,
    });
  }
  return workItems;
}

async function extraPersonenWork(client: db.PrismaClient) {
  const extraPersonenRaw = await readImportJson<RawExtraPersoon[]>(
    'extra-personen.json',
  );
  const personenById = new Map(
    (
      await client.persoon.findMany({
        where: { type: persoonTypeMapper.toDB('overigPersoon') },
        include: {
          verblijfadres: { include: { plaats: true } },
          domicilieadres: { include: { plaats: true } },
        },
      })
    ).map((p) => [p.id, p]),
  );
  const extraPersoonIdByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>('extra-persoon-lookup.json'),
    ),
  );
  const workItems: WorkItem[] = [];
  for (const extraPersoonRaw of extraPersonenRaw) {
    const persoonId = extraPersoonIdByTitles.get(extraPersoonRaw[''])!;
    const persoon = personenById.get(persoonId);

    if (!persoon) {
      continue;
    }
    workItems.push({
      type: 'extra persoon',
      naam: persoon.volledigeNaam,
      rawAdes: extraPersoonRaw.adres,
      currentAdres: persoon.verblijfadres ?? undefined,
    });
  }
  return workItems;
}

async function deelnemerWork(client: db.PrismaClient) {
  const work: WorkItem[] = [];

  const deelnemersRaw =
    await readImportJson<RawRitaDeelnemer[]>('deelnemers.json');
  const deelnemers = await client.persoon.findMany({
    where: { type: persoonTypeMapper.toDB('deelnemer') },
    include: { verblijfadres: true, domicilieadres: true },
  });
  const deelnemerIdByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>('deelnemers-lookup.json'),
    ),
  );

  for (const deelnemerRaw of deelnemersRaw) {
    const deelnemer = deelnemers.find(
      (d) => d.id === deelnemerIdByTitles.get(deelnemerRaw[''])!,
    );
    if (!deelnemer) {
      continue;
    }
    work.push({
      currentAdres: deelnemer.verblijfadres ?? undefined,
      naam: deelnemer.volledigeNaam,
      rawAdes: deelnemerRaw.adres,
      type: 'deelnemer',
    });
  }
  return work;
}

const straatAndHuisnrRegex = /^(\D+)(\d+(?: ?[A-z]+)?)\s*$/;
function adresFromRaw(rawAdres: string) {
  rawAdres = rawAdres
    .replace('geen vakantiefolder', '')
    .replace(' - WIL GEEN FOLDERS MEER', '')
    .replace(' GEEN ZOMERFOLDER', '')
    .replace('geen vakantiefolder', '')
    .trim();

  let [adres, bus] = rawAdres.split('bus') as [string, string | undefined];
  if (!bus) {
    [adres, bus] = rawAdres.split('/') as [string, string | undefined];
  }

  const straatAndHuisnrMatch = straatAndHuisnrRegex.exec(adres);
  if (straatAndHuisnrMatch) {
    const [, straatnaam, huisnummer] = straatAndHuisnrMatch as unknown as [
      string,
      string,
      string,
      string | undefined,
    ];
    return {
      straatnaam: straatnaam.trim(),
      huisnummer: huisnummer.trim(),
      busnummer: bus?.trim(),
    };
  }
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

interface RawVrijwilliger {
  titel: string;
  achternaam: string;
  adres: string;
  'begeleider cursus': string;
  'begeleider vakanties': string;
  'communicatie vakanties':
    | 'planning via mail'
    | 'geen communicatie'
    | 'planning via post';
  'e-mail': string;
  geboortedatum: string;
  gemeente: string;
  GSM: string;
  naam: string;
  opmerkingen: string;
  postcode: string;
  telefoon: string;
}
type JaNee = 'ja' | 'nee';

interface RawExtraPersoon {
  '': string;
  adres: string;
  'algemene vergadering De Bedding': JaNee;
  'algemene vergadering De Kei': JaNee;
  'algemene vergadering Digistap': JaNee;
  'algemene vergadering Kei-Jong': JaNee;
  'e-mail': string;
  'folders cursussen De Kei': JaNee;
  'folders Digistap': JaNee;
  'folders Kei-Jong (niet Buso)': JaNee;
  'folders Kei-Jong Buso': JaNee;
  'folders zomervakanties De Kei': JaNee;
  opmerkingen: string;
  plaats: string;
  postcode: string;
  'raad van bestuur De Kei': JaNee;
  'raad van bestuur De Kei (editable)': JaNee;
  'raad van bestuur Kei-Jong': JaNee;
  TAV: string;
  telefoon: string;
}
