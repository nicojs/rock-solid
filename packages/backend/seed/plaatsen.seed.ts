import * as db from '@prisma/client';
import { promises as fs } from 'fs';

export async function seedPlaatsen(client: db.PrismaClient) {
  const plaatsen = JSON.parse(
    await fs.readFile(new URL('./plaatsen.json', import.meta.url), 'utf-8'),
  );
  await client.plaats.createMany({ data: plaatsen });
  console.log(`Seeded ${plaatsen.length} plaatsen`);
}
