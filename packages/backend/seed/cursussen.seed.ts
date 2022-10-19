import * as db from '@prisma/client';
import { ImportErrors, notEmpty } from './import-errors.js';
import { readImportJson, writeOutputJson } from './seed-utils.js';

interface RawCursus {
  titel: string;
  'aantal uren': string;
  cursusbijdrage: string;
  cursusnaam: string;
  data: string;
  'De Kei': string;
  Digistap: string;
  jaar: string;
  'Kei-Jong (niet BUSO)': string;
  'Kei-Jong BUSO': string;
  locaties: string;
  logiesbijdrage: string;
  opmerkingen: string;
  prijs: string;
  schooljaar: string;
}

const importErrors = new ImportErrors<RawCursus>();
// can parse these things:
// DK/21/882 - Online Digitaal ontmoeten
// DK/22/090-2 - Goed in je vel
// DK/22/090
// DK/22/090-3
const projectnummerRegex = /([^ -]*)(?:-([^ -]*))?.*$/;

export async function seedCursussen(client: db.PrismaClient) {
  const projectsByCode = new Map<string, db.Prisma.ProjectCreateInput>();
  const cursussenRaw = await readImportJson<RawCursus[]>('cursussen.json');

  const cursussen = cursussenRaw.map(fromRaw).filter(notEmpty);

  for (const cursus of cursussen) {
    await client.project.create({
      data: cursus,
    });
  }

  console.log(`Seeded ${cursussen.length} cursussen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson('cursussen-import-errors.json', importErrors);
  function fromRaw(raw: RawCursus): db.Prisma.ProjectCreateInput | undefined {
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
    const preExistingProject = projectsByCode.get(projectnummer);
    if (preExistingProject) {
      if (iteration) {
        // Second activity
        (
          preExistingProject.activiteiten!.createMany!
            .data as db.Prisma.ActiviteitCreateManyProjectInput[]
        ).push(...activiteitenFromRaw(raw));
      } else {
        importErrors.addError('project_nummer_exists', {
          item: raw,
          detail: `Project nummer ${projectnummer} already exists`,
        });
      }
      return;
    }
    const organisatieonderdeel = organisatieOnderdeelFromRaw(raw);
    const project: db.Prisma.ProjectCreateInput = {
      naam: raw.cursusnaam,
      projectnummer,
      type: 'cursus',
      jaar: parseInt(raw.jaar),
      organisatieonderdeel,
      activiteiten: {
        createMany: {
          data: activiteitenFromRaw(raw),
        },
      },
    };
    projectsByCode.set(projectnummer, project);
    return project;
  }

  function organisatieOnderdeelFromRaw(
    raw: RawCursus,
  ): db.Organisatieonderdeel | undefined {
    const deKei = raw['De Kei'] === 'Ja';
    const digistap = raw.Digistap === 'Ja';
    const keiJongBuso = raw['Kei-Jong BUSO'] === 'Ja';
    const keiJongNietBuso = raw['Kei-Jong (niet BUSO)'] === 'Ja';

    let count = 0;
    if (deKei) count++;
    if (digistap) count++;
    if (keiJongBuso) count++;
    if (keiJongNietBuso) count++;

    if (count > 1) {
      return undefined;
    }
    return deKei
      ? 'deKei'
      : keiJongBuso
      ? 'keiJongBuSO'
      : keiJongNietBuso
      ? 'keiJongNietBuSO'
      : undefined;
  }

  function activiteitenFromRaw(
    raw: RawCursus,
  ): db.Prisma.ActiviteitCreateManyProjectInput[] {
    if (raw.data) {
      return raw.data
        .split(',')
        .map((range) => range.trim())
        .map((range) => {
          const [van, totEnMet] = range.split(' tot ').map((str) => {
            const [jaar, maand, dag] = str
              .split(' ')[0]!
              .split('-')
              .map((i) => parseInt(i));
            return new Date(jaar ?? 0, (maand ?? 1) - 1, dag);
          }) as [Date, Date];

          return {
            van,
            totEnMet,
          };
        });
    }
    return [];
  }
}
