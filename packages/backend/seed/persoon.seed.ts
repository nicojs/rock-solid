import db from '@prisma/client';
import fs from 'fs/promises';
import { ImportErrors, notEmpty } from './import-errors.js';

const ONBEKENDE_PLAATS_ID = 1; // 1 = "onbekend"

interface RawDeelnemer {
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

const adresRegex = /^(\D+)\s*(\d+)\s?(:?bus)?\s?(.*)?$/;
const importErrors = new ImportErrors<RawDeelnemer>();

export async function seedPersonen(client: db.PrismaClient) {
  const deelnemersRaw: RawDeelnemer[] = JSON.parse(
    await fs.readFile(
      new URL('../../import/deelnemers.json', import.meta.url),
      'utf-8',
    ),
  );

  const plaatsIdByPostcode = new Map<string, number>(
    (
      await client.plaats.findMany({
        select: { postcode: true, id: true },
      })
    ).map(({ postcode, id }) => [postcode, id] as const),
  );

  const deelnemers = deelnemersRaw.map(fromRaw).filter(notEmpty);

  for (const deelnemer of deelnemers) {
    await client.persoon.create({
      data: deelnemer,
    });
  }

  console.log(`Seeded ${deelnemers.length} deelnemers`);
  console.log(`(${importErrors.report})`);
  fs.writeFile(
    new URL('../../import/deelnemers-import-errors.json', import.meta.url),
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
    const verblijfadres: db.Prisma.AdresCreateNestedOneWithoutVerblijfpersoonInput =
      adresFromRaw(raw, raw.adres, raw.postcode) ?? {
        create: {
          huisnummer: '',
          plaatsId: ONBEKENDE_PLAATS_ID,
          straatnaam: '',
        },
      };
    const domicilieadres = adresFromRaw(
      raw,
      raw['adres domicilie'],
      raw['postnummer domicilie'],
    );
    return {
      achternaam: raw.achternaam,
      voornaam: raw.naam,
      volledigeNaam,
      emailadres: raw['e-mail'],
      geboortedatum: new Date(jaar ?? 0, (maand ?? 1) - 1, dag),
      verblijfadres,
      domicilieadres,
      geslacht:
        raw.geslacht === 'man'
          ? db.Geslacht.man
          : raw.geslacht === 'vrouw'
          ? db.Geslacht.vrouw
          : db.Geslacht.onbekend,
      geboorteplaats: raw.geboorteplaats,
      gsmNummer: raw.GSM,
      rijksregisternummer: raw.rijksregisternummer,
      woonsituatieOpmerking: stringFromRaw(raw.woonsituatie),
      werksituatieOpmerking: stringFromRaw(raw.werksituatie),
      telefoonnummer: raw.telefoon,
      type: 'deelnemer',
    };
  }

  function stringFromRaw(str: string) {
    return str === '' ? undefined : str;
  }

  function adresFromRaw(
    raw: RawDeelnemer,
    adres: string,
    postcode: string,
  ): undefined | db.Prisma.AdresCreateNestedOneWithoutVerblijfpersoonInput {
    if (!adres.length) {
      return undefined;
    }
    const adresMatch = adresRegex.exec(adres);

    if (!adresMatch) {
      importErrors.addWarning('adres_parse_error', {
        item: raw,
        detail: `Adres "${adres}" doesn\'t match pattern`,
      });
      return;
    }
    const [, straatnaam, huisnummer, busnummer] = adresMatch as unknown as [
      string,
      string,
      string,
      string | undefined,
    ];
    let plaatsId = plaatsIdByPostcode.get(postcode);
    if (plaatsId === undefined) {
      importErrors.addWarning('postcode_doesnt_exist', {
        detail: `Cannot find postcode "${raw.postcode}", using onbekend`,
        item: raw,
      });
      plaatsId = ONBEKENDE_PLAATS_ID;
    }
    return {
      create: {
        huisnummer,
        straatnaam,
        busnummer,
        plaats: { connect: { id: plaatsId } },
      },
    };
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
