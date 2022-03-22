import * as db from '@prisma/client';
import { Adres } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

interface RawDeelnemer {
  achternaam: string;
  naam: string;
  adres: string;
  postcode: string;
  gemeente: string;
  geboortedatum: string;
  'e-mail': string;
  opmerkingen: string;
  'laatste deelname': string;
  instelling: string;
}

interface ImportError {
  deelnemer: RawDeelnemer;
  detail: string;
}

class ImportErrors {
  errorsByCategory = new Map<string, ImportError[]>();
  private _length = 0;
  add(category: string, error: ImportError) {
    const errors = this.errorsByCategory.get(category) ?? [];
    this.errorsByCategory.set(category, errors);
    errors.push(error);
    this._length++;
  }

  get length() {
    return this._length;
  }

  toJSON() {
    return Object.fromEntries(this.errorsByCategory.entries());
  }
}

const adresRegex = /^(\D+)\s*(\d+)\s?(:?bus)?\s?(.*)?$/;
const importErrors = new ImportErrors();

function notEmpty<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined;
}

export async function seedPersonen(client: db.PrismaClient) {
  const deelnemersRaw: RawDeelnemer[] = JSON.parse(
    await fs.readFile(
      path.resolve(__dirname, '../../../../import/json/deelnemers.json'),
      'utf-8',
    ),
  );

  const postcodes = new Set(
    (
      await client.plaats.findMany({
        select: { postcode: true },
      })
    ).map(({ postcode }) => postcode),
  );
  const deelnemers = deelnemersRaw.map(fromRaw).filter(notEmpty);

  for (const deelnemer of deelnemers) {
    await client.persoon.create({
      data: deelnemer,
    });
  }

  console.log(`Seeded ${deelnemers.length} deelnemers`);
  console.log(`(${importErrors.length} errors)`);
  fs.writeFile(
    path.resolve(__dirname, '../../../../import/deelnemers-import-errors.json'),
    JSON.stringify(importErrors, null, 2),
    'utf-8',
  );

  function fromRaw(
    raw: RawDeelnemer,
  ): db.Prisma.PersoonCreateInput | undefined {
    const volledigeNaam = `${raw.naam} ${raw.achternaam}`;
    const [dag, maand, jaar] = raw.geboortedatum
      .split('-')
      .map((i) => parseInt(i));
    const adresMatch = adresRegex.exec(raw.adres);

    if (!adresMatch) {
      importErrors.add('adres_parse_error', {
        deelnemer: raw,
        detail: `Adres is empty doesn\'t match pattern`,
      });
    } else {
      const [, straatnaam, huisnummer, busnummer] = adresMatch as unknown as [
        string,
        string,
        string,
        string | undefined,
      ];
      if (!postcodes.has(raw.postcode)) {
        importErrors.add('postcode_doesnt_exist', {
          detail: `Cannot find postcode "${raw.postcode}"`,
          deelnemer: raw,
        });
      } else {
        return {
          achternaam: raw.achternaam,
          voornaam: raw.naam,
          volledigeNaam,
          emailadres: raw['e-mail'],
          geboortedatum: new Date(jaar ?? 0, (maand ?? 1) - 1, dag),
          adres: {
            create: {
              straatnaam,
              huisnummer,
              busnummer,
              plaats: {
                connect: {
                  postcode: raw.postcode,
                },
              },
            },
          },
        };
      }
    }
    return;
  }
}

export async function seedFakePersonen(client: db.PrismaClient) {
  const adressen: Adres[] = [];

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
        adresId: adressen[index % adressen.length]!.id,
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
        adresId: adressen[index % adressen.length]!.id,
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
