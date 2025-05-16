import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log(`${e.query} ${e.params}`);
});

const result = await prisma.$queryRaw`SELECT gemeente, COUNT(*) as Aantal
  FROM Deelname 
  INNER JOIN Aanmelding ON Aanmelding.Id = Deelname.AanmeldingId AND Aanmelding.Status IN (0, 1) 
  INNER JOIN Project ON Aanmelding.projectId = Project.id AND Project.type = 1 AND Project.organisatieonderdeel = 2 INNER JOIN Activiteit ON Activiteit.id = Deelname.activiteitId 
  INNER JOIN Plaats ON Plaats.id = Aanmelding.plaatsId
  WHERE Deelname.effectieveDeelnamePerunage > 0 AND Activiteit.van BETWEEN ${new Date(2024, 4, 1)} AND ${new Date(2025, 4, 1)}
  GROUP BY Plaats.gemeente
`;
console.log(result);
