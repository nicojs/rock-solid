import * as db from '@prisma/client';
import { ImportDiagnostics } from './import-errors.js';
import { readImportJson } from './seed-utils.js';
import { seedAanmeldingen } from './aanmeldingen.seed.js';

interface RawVakantieInschrijving {
  titel: string;
  'contactpersonen vakanties': string;
  deelgenomen: 'Nee' | 'Ja';
  deelnemer: string;
  opmerkingen: string;
  'opstapplaats vakanties': string;
  vakantie: string;
}

export async function seedVakantieAanmeldingen(
  client: db.PrismaClient,
  deelnemersLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const aanmeldingenRaw = await readImportJson<RawVakantieInschrijving[]>(
    'vakantie-inschrijvingen.json',
  );

  await seedAanmeldingen(
    client,
    deelnemersLookup,
    readonly,
    aanmeldingenRaw,
    'vakantie',
    getProjectnummer,
    new ImportDiagnostics(),
  );

  function getProjectnummer(raw: RawVakantieInschrijving) {
    return raw.vakantie;
  }
}
