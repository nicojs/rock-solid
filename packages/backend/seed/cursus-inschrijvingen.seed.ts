import fs from 'fs/promises';
import * as db from '@prisma/client';
import { ImportErrors, notEmpty } from './import-errors.js';
import { readImportJson, writeOutputJson } from './seed-utils.js';

interface RawCursusInschrijving {
  'contactpersonen cursussen': string;
  cursus: string;
  deelgenomen: 'Ja' | 'Nee';
  deelnemer: string;
  opmerkingen: string;
  opstapplaats: string;
}

// can parse these things:
// DK/21/882 - Online Digitaal ontmoeten
// DK/22/090-2 - Goed in je vel
// DK/22/090
// DK/22/090-3
const projectnummerRegex = /([^ -]*)(?:-([^ -]*))?.*$/;

const importErrors = new ImportErrors<RawCursusInschrijving>();

export async function seedCursusInschrijvingen(client: db.PrismaClient) {
  const inschrijvingenRaw = await readImportJson<RawCursusInschrijving[]>(
    'cursus-inschrijvingen.json',
  );
  const deelnemerIdByTitles = new Map(
    Object.entries(
      await readImportJson<Record<string, number>>('deelnemers-lookup.json'),
    ),
  );
  const deelnemerById = (
    await client.persoon.findMany({
      where: { type: 'deelnemer' },
      include: { verblijfadres: true, domicilieadres: true },
    })
  ).reduce((map, { id, verblijfadres, domicilieadres }) => {
    map.set(id, {
      woonplaatsId: domicilieadres?.plaatsId ?? verblijfadres.plaatsId,
    });
    return map;
  }, new Map<number, { woonplaatsId: number }>());

  const cursussenByCode = (
    await client.project.findMany({
      where: { type: 'cursus' },
      include: { activiteiten: true },
    })
  ).reduce((acc, { id, projectnummer, activiteiten }) => {
    acc.set(projectnummer, { id, activiteiten });
    return acc;
  }, new Map<string, { id: number; activiteiten: db.Activiteit[] }>());
  const inschrijvingen = inschrijvingenRaw
    .map(fromRaw)
    .filter(notEmpty)
    .filter(
      deduplicate(
        (inschrijving) =>
          `${inschrijving.deelnemer.connect!.id!}-${
            inschrijving.project.connect!.id
          }`,
      ),
    );

  for (const inschrijving of inschrijvingen) {
    await client.inschrijving.create({
      data: inschrijving,
    });
  }
  console.log(`Seeded ${inschrijvingen.length} cursus inschrijvingen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'cursus-inschrijvingen-import-errors.json',
    importErrors,
  );

  function fromRaw(
    raw: RawCursusInschrijving,
  ): db.Prisma.InschrijvingCreateInput | undefined {
    const projectNummerMatch = projectnummerRegex.exec(raw.cursus);
    if (!projectNummerMatch) {
      importErrors.addError('project_nummer_parse', {
        item: raw,
        detail: `Project nummer could not be parsed`,
      });
      return;
    }

    const [, projectnummer] = projectNummerMatch as unknown as [
      string,
      string,
      string | undefined,
    ];
    const project = cursussenByCode.get(projectnummer);
    const deelnemerId = deelnemerIdByTitles.get(raw.deelnemer);
    const deelnemer = deelnemerId ? deelnemerById.get(deelnemerId) : undefined;
    if (project === undefined) {
      importErrors.addError('project_not_exit', {
        item: raw,
        detail: `Project ${projectnummer} does not exist`,
      });
      return;
    }
    if (deelnemerId === undefined || deelnemer === undefined) {
      importErrors.addError('deelnemer_not_exist', {
        item: raw,
        detail: `Deelnemer ${raw.deelnemer} does not exist`,
      });
      return;
    }
    return {
      deelnemer: {
        connect: { id: deelnemerId },
      },
      project: { connect: { id: project.id } },
      deelnames: {
        createMany: {
          data: project.activiteiten.map((act) => ({
            activiteitId: act.id,
            effectieveDeelnamePerunage: raw.deelgenomen === 'Ja' ? 1 : 0,
          })),
        },
      },
      woonplaatsDeelnemer: { connect: { id: deelnemer.woonplaatsId } },
      opmerking: raw.opmerkingen,
    };
  }
}
function deduplicate<T>(
  keySelector: (val: T) => string,
): (value: T) => boolean {
  const set = new Set<string>();
  return (val) => {
    const key = keySelector(val);
    if (set.has(key)) {
      console.warn(`Removing duplicate value ${JSON.stringify(val)}`);
      return false;
    }
    set.add(key);
    return true;
  };
}
