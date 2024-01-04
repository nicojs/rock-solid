import db from '@prisma/client';
import { readImportJson, writeOutputJson } from './seed-utils.js';
import { ImportDiagnostics } from './import-errors.js';

interface RawRitaDeelnemer {
  '': string;
  achternaam: string;
  naam: string;
  geboortedatum: 'string';
  adres: 'string';
  postcode: string;
  gemeente: string;
  'adres domicilie': string;
  'Begeleidende dienst': string;
  'contactpersonen cursussen': string;
  'contactpersonen vakanties': string;
  cursussen: 'Ja' | 'Nee';
  'e-mail': string;
  Eid: string;
  'folder aangevraagd': string;
  postnummer: string;
  'postnummer domicilie': string;
  'gemeente domicilie': string;
  geboorteplaats: string;
  geslacht: 'man' | 'vrouw' | '';
  GSM: string;
  instelling: string;
  'Kei-Jong BUSO': 'Ja' | 'Nee';
  mutualiteit: string;
  'naam domicilie': string;
  opmerkingen: string;
  'opstapplaats langlopende cursussen': string;
  'opstapplaats vakanties': string;
  'opstapplaats weekends': string;
  rijksregisternummer: string;
  telefoon: string;
  'telefoon domicilie': string;
  vakanties: string;
  'volwassen minderjarig': string;
  werksituatie: string;
  woonsituatie: string;
  'direct verwijderen na migreren': 'ja' | '';
  'adres verwijderen na migreren': 'ja' | '';
}

export async function deleteDeelnemers(
  client: db.PrismaClient,
  deelnemersLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const importDiagnostics = new ImportDiagnostics<RawRitaDeelnemer>();

  const deelnemerIdByTitles =
    deelnemersLookup ??
    new Map(
      Object.entries(
        await readImportJson<Record<string, number>>('deelnemers-lookup.json'),
      ),
    );

  const deelnemersRitaRaw = await readImportJson<RawRitaDeelnemer[]>(
    'deelnemers-rita.json',
  );
  const deelnemersToDelete = deelnemersRitaRaw.filter(
    (d) => d['direct verwijderen na migreren'] === 'ja',
  );
  const adressenToDelete = deelnemersRitaRaw.filter(
    (d) =>
      d['adres verwijderen na migreren'] === 'ja' &&
      d['direct verwijderen na migreren'] !== 'ja',
  );
  deelnemersToDelete.forEach((item) =>
    importDiagnostics.addInfo('deleted', {
      item,
      detail: 'Verwijderd op aanvraag van Rita',
    }),
  );
  adressenToDelete.forEach((item) => {
    importDiagnostics.addInfo('adres verwijderd', {
      item,
      detail: 'Verwijderd na migratie',
    });
  });
  const deelnemerIdsToDelete = deelnemersToDelete.map(
    (deelnemer) => deelnemerIdByTitles.get(deelnemer[''])!,
  );
  const deelnemerIdsHomeless = adressenToDelete.map(
    (deelnemer) => deelnemerIdByTitles.get(deelnemer[''])!,
  );
  const { count: deleteCount } = await client.persoon.deleteMany({
    where: { id: { in: deelnemerIdsToDelete } },
  });
  const { count: homelessCount } = await client.persoon.updateMany({
    data: {
      domicilieadresId: null,
      verblijfadresId: null,
    },
    where: {
      id: { in: deelnemerIdsHomeless },
    },
  });
  if (deleteCount === deelnemerIdsToDelete.length) {
    console.log(`Deleted ${deleteCount} deelnemers`);
  } else {
    throw new Error(
      `Deleted ${deleteCount} deelnemers, expected ${deelnemerIdsToDelete.length}`,
    );
  }
  if (homelessCount === deelnemerIdsHomeless.length) {
    console.log(`Deleted ${homelessCount} deelnemer adressen.`);
  } else {
    throw new Error(
      `Deleted ${deleteCount} deelnemers, expected ${deelnemerIdsToDelete.length}`,
    );
  }
  await writeOutputJson(
    'deelnemers-delete-diagnostics.json',
    importDiagnostics,
    readonly,
  );
  console.log(`(${importDiagnostics.report})`);
}
