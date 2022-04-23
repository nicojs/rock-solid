import db from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportErrors } from './import-errors.js';
import {
  readImportJson,
  stringFromRaw,
  writeOutputJson,
} from './seed-utils.js';

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

export async function seedVrijwilligers(client: db.PrismaClient) {
  const importErrors = new ImportErrors<RawVrijwilliger>();
  const vrijwilligersRaw = await readImportJson<RawVrijwilliger[]>(
    'vrijwilligers.json',
  );

  const adresSeeder = new AdresSeeder(client, importErrors);
  await adresSeeder.init();

  const vrijwilligers = vrijwilligersRaw.map(fromRaw);

  for (const vrijwilliger of vrijwilligers) {
    await client.persoon.create({
      data: vrijwilliger,
    });
  }
  console.log(`Seeded ${vrijwilligers.length} vrijwilligers`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson('vrijwilligers-import-errors.json', importErrors);

  function fromRaw(raw: RawVrijwilliger): db.Prisma.PersoonCreateInput {
    const volledigeNaam = `${raw.naam} ${raw.achternaam}`;
    const [dag, maand, jaar] = raw.geboortedatum
      .split('-')
      .map((i) => parseInt(i));
    const verblijfadres: db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput =
      adresSeeder.fromRawOrOnbekend(raw, raw.adres, raw.postcode);
    return {
      achternaam: raw.achternaam,
      voornaam: raw.naam,
      volledigeNaam,
      emailadres: raw['e-mail'],
      geboortedatum: new Date(jaar ?? 0, (maand ?? 1) - 1, dag),
      verblijfadres,
      gsmNummer: stringFromRaw(raw.GSM),
      telefoonnummer: stringFromRaw(raw.telefoon),
      type: 'overigPersoon',
      foldervoorkeuren,
      selectie: ['vakantieVrijwilliger'],
      opmerking: stringFromRaw(raw.opmerkingen),
    };
  }
}

/**
 * This is my best guess for foldervoorkeuren for a vrijwilliger 🤷‍♀️
 */
const foldervoorkeuren: db.Prisma.FoldervoorkeurCreateNestedManyWithoutPersoonInput =
  {
    createMany: {
      data: [
        { communicatie: 'email', folder: 'deKeiWintervakanties' },
        { communicatie: 'email', folder: 'deKeiZomervakanties' },
      ],
    },
  };
