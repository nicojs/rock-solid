import * as db from '@prisma/client';
import { readImportJson, writeOutputJson } from './seed-utils.js';
import { ImportErrors, notEmpty } from './import-errors.js';
import { deduplicate } from '../services/mapper-utils.js';
import {
  aanmeldingsstatusMapper,
  persoonTypeMapper,
  projectTypeMapper,
} from '../services/enum.mapper.js';

export interface RawInschrijving {
  deelgenomen: 'Ja' | 'Nee';
  deelnemer: string;
  opmerkingen: string;
}
export async function seedAanmeldingen<T extends RawInschrijving>(
  client: db.PrismaClient,
  deelnemersLookup: Map<string, number> | undefined,
  readonly: boolean,
  inschrijvingenRaw: T[],
  type: 'cursus' | 'vakantie',
  getProjectnummer: (raw: T) => string | undefined,
  importErrors: ImportErrors<T>,
) {
  const deelnemerIdByTitles =
    deelnemersLookup ??
    new Map(
      Object.entries(
        await readImportJson<Record<string, number>>('deelnemers-lookup.json'),
      ),
    );
  const deelnemerById = (
    await client.persoon.findMany({
      where: { type: persoonTypeMapper.toDB('deelnemer') },
      include: { verblijfadres: true, domicilieadres: true },
    })
  ).reduce(
    (
      map,
      {
        id,
        verblijfadres,
        domicilieadres,
        geslacht,
        woonsituatie,
        werksituatie,
      },
    ) => {
      map.set(id, {
        woonplaatsId: domicilieadres?.plaatsId ?? verblijfadres?.plaatsId,
        woonsituatie,
        werksituatie,
        geslacht,
      });
      return map;
    },
    new Map<
      number,
      {
        woonplaatsId: number | undefined;
        woonsituatie: number | null;
        werksituatie: number | null;
        geslacht: number | null;
      }
    >(),
  );

  const projectenByCode = (
    await client.project.findMany({
      where: { type: projectTypeMapper.toDB(type) },
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

  const eersteProjectByDeelnemer = aanmeldingen.reduce(
    (map, [, inschrijving, projectnummer]) => {
      const deelnemerId = inschrijving.deelnemer!.connect!.id!;
      const eersteCursusCode = map.get(deelnemerId);
      if (
        !eersteCursusCode ||
        projectDate(eersteCursusCode) > projectDate(projectnummer)
      ) {
        map.set(deelnemerId, projectnummer);
      }
      return map;
    },
    new Map<number, string>(),
  );

  for (const [, aanmelding, projectnummer] of aanmeldingen) {
    const createdAanmelding = await client.aanmelding.create({
      data: aanmelding,
    });
    const deelnemerId = aanmelding.deelnemer!.connect!.id!;
    if (eersteProjectByDeelnemer.get(deelnemerId) === projectnummer) {
      let data;
      if (type === 'cursus') {
        data = {
          eersteCursusAanmelding: { connect: { id: createdAanmelding.id } },
        };
      } else {
        data = {
          eersteVakantieAanmelding: { connect: { id: createdAanmelding.id } },
        };
      }

      await client.persoon.update({
        where: { id: deelnemerId },
        data,
      });
    }
  }
  console.log(`Seeded ${aanmeldingen.length} ${type} aanmeldingen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    `${type}-aanmeldingen-import-errors.json`,
    importErrors,
    readonly,
  );

  function projectDate(cursusCode: string): Date {
    const cursus = projectenByCode.get(cursusCode)!;
    return cursus.activiteiten[0]?.van ?? new Date(cursus.jaar, 1, 1);
  }

  function fromRaw(
    raw: T,
  ):
    | [
        raw: T,
        createInput: db.Prisma.AanmeldingCreateInput,
        projectNummer: string,
      ]
    | undefined {
    const projectnummer = getProjectnummer(raw);
    if (!projectnummer) {
      return;
    }
    const project = projectenByCode.get(projectnummer);
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
          create: project.activiteiten.map((act) => ({
            activiteitId: act.id,
            effectieveDeelnamePerunage: raw.deelgenomen === 'Ja' ? 1 : 0,
            opmerking: raw.opmerkingen.length ? raw.opmerkingen : undefined,
          })),
        },
        plaats: deelnemer.woonplaatsId
          ? {
              connect: { id: deelnemer.woonplaatsId },
            }
          : undefined,
        geslacht: deelnemer.geslacht,
        werksituatie: deelnemer.werksituatie,
        woonsituatie: deelnemer.woonsituatie,
        status:
          raw.deelgenomen === 'Ja'
            ? aanmeldingsstatusMapper.toDB('Bevestigd')
            : aanmeldingsstatusMapper.toDB('Geannuleerd'),
      },
      projectnummer,
    ];
  }
}
