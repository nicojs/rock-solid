import * as db from '@prisma/client';
import { seedOrganisaties } from './organisaties.seed';
import { seedPersonen } from './persoon.seed';
import { seedPlaatsen } from './plaatsen.seed';

async function main() {
  const client = new db.PrismaClient();
  try {
    await client.$connect();
    await seedPlaatsen(client);
    await seedPersonen(client);
    await seedOrganisaties(client);
  } finally {
    await client.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
