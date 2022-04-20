import db from '@prisma/client';
import { seedCursusInschrijvingen } from './cursus-inschrijvingen.seed.js';
import { seedCursussen } from './cursussen.seed.js';
import { seedOrganisaties } from './organisaties.seed.js';
import { seedDeelnemers } from './deelnemers.seed.js';
import { seedPlaatsen } from './plaatsen.seed.js';
import { seedVrijwilligers } from './vrijwilligers.seed.js';
import { seedExtraPersonen } from './extra-personen.seed.js';
import { seedVakanties } from './vakanties.seed.js';
import { seedVakantieInschrijvingen } from './vakantie-inschrijvingen.seed.js';

async function main() {
  const client = new db.PrismaClient();
  try {
    await client.$connect();
    await seedPlaatsen(client);
    await seedDeelnemers(client);
    // await seedOrganisaties(client);
    // await seedCursussen(client);
    // await seedCursusInschrijvingen(client);
    await seedVrijwilligers(client);
    // await seedExtraPersonen(client);
    await seedVakanties(client);
    await seedVakantieInschrijvingen(client);
  } finally {
    await client.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
