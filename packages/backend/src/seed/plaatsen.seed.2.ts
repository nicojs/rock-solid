import * as db from '@prisma/client';
import { promises as fs } from 'fs';

interface RawPlaats {
  postcode: string;
  deelgemeente: string;
  gemeente: string;
  volledigeNaam: string;
  provincieId: number;
}

export async function seedPlaatsen2(client: db.PrismaClient) {
  const plaatsen = JSON.parse(
    await fs.readFile(
      new URL('../../src/seed/plaatsen.json', import.meta.url),
      'utf-8',
    ),
  ) as RawPlaats[];

  await Promise.all(
    plaatsen.map((plaats) =>
      client.plaats.upsert({
        create: plaats,
        update: plaats,
        where: {
          postcode_deelgemeente: {
            deelgemeente: plaats.deelgemeente,
            postcode: plaats.postcode,
          },
        },
      }),
    ),
  );
  console.log(`Seeded ${plaatsen.length} plaatsen`);
}
