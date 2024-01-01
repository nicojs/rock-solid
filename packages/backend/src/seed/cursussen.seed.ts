import * as db from '@prisma/client';
import { ImportDiagnostics, notEmpty } from './import-errors.js';
import { prijsFromRaw, readImportJson, writeOutputJson } from './seed-utils.js';
import { toTitel } from '../services/project.mapper.js';
import {
  organisatieonderdeelMapper,
  projectTypeMapper,
} from '../services/enum.mapper.js';

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

const importErrors = new ImportDiagnostics<RawCursus>();
// can parse these things:
// DK/21/882 - Online Digitaal ontmoeten
// DK/22/090-2 - Goed in je vel
// DK/22/090
// DK/22/090-3
const projectnummerRegex = /([^ -]*)(?:-([^ -]*))?.*$/;

export async function seedCursussen(
  client: db.PrismaClient,
  readonly: boolean,
) {
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
  await writeOutputJson(
    'cursussen-import-diagnostics.json',
    importErrors,
    readonly,
  );
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
          preExistingProject.activiteiten!
            .create! as db.Prisma.ActiviteitCreateWithoutProjectInput[]
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
      titel: toTitel(projectnummer, raw.cursusnaam),
      type: projectTypeMapper.toDB('cursus'),
      jaar: parseInt(raw.jaar),
      organisatieonderdeel,
      saldo: prijsFromRaw(raw.prijs),
      activiteiten: {
        create: activiteitenFromRaw(raw),
      },
    };
    projectsByCode.set(projectnummer, project);
    return project;
  }

  function organisatieOnderdeelFromRaw(raw: RawCursus): number | undefined {
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
      ? organisatieonderdeelMapper.toDB('deKei')
      : keiJongNietBuso
        ? organisatieonderdeelMapper.toDB('keiJongNietBuSO')
        : keiJongBuso
          ? organisatieonderdeelMapper.toDB('keiJongBuSO')
          : raw.titel.includes('DK/')
            ? organisatieonderdeelMapper.toDB('deKei')
            : raw.titel.includes('KJ/')
              ? organisatieonderdeelMapper.toDB('keiJongNietBuSO')
              : undefined;
  }

  function activiteitenFromRaw(
    raw: RawCursus,
  ): db.Prisma.ActiviteitCreateWithoutProjectInput[] {
    if (raw.data) {
      return raw.data
        .split(',')
        .map((range) => range.trim())
        .map((range) => {
          const [van, totEnMet] = range
            .split(' tot ')
            .map((dateAndTimeString) => {
              // example: "2021-10-29 16:30:00"
              const [dateString, timeString] = dateAndTimeString.split(' ') as [
                string,
                string,
              ];
              const [jaar, maand, dag] = dateString
                .split('-')
                .map((i) => parseInt(i));
              const [uur, minuut, seconde] = timeString
                .split(':')
                .map((i) => parseInt(i));
              timeString;
              return new Date(
                jaar ?? 0,
                (maand ?? 1) - 1,
                dag,
                uur,
                minuut,
                seconde,
              );
            }) as [Date, Date];
          const metOvernachting =
            van.getFullYear() !== totEnMet.getFullYear() ||
            van.getMonth() !== totEnMet.getMonth() ||
            van.getDate() !== totEnMet.getDate();

          return {
            van,
            totEnMet,
            metOvernachting,
            vormingsuren: determineVormingsuren(van, totEnMet),
          };
        });
    }
    return [];
  }
}

const msInDay = 1000 * 3600 * 24;
function determineVormingsuren(van: Date, totEnMet: Date): number {
  const diffMs = totEnMet.getTime() - van.getTime() + msInDay;
  const diffDays = diffMs / msInDay;
  // see https://github.com/nicojs/rock-solid/issues/22
  if (diffDays <= 1) {
    // 1 day
    return 8;
  }
  if (diffDays <= 3) {
    // weekend
    return 19;
  }
  if (diffDays <= 4) {
    // 4-daagse
    return 36;
  }
  // 5-daagse
  return 46;
}
