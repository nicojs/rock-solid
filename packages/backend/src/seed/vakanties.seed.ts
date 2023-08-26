import * as db from '@prisma/client';
import { ImportErrors, notEmpty } from './import-errors.js';
import { prijsFromRaw, readImportJson, writeOutputJson } from './seed-utils.js';

type RawVerblijf = 'hotel of pension' | 'vakantiehuis' | 'boot' | '';
type RawVervoer =
  | 'vliegtuig'
  | 'autocar nacht'
  | 'autocar overdag'
  | 'trein'
  | 'minibus'
  | 'boot'
  | '';
interface RawVakantie {
  titel: string;
  bestemming: string;
  jaar: string;
  land: string;
  prijs: string;
  saldo: string;
  seizoen: 'zomer' | 'winter' | '';
  verblijf: RawVerblijf;
  vervoer: RawVervoer;
  vosal: string;
}

const importErrors = new ImportErrors<RawVakantie>();
// can parse these things:
// DK/21/882 - Online Digitaal ontmoeten
// DK/22/090-2 - Goed in je vel
// DK/22/090
// DK/22/090-3
const projectnummerRegex = /([^ -]*)(?:-([^ -]*))?.*$/;

export async function seedVakanties(
  client: db.PrismaClient,
  readonly: boolean,
) {
  const projectsByCode = new Map<string, db.Prisma.ProjectCreateInput>();
  const vakantiesRaw = await readImportJson<RawVakantie[]>('vakanties.json');

  const vakanties = vakantiesRaw.map(fromRaw).filter(notEmpty);

  for (const vakantie of vakanties) {
    await client.project.create({
      data: vakantie,
    });
  }

  console.log(`Seeded ${vakanties.length} vakanties`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson('vakanties-import-errors.json', importErrors, readonly);

  function fromRaw(raw: RawVakantie): db.Prisma.ProjectCreateInput | undefined {
    const projectNummerMatch = projectnummerRegex.exec(raw.titel);
    if (!projectNummerMatch) {
      importErrors.addError('project_nummer_parse', {
        item: raw,
        detail: `Project nummer could not be parsed`,
      });
      return;
    }

    const [, projectnummer, iteration] = projectNummerMatch as unknown as [
      string,
      string,
      string | undefined,
    ];
    if (iteration) {
      throw new Error(`Unexpected project code ${projectNummerMatch[0]}`);
    }
    const project: db.Prisma.ProjectCreateInput = {
      naam: [raw.bestemming, raw.land].filter(Boolean).join(' - '),
      projectnummer,
      type: 'vakantie',
      jaar: parseInt(raw.jaar),
      seizoen: raw.seizoen === 'winter' ? 'winter' : 'zomer',
      organisatieonderdeel: 'deKei',
      saldo: prijsFromRaw(raw.saldo),
      voorschot: prijsFromRaw(raw.vosal),
      bestemming: raw.bestemming,
      land: raw.land,
      activiteiten: {
        createMany: {
          data: activiteitenFromRaw(raw),
        },
      },
    };
    projectsByCode.set(projectnummer, project);
    return project;
  }

  function activiteitenFromRaw(
    raw: RawVakantie,
  ): db.Prisma.ActiviteitCreateManyProjectInput[] {
    if (raw.jaar) {
      const jaar = parseInt(raw.jaar, 10);
      const maand = raw.seizoen === 'winter' ? 0 : 8; // 🤷‍♀️
      return [
        {
          van: new Date(jaar, maand, 1),
          totEnMet: new Date(jaar, maand, 1),
          metOvernachting: true, // 🤷‍♀️
          verblijf: verblijfFromRaw(raw.verblijf),
          vervoer: vervoerFromRaw(raw.vervoer),
        },
      ];
    }
    return [];
  }
}
function verblijfFromRaw(
  verblijf: RawVerblijf,
): db.VakantieVerblijf | undefined {
  switch (verblijf) {
    case 'boot':
      return 'boot';
    case 'hotel of pension':
      return 'hotelOfPension';
    case 'vakantiehuis':
      return 'vakantiehuis';
    case '':
      return;
  }
}
function vervoerFromRaw(vervoer: RawVervoer): db.VakantieVervoer | undefined {
  switch (vervoer) {
    case 'autocar nacht':
      return 'autocarNacht';
    case 'autocar overdag':
      return 'autocarOverdag';
    case 'boot':
      return 'boot';
    case 'minibus':
      return 'minibus';
    case 'trein':
      return 'trein';
    case 'vliegtuig':
      return 'vliegtuig';
    case '':
      return;
  }
}
