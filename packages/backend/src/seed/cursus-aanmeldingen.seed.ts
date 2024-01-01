import * as db from '@prisma/client';
import { ImportDiagnostics } from './import-errors.js';
import { readImportJson } from './seed-utils.js';
import { seedAanmeldingen } from './aanmeldingen.seed.js';

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

export async function seedCursusAanmeldingen(
  client: db.PrismaClient,
  deelnemersLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const importErrors = new ImportDiagnostics<RawCursusInschrijving>();

  const inschrijvingenRaw = await readImportJson<RawCursusInschrijving[]>(
    'cursus-inschrijvingen.json',
  );
  await seedAanmeldingen(
    client,
    deelnemersLookup,
    readonly,
    inschrijvingenRaw,
    'cursus',
    getProjectnummer,
    importErrors,
  );

  function getProjectnummer(raw: RawCursusInschrijving) {
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
    return projectnummer;
  }
}
