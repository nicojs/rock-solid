import db from '@prisma/client';
import { seedCursusInschrijvingen } from './cursus-inschrijvingen.seed.js';
import { seedCursussen } from './cursussen.seed.js';
import { seedOrganisaties } from './organisaties.seed.js';
import { seedDeelnemers } from './deelnemers.seed.js';
import { seedPlaatsen } from './plaatsen.seed.js';

async function main() {
  const client = new db.PrismaClient();
  try {
    await client.$connect();
    await seedPlaatsen(client);
    await seedDeelnemers(client);
    await seedOrganisaties(client);
    await seedCursussen(client);
    await seedCursusInschrijvingen(client);
  } finally {
    await client.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
