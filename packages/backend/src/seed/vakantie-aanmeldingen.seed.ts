import * as db from '@prisma/client';
import { deduplicate } from '../services/mapper-utils.js';
import { ImportErrors, notEmpty } from './import-errors.js';
import { readImportJson, writeOutputJson } from './seed-utils.js';

interface RawVakantieInschrijving {
  titel: string;
  'contactpersonen vakanties': string;
  deelgenomen: 'Nee' | 'Ja';
  deelnemer: string;
  opmerkingen: string;
  'opstapplaats vakanties': string;
  vakantie: string;
}

const importErrors = new ImportErrors<RawVakantieInschrijving>();

export async function seedVakantieAanmeldingen(
  client: db.PrismaClient,
  deelnemersLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const aanmeldingenRaw = await readImportJson<RawVakantieInschrijving[]>(
    'vakantie-inschrijvingen.json',
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

  const vakantiesByCode = (
    await client.project.findMany({
      where: { type: 'vakantie' },
      include: { activiteiten: true },
    })
  ).reduce((acc, { id, projectnummer, activiteiten }) => {
    acc.set(projectnummer, { id, activiteiten });
    return acc;
  }, new Map<string, { id: number; activiteiten: db.Activiteit[] }>());
  const aanmeldingen = aanmeldingenRaw
    .map(fromRaw)
    .filter(notEmpty)
    .filter(
      deduplicate(
        ([, aanmelding]) =>
          `${aanmelding.deelnemer!.connect!.id!}-${
            aanmelding.project.connect!.id
          }`,
        ([aanmelding]) => {
          importErrors.addWarning('duplicate_aanmelding', {
            item: aanmelding,
            detail: `Aanmelding already exists`,
          });
        },
      ),
    )
    .map(([, aanmelding]) => aanmelding);

  for (const aanmelding of aanmeldingen) {
    await client.aanmelding.create({
      data: aanmelding,
    });
  }
  console.log(`Seeded ${aanmeldingen.length} vakantie aanmeldingen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'vakantie-aanmeldingen-import-errors.json',
    importErrors,
    readonly,
  );

  function fromRaw(
    raw: RawVakantieInschrijving,
  ):
    | [
        raw: RawVakantieInschrijving,
        createInput: db.Prisma.AanmeldingCreateInput,
      ]
    | undefined {
    const project = vakantiesByCode.get(raw.vakantie);
    const deelnemerId = deelnemerIdByTitles.get(raw.deelnemer);
    const deelnemer = deelnemerId ? deelnemerById.get(deelnemerId) : undefined;
    if (project === undefined) {
      importErrors.addError('project_not_exit', {
        item: raw,
        detail: `Project ${raw.vakantie} does not exist`,
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
              opmerking: raw.opmerkingen,
            })),
          },
        },
        woonplaatsDeelnemer: { connect: { id: deelnemer.woonplaatsId } },
        status: raw.deelgenomen === 'Ja' ? 'Bevestigd' : 'Geannuleerd',
      },
    ];
  }
}
