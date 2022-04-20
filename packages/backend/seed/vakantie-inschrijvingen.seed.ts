import * as db from '@prisma/client';
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

export async function seedVakantieInschrijvingen(client: db.PrismaClient) {
  const inschrijvingenRaw = await readImportJson<RawVakantieInschrijving[]>(
    'vakantie-inschrijvingen.json',
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

  const vakantiesByCode = (
    await client.project.findMany({
      where: { type: 'vakantie' },
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
  console.log(`Seeded ${inschrijvingen.length} vakantie inschrijvingen`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'vakantie-inschrijvingen-import-errors.json',
    importErrors,
  );

  function fromRaw(
    raw: RawVakantieInschrijving,
  ): db.Prisma.InschrijvingCreateInput | undefined {
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
            opmerking: raw.opmerkingen,
          })),
        },
      },
      woonplaatsDeelnemer: { connect: { id: deelnemer.woonplaatsId } },
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
