import * as db from '@prisma/client';
import { Organisatie } from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportErrors, notEmpty } from './import-errors.js';
import {
  groupBy,
  pickNotEmpty,
  readImportJson,
  writeOutputJson,
} from './seed-utils.js';

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

export async function seedOrganisaties(client: db.PrismaClient) {
  const organisatiesRaw = await readImportJson<RawOrganisatie[]>(
    'organisaties.json',
  );

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

  orgs.forEach((org) => {
    const contactenByTav = org.contacten.create.reduce(
      ...groupBy<db.Prisma.OrganisatieContactCreateWithoutOrganisatieInput>(
        (contact) => contact.terAttentieVan.toLocaleLowerCase(),
      ),
    );

    org.contacten.create = [...contactenByTav.values()].map((contacten) => {
      if (contacten.length === 1) {
        return contacten[0]!;
      }
      importErrors.addWarning('duplicate_contact', {
        // @ts-expect-error Don't have origin here
        item: {},
        detail: `Merging duplicate contacts ${contacten
          .map(({ terAttentieVan }) => `"${terAttentieVan}"`)
          .join(', ')}`,
      });
      const contact = contacten[0]!;

      // Pick the useful information
      contact.emailadres = pickNotEmpty(contacten, 'emailadres');
      contact.adres = pickNotEmpty(contacten, 'adres');
      contact.telefoonnummer = pickNotEmpty(contacten, 'telefoonnummer');
      contact.opmerking = contacten
        .map(({ opmerking }) => opmerking)
        .filter(Boolean)
        .join(', ');

      return contact;
    });
  });

  for (const org of orgs) {
    await client.organisatie.create({ data: org });
  }

  console.log(`Seeded ${orgs.length} organisaties`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson('organisatie-import-errors.json', importErrors);

  function fromRaw(raw: RawOrganisatie): CreateOrgInput {
    const adres = adresSeeder.fromRaw(raw, raw.adres, raw.postcode);
    return {
      doelgroep: 'deKei',
      naam: raw.Naam,
      website: fromRawWebsite(raw.website),
      soorten: [],
      contacten: {
        create: [
          {
            terAttentieVan: raw.TAV,
            adres,
            telefoonnummer: raw.telefoon,
            communicatieVoorkeur: raw['mailing op e-mail'] ? 'email' : 'post',
            emailadres: raw['e-mail'],
            opmerking: raw.opmerkingen,
            folderVoorkeur: folderVoorkeurFromRaw(raw),
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

  function folderVoorkeurFromRaw(raw: RawOrganisatie): db.FolderSelectie[] {
    const result: db.FolderSelectie[] = [];
    addIfJa('folders Kei-Jong (niet Buso)', 'KeiJongNietBuso');
    addIfJa('folders Kei-Jong Buso', 'KeiJongBuso');
    addIfJa('folders cursussen De Kei', 'deKeiCursussen');
    addIfJa('folders wintervakanties De Kei', 'deKeiWintervakanties');
    addIfJa('folders zomervakanties De Kei', 'deKeiZomervakanties');
    return result;

    function addIfJa<Key extends keyof RawOrganisatie & `folders ${string}`>(
      prop: Key,
      selectie: db.FolderSelectie,
    ) {
      if (raw[prop] === 'ja') {
        result.push(selectie);
      }
    }
  }
}
