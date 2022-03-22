import * as db from '@prisma/client';
import plaatsen from './plaatsen.json';

export async function seedPlaatsen(client: db.PrismaClient) {
  await client.plaats.createMany({ data: plaatsen });
  console.log(`Seeded ${plaatsen.length} plaatsen`);
}
