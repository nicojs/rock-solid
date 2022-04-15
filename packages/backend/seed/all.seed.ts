import db from '@prisma/client';
import { seedCursussen } from './cursussen.seed.js';
import { seedOrganisaties } from './organisaties.seed.js';
import { seedPersonen } from './persoon.seed.js';
import { seedPlaatsen } from './plaatsen.seed.js';

async function main() {
  const client = new db.PrismaClient();
  try {
    await client.$connect();
    await seedPlaatsen(client);
    await seedPersonen(client);
    await seedOrganisaties(client);
    await seedCursussen(client);
  } finally {
    await client.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
