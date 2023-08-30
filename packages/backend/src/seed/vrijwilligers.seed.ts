import db from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportErrors } from './import-errors.js';
import {
  datumFromRaw,
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

export async function seedVrijwilligers(
  client: db.PrismaClient,
  readonly: boolean,
) {
  const importErrors = new ImportErrors<RawVrijwilliger>();
  const vrijwilligersRaw = await readImportJson<RawVrijwilliger[]>(
    'vrijwilligers.json',
  );

  const adresSeeder = new AdresSeeder(client, importErrors);
  await adresSeeder.init();

  const vrijwilligers = vrijwilligersRaw.map(fromRaw);
  const persoonIdByTitle = new Map<string, number>();

  for (const [titel, vrijwilliger] of vrijwilligers) {
    const { id } = await client.persoon.create({
      data: vrijwilliger,
    });
    persoonIdByTitle.set(titel, id);
  }
  await writeOutputJson(
    'vrijwilligers-lookup.json',
    Object.fromEntries(persoonIdByTitle.entries()),
    readonly,
  );
  console.log(`✅ vrijwilligers-lookup.json (${persoonIdByTitle.size})`);

  console.log(`Seeded ${vrijwilligers.length} vrijwilligers`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'vrijwilligers-import-errors.json',
    importErrors,
    readonly,
  );
  return persoonIdByTitle;

  function fromRaw(
    raw: RawVrijwilliger,
  ): [title: string, createInput: db.Prisma.PersoonCreateInput] {
    const volledigeNaam = `${raw.naam} ${raw.achternaam}`;
    const verblijfadres = adresSeeder.fromRaw(raw, raw.adres, raw.postcode);
    return [
      raw.titel,
      {
        achternaam: raw.achternaam,
        voornaam: raw.naam,
        volledigeNaam,
        emailadres: raw['e-mail'],
        geboortedatum: datumFromRaw(raw.geboortedatum),
        verblijfadres,
        gsmNummer: stringFromRaw(raw.GSM),
        telefoonnummer: stringFromRaw(raw.telefoon),
        type: 'overigPersoon',
        foldervoorkeuren,
        selectie: ['vakantieVrijwilliger'],
        opmerking: stringFromRaw(raw.opmerkingen),
      },
    ];
  }
}

/**
 * This is my best guess for foldervoorkeuren for a vrijwilliger 🤷‍♀️
 */
const foldervoorkeuren: db.Prisma.FoldervoorkeurCreateNestedManyWithoutPersoonInput =
  {
    createMany: {
      data: [
        { communicatie: 'email', folder: 'deKeiWintervakantie' },
        { communicatie: 'email', folder: 'deKeiZomervakantie' },
      ],
    },
  };
