import db from '@prisma/client';
import { AdresSeeder } from './adres-seeder.js';
import { ImportErrors } from './import-errors.js';
import {
  datumFromRaw,
  readImportJson,
  stringFromRaw,
  writeOutputJson,
} from './seed-utils.js';

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

export async function seedDeelnemers(
  client: db.PrismaClient,
  readonly: boolean,
) {
  const importErrors = new ImportErrors<RawDeelnemer>();
  const deelnemersRaw = await readImportJson<RawDeelnemer[]>('deelnemers.json');

  const adresSeeder = new AdresSeeder(client, importErrors);
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
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'deelnemers-import-errors.json',
    importErrors,
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
    return [
      raw[''],
      {
        achternaam: raw.achternaam,
        voornaam: raw.naam || undefined,
        volledigeNaam,
        emailadres: stringFromRaw(raw['e-mail']),
        geboortedatum: datumFromRaw(raw.geboortedatum),
        verblijfadres,
        domicilieadres,
        geslacht:
          raw.geslacht === 'man'
            ? db.Geslacht.man
            : raw.geslacht === 'vrouw'
            ? db.Geslacht.vrouw
            : db.Geslacht.onbekend,
        geboorteplaats: stringFromRaw(raw.geboorteplaats),
        gsmNummer: stringFromRaw(raw.GSM),
        rijksregisternummer: stringFromRaw(raw.rijksregisternummer),
        woonsituatieOpmerking: stringFromRaw(raw.woonsituatie),
        werksituatieOpmerking: stringFromRaw(raw.werksituatie),
        telefoonnummer: stringFromRaw(raw.telefoon),
        opmerking: stringFromRaw(raw.opmerkingen),
        type: 'deelnemer',
      },
    ];
  }
}

export async function seedFakePersonen(client: db.PrismaClient) {
  const adressen: db.Adres[] = [];

  const plaatsenCount = await client.plaats.count();

  for (let i = 0; i < 100; i++) {
    for (const straatnaam of fakeStraatnamen) {
      adressen.push(
        await client.adres.create({
          data: {
            huisnummer: Math.floor(Math.random() * 123).toString(),
            straatnaam,
            plaats: {
              connect: { id: Math.floor(Math.random() * plaatsenCount) },
            },
          },
        }),
      );
    }
  }

  await client.persoon.createMany({
    data: fakeManVoornamen.map((voornaam, index) => {
      const achternaam = fakeAchternamen[index % fakeAchternamen.length]!;
      return {
        achternaam,
        voornaam,
        volledigeNaam: `${voornaam} ${achternaam}`,
        geslacht: 'man' as const,
        verblijfadresId: adressen[index % adressen.length]!.id,
      };
    }),
  });
  await client.persoon.createMany({
    data: fakeVrouwVoornamen.map((voornaam, index) => {
      const achternaam = fakeAchternamen[index % fakeAchternamen.length]!;
      return {
        achternaam,
        voornaam,
        volledigeNaam: `${voornaam} ${achternaam}`,
        geslacht: 'man' as const,
        verblijfadresId: adressen[index % adressen.length]!.id,
      };
    }),
  });
  console.log(
    `Seeded ${fakeManVoornamen.length + fakeVrouwVoornamen.length} deelnemers`,
  );
}

