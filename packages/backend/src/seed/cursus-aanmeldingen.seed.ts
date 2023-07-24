import * as db from '@prisma/client';
import { deduplicate } from '../services/mapper-utils.js';
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

export async function seedCursusAanmeldingen(
  client: db.PrismaClient,
  deelnemersLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const inschrijvingenRaw = await readImportJson<RawCursusInschrijving[]>(
    'cursus-inschrijvingen.json',
  );
  const deelnemerIdByTitles =
    deelnemersLookup ??
    new Map(
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
      include: { activiteiten: { orderBy: { van: 'asc' } } },
    })
  ).reduce((acc, { id, projectnummer, jaar, activiteiten }) => {
    acc.set(projectnummer, { id, jaar, activiteiten });
    return acc;
  }, new Map<string, { id: number; jaar: number; activiteiten: db.Activiteit[] }>());

  const aanmeldingen = inschrijvingenRaw
    .map(fromRaw)
    .filter(notEmpty)
    .filter(
      deduplicate(
        ([, aanmelding]) =>
          `${aanmelding.deelnemer!.connect!.id!}-${
            aanmelding.project.connect!.id
          }`,
        ([aanmelding]) =>
          importErrors.addWarning('duplicate_aanmelding', {
            item: aanmelding,
            detail: `Already exists`,
          }),
      ),
    );

  const eersteCursusByDeelnemer = aanmeldingen.reduce(
    (map, [, inschrijving, projectnummer]) => {
      const deelnemerId = inschrijving.deelnemer!.connect!.id!;
      const eersteCursusCode = map.get(deelnemerId);
      if (
        !eersteCursusCode ||
        cursusDate(eersteCursusCode) > cursusDate(projectnummer)
      ) {
        map.set(deelnemerId, projectnummer);
      }
      return map;
    },
    new Map<number, string>(),
  );

  for (const [, aanmelding, projectnummer] of aanmeldingen) {
    const deelnemerId = aanmelding.deelnemer!.connect!.id!;
    aanmelding.eersteAanmelding =
      eersteCursusByDeelnemer.get(deelnemerId) === projectnummer;
    await client.aanmelding.create({
      data: aanmelding,
    });
  }
  console.log(`Seeded ${aanmeldingen.length} cursus aanmeldingen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'cursus-aanmeldingen-import-errors.json',
    importErrors,
    readonly,
  );

  function fromRaw(
    raw: RawCursusInschrijving,
  ):
    | [
        raw: RawCursusInschrijving,
        createInput: db.Prisma.AanmeldingCreateInput,
        projectNummer: string,
      ]
    | undefined {
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
    return [
      raw,
      {
        deelnemer: {
          connect: { id: deelnemerId },
        },
        project: { connect: { id: project.id } },
        deelnames: {
          createMany: {
            data: project.activiteiten.map((act) => ({
              activiteitId: act.id,
              effectieveDeelnamePerunage: raw.deelgenomen === 'Ja' ? 1 : 0,
              opmerking: raw.opmerkingen.length ? raw.opmerkingen : undefined,
            })),
          },
        },
        woonplaatsDeelnemer: { connect: { id: deelnemer.woonplaatsId } },
        status: raw.deelgenomen === 'Ja' ? 'Bevestigd' : 'Geannuleerd',
      },
      projectnummer,
    ];
  }
  function cursusDate(cursusCode: string): Date {
    const cursus = cursussenByCode.get(cursusCode)!;
    return cursus.activiteiten[0]?.van ?? new Date(cursus.jaar, 1, 1);
  }
}
