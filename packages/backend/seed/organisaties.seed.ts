import * as db from '@prisma/client';
import fs from 'fs/promises';
import { ImportErrors, notEmpty } from './import-errors.js';

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
const adresRegex = /^(\D+)\s*(\d+)\s?(:?bus)?\s?(.*)?$/;
const [from, to] = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

export async function seedOrganisaties(client: db.PrismaClient) {
  const organisatiesRaw: RawOrganisatie[] = JSON.parse(
    await fs.readFile(
      new URL('../../import/organisaties.json', import.meta.url),
      'utf-8',
    ),
  );

  const names = new Set<string>();
  const duplicateNames = new Set<string>();
  for (const org of organisatiesRaw) {
    let name = org.Naam;
    let i = 1;
    while (names.has(name)) {
      if (!duplicateNames.has(org.Naam)) {
        console.log('Duplicate org name', org.Naam);
        duplicateNames.add(org.Naam);
      }
      name = `${org.Naam}_${++i}`;
    }
    org.Naam = name;
    names.add(name);
  }

  const importErrors = new ImportErrors<RawOrganisatie>();

  const plaatsIdByPostcode = new Map<string, number>(
    (
      await client.plaats.findMany({
        select: { postcode: true, id: true },
      })
    ).map(({ postcode, id }) => [postcode, id] as const),
  );

  const orgs = organisatiesRaw.map(fromRaw).filter(notEmpty);

  for (const org of orgs) {
    await client.organisatie.create({ data: org });
  }

  console.log(`Seeded ${orgs.length} organisaties`);
  console.log(`(${importErrors.report})`);
  fs.writeFile(
    new URL('../../import/organisatie-import-errors.json', import.meta.url),
    JSON.stringify(importErrors, null, 2),
    'utf-8',
  );

  function fromRaw(
    raw: RawOrganisatie,
  ): db.Prisma.OrganisatieCreateInput | undefined {
    let adres:
      | db.Prisma.AdresCreateNestedOneWithoutOrganisatieInput
      | undefined = undefined;
    if (raw.adres) {
      const adresMatch = adresRegex.exec(raw.adres);
      if (!adresMatch) {
        importErrors.addError('adres_parse_error', {
          item: raw,
          detail: `Adres is empty doesn\'t match pattern`,
        });
      }
      const postcode = postcodeFromRaw(raw.postcode);
      const plaatsId = plaatsIdByPostcode.get(postcode);
      if (!plaatsId) {
        importErrors.addError('postcode_doesnt_exist', {
          detail: `Cannot find postcode "${raw.postcode}"`,
          item: raw,
        });
      } else {
        const [, straatnaam, huisnummer, busnummer] = adresMatch as unknown as [
          string,
          string,
          string,
          string | undefined,
        ];
        adres = {
          create: {
            straatnaam: straatnaam.trim(),
            huisnummer,
            busnummer,
            plaats: { connect: { id: plaatsId } },
          },
        };
      }
    }

    return {
      doelgroep: 'deKei',
      naam: raw.Naam,
      terAttentieVan: raw.TAV,
      adres,
      communicatieVoorkeur: raw['mailing op e-mail'] ? 'email' : 'post',
      emailadres: raw['e-mail'],
      opmerking: raw.opmerkingen,
      website: fromRawWebsite(raw.website),
      telefoonnummer: raw.telefoon,
      folderVoorkeur: folderVoorkeurFromRaw(raw),
      soorten: [],
    };
  }

  function postcodeFromRaw(raw: string): string {
    return [...raw]
      .filter((char) => {
        const charCode = char.charCodeAt(0);
        return charCode >= from && charCode <= to;
      })
      .join('');
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
