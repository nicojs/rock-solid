import db from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportDiagnostics } from './import-errors.js';
import {
  datumFromRaw,
  readImportJson,
  stringFromRaw,
  writeOutputJson,
} from './seed-utils.js';
import { Geslacht, calculateAge } from '@rock-solid/shared';
import {
  communicatievoorkeurMapper,
  foldersoortMapper,
  geslachtMapper,
  persoonTypeMapper,
} from '../services/enum.mapper.js';

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
  vakanties: string;
  'volwassen minderjarig': string;
  werksituatie: string;
  woonsituatie: string;
}
const rawGeslachten = Object.freeze(['man', 'vrouw']);

export async function seedDeelnemers(
  client: db.PrismaClient,
  readonly: boolean,
) {
  const importDiagnostics = new ImportDiagnostics<RawDeelnemer>();
  const deelnemersRaw = await readImportJson<RawDeelnemer[]>('deelnemers.json');

  // Deelnemers Rita has more up-to-date adres fields
  const deelnemersRitaRaw = await readImportJson<RawDeelnemer[]>(
    'deelnemers-rita.json',
  );
  const deelnemersOverrides = new Map(
    deelnemersRitaRaw.map((d) => [
      d[''],
      { adres: d.adres, postcode: d.postcode },
    ]),
  );
  const deelnemersAdresUpdated: string[] = [];
  for (const deelnemer of deelnemersRaw) {
    const { adres, postcode } = deelnemersOverrides.get(deelnemer[''])!;
    if (deelnemer.adres !== adres || deelnemer.postcode !== postcode) {
      importDiagnostics.addInfo('updatedAdres', {
        item: deelnemer,
        detail: 'Adres geüpdatet na aanpassing excel van Rita',
      });
      deelnemersAdresUpdated.push(deelnemer['']);
      deelnemer.adres = adres;
      deelnemer.postcode = postcode;
    }
  }

  const adresSeeder = new AdresSeeder(client, importDiagnostics);
  await adresSeeder.init();

  const deelnemers = deelnemersRaw.map(fromRaw);
  const persoonIdByTitle = new Map<string, number>();

  for (const [title, deelnemer] of deelnemers) {
    const { id } = await client.persoon.create({
      data: deelnemer,
    });
    persoonIdByTitle.set(title, id);
  }

  await writeOutputJson(
    'deelnemers-lookup.json',
    Object.fromEntries(persoonIdByTitle.entries()),
    readonly,
  );
  console.log(`✅ deelnemers-lookup.json (${persoonIdByTitle.size})`);
  console.log(`Seeded ${deelnemers.length} deelnemers`);
  console.log(`(${importDiagnostics.report})`);
  await writeOutputJson(
    'deelnemers-import-diagnostics.json',
    importDiagnostics,
    readonly,
  );

  return persoonIdByTitle;

  function fromRaw(
    raw: RawDeelnemer,
  ): [title: string, createInput: db.Prisma.PersoonCreateInput] {
    const volledigeNaam = `${raw.naam} ${raw.achternaam}`;
    const verblijfadres = adresSeeder.fromRaw(raw, raw.adres, raw.postcode);
    const domicilieadres = adresSeeder.fromRaw(
      raw,
      raw['adres domicilie'],
      raw['postnummer domicilie'],
    );
    const geboortedatum = datumFromRaw(raw.geboortedatum);
    return [
      raw[''],
      {
        achternaam: raw.achternaam,
        voornaam: raw.naam || undefined,
        volledigeNaam,
        emailadres: stringFromRaw(raw['e-mail']),
        geboortedatum,
        verblijfadres,
        domicilieadres,
        geslacht: rawGeslachten.includes(raw.geslacht)
          ? geslachtMapper.toDB(raw.geslacht as Geslacht)
          : geslachtMapper.toDB(undefined),
        geboorteplaats: stringFromRaw(raw.geboorteplaats),
        gsmNummer: stringFromRaw(raw.GSM),
        begeleidendeDienst: stringFromRaw(raw['Begeleidende dienst']),
        contactpersoon: stringFromRaw(
          raw['contactpersonen cursussen'] || raw['contactpersonen vakanties'],
        ),
        rijksregisternummer: stringFromRaw(raw.rijksregisternummer),
        woonsituatieOpmerking: stringFromRaw(raw.woonsituatie),
        werksituatieOpmerking: stringFromRaw(raw.werksituatie),
        telefoonnummer: stringFromRaw(raw.telefoon),
        opmerking: stringFromRaw(raw.opmerkingen),
        type: persoonTypeMapper.toDB('deelnemer'),
        foldervoorkeuren: {
          create: foldervoorkeurFromRaw(raw, geboortedatum),
        },
      },
    ];
  }
}

const post = communicatievoorkeurMapper.toDB('post');
function foldervoorkeurFromRaw(
  raw: RawDeelnemer,
  geboortedatum: Date | undefined,
): db.Prisma.FoldervoorkeurCreateWithoutPersoonInput | undefined {
  if (raw.cursussen === 'Ja') {
    if (!geboortedatum || calculateAge(geboortedatum) >= 31) {
      return {
        communicatie: post,
        folder: foldersoortMapper.toDB('deKeiCursussen'),
      };
    } else if (raw['Kei-Jong BUSO'] === 'Ja') {
      return {
        communicatie: post,
        folder: foldersoortMapper.toDB('keiJongBuso'),
      };
    } else {
      return {
        communicatie: post,
        folder: foldersoortMapper.toDB('keiJongNietBuso'),
      };
    }
  }
}
