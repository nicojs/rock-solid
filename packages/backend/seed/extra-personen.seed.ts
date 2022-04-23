import db from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportErrors } from './import-errors.js';
import {
  readImportJson,
  stringFromRaw,
  writeOutputJson,
} from './seed-utils.js';

type JaNee = 'ja' | 'nee';

interface RawExtraPersoon {
  titel: string;
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

export async function seedExtraPersonen(client: db.PrismaClient) {
  const importErrors = new ImportErrors<RawExtraPersoon>();
  const extraPersonenRaw = await readImportJson<RawExtraPersoon[]>(
    'extra-personen.json',
  );

  const adresSeeder = new AdresSeeder(client, importErrors);
  await adresSeeder.init();

  const extraPersonen = extraPersonenRaw.map(fromRaw);

  for (const extraPersoon of extraPersonen) {
    await client.persoon.create({
      data: extraPersoon,
    });
  }
  console.log(`Seeded ${extraPersonen.length} extra-personen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson('extra-personen-import-errors.json', importErrors);

  function fromRaw(raw: RawExtraPersoon): db.Prisma.PersoonCreateInput {
    const volledigeNaam = raw.titel;
    const [voornaam, ...achternaamParts] = volledigeNaam.split(' ');
    const achternaam = achternaamParts.join(' ');
    const verblijfadres: db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput =
      adresSeeder.fromRawOrOnbekend(raw, raw.adres, raw.postcode);
    return {
      achternaam,
      voornaam,
      volledigeNaam,
      emailadres: raw['e-mail'],
      verblijfadres,
      telefoonnummer: stringFromRaw(raw.telefoon),
      type: 'overigPersoon',
      selectie: selectieFromRaw(raw),
      foldervoorkeuren: foldervoorkeurenFromRaw(raw),
      opmerking: stringFromRaw(raw.opmerkingen),
    };
  }
}

function selectieFromRaw(raw: RawExtraPersoon): db.OverigPersoonSelectie[] {
  const totalSelectie: db.OverigPersoonSelectie[] = [];
  function addIfJa(val: JaNee, selectie: db.OverigPersoonSelectie) {
    if (val === 'ja') {
      totalSelectie.push(selectie);
    }
  }
  addIfJa(
    raw['algemene vergadering De Bedding'],
    'algemeneVergaderingDeBedding',
  );
  addIfJa(raw['algemene vergadering De Kei'], 'algemeneVergaderingDeKei');
  addIfJa(raw['algemene vergadering Kei-Jong'], 'algemeneVergaderingKeiJong');
  addIfJa(raw['raad van bestuur De Kei'], 'raadVanBestuurDeKei');
  addIfJa(raw['raad van bestuur Kei-Jong'], 'raadVanBestuurKeiJong');
  return totalSelectie;
}

function foldervoorkeurenFromRaw(
  raw: RawExtraPersoon,
): db.Prisma.FoldervoorkeurCreateNestedManyWithoutPersoonInput {
  const voorkeuren: db.Prisma.FoldervoorkeurCreateManyPersoonInput[] = [];
  function addIfJa(val: JaNee, folder: db.Foldersoort) {
    if (val === 'ja') {
      voorkeuren.push({ communicatie: 'post', folder });
    }
  }
  addIfJa(raw['folders Kei-Jong (niet Buso)'], 'keiJongNietBuso');
  addIfJa(raw['folders Kei-Jong Buso'], 'keiJongBuso');
  addIfJa(raw['folders cursussen De Kei'], 'deKeiCursussen');
  addIfJa(raw['folders zomervakanties De Kei'], 'deKeiZomervakanties');
  return { createMany: { data: voorkeuren } };
}
