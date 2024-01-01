import * as db from '@prisma/client';
import { ImportDiagnostics } from './import-errors.js';
import { readImportJson, writeOutputJson } from './seed-utils.js';
import { projectTypeMapper } from '../services/enum.mapper.js';

interface RawVakantieVrijwilliger {
  titel: string;
  deelgenomen: 'Ja';
  opmerkingen: string;
  vakantie: string;
  vrijwilliger: string;
}
export async function seedVakantieVrijwilligers(
  client: db.PrismaClient,
  vrijwilligersLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const importErrors = new ImportDiagnostics<RawVakantieVrijwilliger>();
  const vrijwilligerIdByTitle =
    vrijwilligersLookup ??
    new Map(
      Object.entries(
        await readImportJson<Record<string, number>>(
          'vrijwilliger-lookup.json',
        ),
      ),
    );
  const vakantieVrijwilligersRaw = await readImportJson<
    RawVakantieVrijwilliger[]
  >('vakantie-vrijwilligers.json');

  const vakantiesByCode = (
    await client.project.findMany({
      where: { type: projectTypeMapper.toDB('vakantie') },
      include: { activiteiten: { orderBy: { van: 'asc' } } },
    })
  ).reduce((acc, vakantie) => {
    acc.set(vakantie.projectnummer, vakantie);
    return acc;
  }, new Map<string, db.Project>());

  const vakantieVrijwilligerIdsByVakantieId = vakantieVrijwilligersRaw.reduce(
    (acc, item) => {
      const dbVakantie = vakantiesByCode.get(item.vakantie);
      const vrijwilligerId = vrijwilligerIdByTitle.get(item.vrijwilliger);
      if (dbVakantie && typeof vrijwilligerId === 'number') {
        const vrijwilligerSet = acc.get(dbVakantie.id) ?? new Set();
        vrijwilligerSet.add(vrijwilligerId);
        acc.set(dbVakantie.id, vrijwilligerSet);
      } else {
        if (!dbVakantie) {
          importErrors.addError('vakantie_not_exists', {
            item,
            detail: `Project ${item.vakantie} does not exist`,
          });
        }
        if (typeof vrijwilligerId !== 'number') {
          importErrors.addError('vrijwilliger_not_exists', {
            item,
            detail: `Vrijwilliger ${item.vrijwilliger} does not exist`,
          });
        }
      }
      return acc;
    },
    new Map<number, Set<number>>(),
  );

  let vakantieVrijwilligerCount = 0;
  for (const [id, vrijwilligerIds] of vakantieVrijwilligerIdsByVakantieId) {
    await client.project.update({
      where: { id },
      data: {
        begeleiders: { set: [...vrijwilligerIds].map((id) => ({ id })) },
      },
    });
    vakantieVrijwilligerCount += vrijwilligerIds.size;
  }

  console.log(`Seeded ${vakantieVrijwilligerCount} vakantie vrijwilligers`);
  console.log(`(${importErrors.report})`);
  await writeOutputJson(
    'vakantie-vrijwilligers-import-diagnostics.json',
    importErrors,
    readonly,
  );
}
