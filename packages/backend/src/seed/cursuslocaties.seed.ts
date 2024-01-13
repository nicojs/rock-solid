import * as db from '@prisma/client';
import { readImportJson, writeOutputJson } from './seed-utils.js';
import { notEmpty } from '@rock-solid/shared';
import { ImportDiagnostics } from './import-errors.js';

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

export async function seedCursuslocaties(
  client: db.PrismaClient,
  cursussenLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const importDiagnostics = new ImportDiagnostics<RawCursus>();

  const cursusIdsByTitle =
    cursussenLookup ??
    new Map(
      Object.entries(
        await readImportJson<Record<string, number>>('cursussen-lookup.json'),
      ),
    );

  const cursussenRaw = await readImportJson<RawCursus[]>('cursussen.json');
  const cursussenById = (
    await client.project.findMany({
      where: { id: { in: [...cursusIdsByTitle.values()] } },
      include: { activiteiten: true },
    })
  ).reduce((acc, cursus) => {
    acc.set(cursus.id, cursus);
    return acc;
  }, new Map<number, db.Project & { activiteiten: db.Activiteit[] }>());
  const cursussenMetLocaties = cursussenRaw
    .map((raw) => {
      const cursusId = cursusIdsByTitle.get(raw.titel);
      if (cursusId !== undefined) {
        return {
          locaties: raw.locaties.split(',').map((loc) => loc.trim()),
          cursus: cursussenById.get(cursusId)!,
          raw,
        };
      }
      return;
    })
    .filter(notEmpty);

  const locatieMap = new Map<string, db.Locatie>();

  const stats = { updated: 0, created: 0 };
  for (const { locaties, cursus, raw } of cursussenMetLocaties) {
    const activiteiten = cursus.activiteiten.sort(
      (a, b) => a.van.getTime() - b.van.getTime(),
    );
    if (locaties.length > activiteiten.length) {
      importDiagnostics.addWarning('more-locaties', {
        detail: `Vond ${locaties.length} locaties voor ${activiteiten.length} activiteiten`,
        item: raw,
      });
    }
    for (let i = 0; i < locaties.length; i++) {
      const activiteit = activiteiten[i];
      const locatieNaam = locaties[i]!;
      if (activiteit && locatieNaam !== '') {
        let locatie = locatieMap.get(locatieNaam);
        if (!locatie) {
          locatie = await client.locatie.create({
            data: { naam: locatieNaam },
          });
          stats.created++;
          locatieMap.set(locatieNaam, locatie);
        }
        await client.activiteit.update({
          where: { id: activiteit.id },
          data: { locatie: { connect: { id: locatie.id } } },
        });
        stats.updated++;
      }
    }
  }
  console.log(
    `Seeded ${stats.created} locaties, updated ${stats.updated} activiteiten`,
  );
  console.log(`(${importDiagnostics.report})`);
  await writeOutputJson(
    'cursuslocaties-diagnostics.json',
    importDiagnostics,
    readonly,
  );
}
