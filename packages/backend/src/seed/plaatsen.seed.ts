import * as db from '@prisma/client';
import { promises as fs } from 'fs';

interface RawPlaats {
  postcode: string;
  deelgemeente: string;
  gemeente: string;
  volledigeNaam: string;
  provincieId: number;
}

export async function seedPlaatsen(client: db.PrismaClient) {
  const plaatsen = JSON.parse(
    await fs.readFile(
      new URL('../../src/seed/plaatsen.json', import.meta.url),
      'utf-8',
    ),
  ) as RawPlaats[];

  await client.plaats.createMany({ data: plaatsen });
  console.log(`Seeded ${plaatsen.length} plaatsen`);
}
