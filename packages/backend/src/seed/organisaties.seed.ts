/* eslint-disable @typescript-eslint/no-unused-vars */
import * as db from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportErrors } from './import-errors.js';
import {
  groupBy,
  pickNotEmpty,
  readImportJson,
  stringFromRaw,
  writeOutputJson,
} from './seed-utils.js';
import { Foldersoort } from '@rock-solid/shared';
import {
  communicatievoorkeurMapper,
  foldersoortMapper,
} from '../services/enum.mapper.js';

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

type CreateOrgInput = Omit<db.Prisma.OrganisatieCreateInput, 'contacten'> & {
  contacten: {
    create: db.Prisma.OrganisatieContactCreateWithoutOrganisatieInput[];
  };
};

export async function seedOrganisaties(
  client: db.PrismaClient,
  readonly: boolean,
) {
  const organisatiesRaw =
    await readImportJson<RawOrganisatie[]>('organisaties.json');

  const importErrors = new ImportErrors<RawOrganisatie>();

  const adresSeeder = new AdresSeeder(client, importErrors);
  await adresSeeder.init();

  const orgsByName = organisatiesRaw
    .map(fromRaw)
    .reduce(...groupBy<CreateOrgInput>((org) => org.naam.toLocaleLowerCase()));

  const orgs = [...orgsByName.values()].map((orgs) => {
    if (orgs.length === 1) {
      return orgs[0]!;
    }
    importErrors.addWarning('duplicate_contact', {
      // @ts-expect-error Don't have origin here
      item: {},
      detail: `Merging duplicate organisatie ${orgs
        .map(({ naam }) => `"${naam}"`)
        .join(', ')}`,
    });
    const org = orgs[0]!;

    // Pick the useful information
    org.website = pickNotEmpty(orgs, 'website');
    org.contacten.create = orgs.flatMap((org) => org.contacten.create);
    return org;
  });

  for (const org of orgs) {
    await client.organisatie.create({ data: org });
  }

  console.log(`Seeded ${orgs.length} organisaties`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'organisatie-import-errors.json',
    importErrors,
    readonly,
  );

  function fromRaw(raw: RawOrganisatie): CreateOrgInput {
    const adres = adresSeeder.fromRaw(raw, raw.adres, raw.postcode);
    return {
      naam: raw.Naam,
      website: fromRawWebsite(raw.website),
      contacten: {
        create: [
          {
            terAttentieVan: raw.TAV,
            adres,
            telefoonnummer: stringFromRaw(raw.telefoon),
            emailadres: stringFromRaw(raw['e-mail']),
            opmerking: stringFromRaw(raw.opmerkingen),
            foldervoorkeuren: {
              create: foldervoorkeurenFromRaw(raw),
            },
          },
        ],
      },
    };
  }

  function fromRawWebsite(website: string): string | undefined {
    if (website) {
      if (website.startsWith('http://') || website.startsWith('https://')) {
        return website;
      } else {
        return `https://${website}`;
      }
    }
    return undefined;
  }

  function foldervoorkeurenFromRaw(
    raw: RawOrganisatie,
  ): db.Prisma.FoldervoorkeurUncheckedCreateWithoutOrganisatieContactInput[] {
    const voorkeuren: db.Prisma.FoldervoorkeurUncheckedCreateWithoutOrganisatieContactInput[] =
      [];
    addIfJa('folders Kei-Jong (niet Buso)', 'keiJongNietBuso');
    addIfJa('folders Kei-Jong Buso', 'keiJongBuso');
    addIfJa('folders cursussen De Kei', 'deKeiCursussen');
    addIfJa('folders wintervakanties De Kei', 'deKeiWintervakantie');
    addIfJa('folders zomervakanties De Kei', 'deKeiZomervakantie');
    return voorkeuren;

    function addIfJa<Key extends keyof RawOrganisatie & `folders ${string}`>(
      prop: Key,
      folder: Foldersoort,
    ) {
      if (raw[prop] === 'ja') {
        voorkeuren.push({
          communicatie: communicatievoorkeurMapper.toDB(
            raw['mailing op e-mail'] ? 'email' : 'post',
          ),
          folder: foldersoortMapper.toDB(folder),
        });
      }
    }
  }
}