const fakeManVoornamen = [
  'Noah',
  'Sem',
  'Liam',
  'Lucas',
  'Daan',
  'Finn',
  'Levi',
  'Luuk',
  'Mees',
  'James',
  'Milan',
  'Sam',
  'Noud',
  'Luca',
  'Benjamin',
  'Bram',
  'Mason',
  'Max',
  'Thomas',
  'Adam',
  'Jesse',
  'Hugo',
  'Boaz',
  'Olivier',
  'Teun',
  'Julian',
  'Lars',
  'Gijs',
  'Thijs',
  'Siem',
  'Guus',
  'Mats',
  'Zayn',
  'Otis',
  'Jens',
  'Jack',
  'Floris',
  'Ties',
  'Vince',
  'Joep',
  'David',
  'Stijn',
  'Jan',
  'Sven',
  'Dex',
  'Jurre',
  'Morris',
  'Quinn',
  'Ruben',
  'Owen',
  'Jayden',
  'Mohammed',
  'Tobias',
  'Moos',
  'Robin',
  'Jace',
  'Tijn',
  'Tim',
  'Abel',
  'Willem',
  'Oliver',
  'Cas',
  'Fedde',
  'Ryan',
  'Roan',
  'Jaxx',
  'Xavi',
  'Daniël',
  'Alexander',
  'Dean',
  'Dani',
  'Ezra',
  'Jake',
  'Jip',
  'Sepp',
  'Mohamed',
  'Pepijn',
  'Tom',
  'Jason',
  'Aiden',
  'Jax',
  'Pim',
  'Kai',
  'Nathan',
  'Rayan',
  'Melle',
  'Oscar',
  'Elias',
  'Mick',
  'Boris',
  'Senn',
  'Samuel',
  'Lenn',
  'Hidde',
  'Amir',
  'Johannes',
  'Riley',
  'Job',
  'Joshua',
  'Niek',
];
const fakeVrouwVoornamen = [
  'Emma',
  'Julia',
  'Mila',
  'Tess',
  'Sophie',
  'Zoë',
  'Sara',
  'Nora',
  'Yara',
  'Eva',
  'Liv',
  'Lotte',
  'Evi',
  'Noor',
  'Anna',
  'Milou',
  'Olivia',
  'Saar',
  'Lauren',
  'Nina',
  'Lieke',
  'Fleur',
  'Lynn',
  'Sofie',
  'Elin',
  'Fien',
  'Nova',
  'Sarah',
  'Maud',
  'Lina',
  'Mia',
  'Loïs',
  'Sofia',
  'Emily',
  'Roos',
  'Fenna',
  'Ella',
  'Isa',
  'Hailey',
  'Luna',
  'Hannah',
  'Julie',
  'Noa',
  'Elena',
  'Sophia',
  'Bo',
  'Suze',
  'Lara',
  'Maria',
  'Jasmijn',
  'Lena',
  'Esmee',
  'Cato',
  'Amy',
  'Vera',
  'Lisa',
  'Liz',
  'Juul',
  'Floor',
  'Hanna',
  'Norah',
  'Rosa',
  'Noé',
  'Ivy',
  'Charlotte',
  'Isabella',
  'Amber',
  'Feline',
  'Elise',
  'Puck',
  'Veerle',
  'Lizzy',
  'Lize',
  'Linde',
  'Livia',
  'Naomi',
  'Rosie',
  'Charlie',
  'Merel',
  'Isabel',
  'Liva',
  'Fenne',
  'Anne',
  'Maeve',
  'Kiki',
  'Jill',
  'Amira',
  'Benthe',
  'Iris',
  'Romy',
  'Romée',
  'Eline',
  'Sanne',
  'Tessa',
  'Fiene',
  'Lola',
  'Loua',
  'Femke',
  'Nola',
  'Fay',
];
const fakeAchternamen = [
  'de Jong',
  'Jansen',
  'de Vries',
  'van den Berg',
  'van Dijk',
  'Bakker',
  'Janssen',
  'Visser',
  'Smit',
  'Meijer',
  'de Boer',
  'Mulder',
  'de Groot',
  'Bos',
  'Vos',
  'Peters',
  'Hendriks',
  'van Leeuwen',
  'Dekker',
  'Brouwer',
  'de Wit',
  'Dijkstra',
  'Smits',
  'de Graaf',
  'van der Meer',
  'van der Linden',
  'Kok',
  'Jacobs',
  'de Haan',
  'Vermeulen',
  'van den Heuvel',
  'van der Veen',
  'van den Broek',
  'de Bruijn',
  'de Bruin',
  'van der Heijden',
  'Schouten',
  'van Beek',
  'Willems',
  'van Vliet',
  'van de Ven',
  'Hoekstra',
  'Maas',
  'Verhoeven',
  'Koster',
  'van Dam',
  'van der Wal',
  'Prins',
  'Blom',
  'Huisman',
  'Peeters',
  'de Jonge',
  'Kuipers',
  'van Veen',
  'Post',
  'Kuiper',
  'Veenstra',
  'Kramer',
  'van den Brink',
  'Scholten',
  'van Wijk',
  'Postma',
  'Martens',
  'Vink',
  'de Ruiter',
  'Timmermans',
  'Groen',
  'Gerritsen',
  'Jonker',
  'van Loon',
  'Boer',
  'van der Velde',
  'Willemsen',
  'Smeets',
  'de Lange',
  'de Vos',
  'Bosch',
  'van Dongen',
  'Schipper',
  'de Koning',
  'van der Laan',
  'Koning',
  'van der Velden',
  'Driessen',
  'van Doorn',
  'Hermans',
  'Evers',
  'van den Bosch',
  'van der Meulen',
  'Hofman',
  'Bosman',
  'Wolters',
  'Sanders',
  'van der Horst',
  'Mol',
  'Kuijpers',
  'Molenaar',
  'van de Pol',
  'de Leeuw',
  'Verbeek',
];

const fakeStraatnamen = ['Veldstraat', 'Loverslane', 'Steenweg', 'Fakestreet'];
