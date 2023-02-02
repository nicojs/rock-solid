import db from '@prisma/client';
import { seedCursusAanmeldingen } from './cursus-aanmeldingen.seed.js';
import { seedCursussen } from './cursussen.seed.js';
import { seedOrganisaties } from './organisaties.seed.js';
import { seedDeelnemers } from './deelnemers.seed.js';
import { seedPlaatsen } from './plaatsen.seed.js';
import { seedVrijwilligers } from './vrijwilligers.seed.js';
import { seedExtraPersonen } from './extra-personen.seed.js';
import { seedVakanties } from './vakanties.seed.js';
import { seedVakantieAanmeldingen } from './vakantie-aanmeldingen.seed.js';
import { seedVakantieVrijwilligers } from './vakantie-vrijwilligers.seed.js';

async function main() {
  const readonly = process.argv.includes('--readonly');
  const client = new db.PrismaClient();
  try {
    await client.$connect();
    await seedPlaatsen(client);
    const deelnemersLookup = await seedDeelnemers(client, readonly);
    await seedOrganisaties(client, readonly);
    await seedCursussen(client, readonly);
    await seedCursusAanmeldingen(client, deelnemersLookup, readonly);
    const vrijwilligersLookup = await seedVrijwilligers(client, readonly);
    await seedExtraPersonen(client, readonly);
    await seedVakanties(client, readonly);
    await seedVakantieVrijwilligers(client, vrijwilligersLookup, readonly);
    await seedVakantieAanmeldingen(client, deelnemersLookup, readonly);
  } finally {
    await client.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
