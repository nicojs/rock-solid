import { PrismaClient } from '@prisma/client';
import {
  aanmeldingsstatusMapper,
  geslachtMapper,
  organisatieonderdeelMapper,
} from './services/enum.mapper.js';
import { calculateAge, toCsv } from '@rock-solid/shared';

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
const results = await prisma.$queryRaw`
SELECT Project.titel, Persoon.volledigeNaam AS naam, Aanmelding.geslacht
FROM Deelname
INNER JOIN Aanmelding ON Aanmelding.id = Deelname.aanmeldingId
INNER JOIN Persoon ON Persoon.id = Aanmelding.deelnemerId
INNER JOIN Project ON Project.id = Aanmelding.projectId
WHERE Aanmelding.geslacht IS NULL
AND Project.organisatieonderdeel = ${organisatieonderdeelMapper.toDB('keiJong')}
AND Project.jaar = 2023
`;
console.log(results);

const deelnemersMetGeboortedatum: {
  jaar: number;
  van: Date;
  geboortedatum: Date;
  naam: string;
}[] = await prisma.$queryRaw`
  SELECT jaar, van, geboortedatum, Persoon.volledigeNaam AS naam
  FROM Deelname
  INNER JOIN Aanmelding ON Aanmelding.id = Deelname.aanmeldingId
  INNER JOIN Persoon ON Persoon.id = Aanmelding.deelnemerId
  INNER JOIN Project ON Project.id = Aanmelding.projectId
  INNER JOIN Activiteit ON Activiteit.id = Deelname.activiteitId
  WHERE effectieveDeelnamePerunage > 0
  AND jaar > 2021
  AND organisatieonderdeel = ${organisatieonderdeelMapper.toDB('keiJong')}
  `;

const uniqueDeelnemersPerJaar: { jaar: number; deelnemerCount: bigint }[] = await prisma.$queryRaw`
  SELECT jaar, COUNT(DISTINCT Aanmelding.deelnemerId) AS deelnemerCount
  FROM Deelname
  INNER JOIN Aanmelding ON Aanmelding.id = Deelname.aanmeldingId
  INNER JOIN Project ON Project.id = Aanmelding.projectId
  INNER JOIN Activiteit ON Activiteit.id = Deelname.activiteitId
  WHERE effectieveDeelnamePerunage > 0
  AND jaar > 2021
  AND organisatieonderdeel = ${organisatieonderdeelMapper.toDB('keiJong')}
  GROUP BY jaar
  `;

const avgDeelnamesPerDeelnemer: { jaar: number; avgDeelnames: number }[] = await prisma.$queryRaw`
  SELECT jaar, AVG(deelnameCount) AS avgDeelnames
  FROM (
    SELECT jaar, Aanmelding.deelnemerId, COUNT(*) AS deelnameCount
    FROM Deelname
    INNER JOIN Aanmelding ON Aanmelding.id = Deelname.aanmeldingId
    INNER JOIN Project ON Project.id = Aanmelding.projectId
    INNER JOIN Activiteit ON Activiteit.id = Deelname.activiteitId
    WHERE effectieveDeelnamePerunage > 0
    AND jaar > 2021
    AND organisatieonderdeel = ${organisatieonderdeelMapper.toDB('keiJong')}
    GROUP BY jaar, Aanmelding.deelnemerId
  ) AS DeelnamesPerDeelnemer
  GROUP BY jaar
  `;

const totalen: { jaar: number; deelnemerCount: number; avgDeelnames: number }[] =
  uniqueDeelnemersPerJaar.map((ud) => {
    const avg = avgDeelnamesPerDeelnemer.find((a) => a.jaar === ud.jaar);
    return {
      jaar: ud.jaar,
      deelnemerCount: Number(ud.deelnemerCount),
      avgDeelnames: avg!.avgDeelnames,
    };
  });

console.log('Totalen per jaar:', totalen);

const result = deelnemersMetGeboortedatum.map((d) => ({
  jaar: d.jaar,
  leeftijd: calculateAge(d.geboortedatum, d.van),
}));

const avgDeelnamesPerLeeftijd: {
  jaar: number;
  leeftijd: number;
  count: number;
}[] = [];
result.forEach((row) => {
  let entry = avgDeelnamesPerLeeftijd.find(
    (e) => e.jaar === row.jaar && e.leeftijd === row.leeftijd,
  );
  if (!entry) {
    entry = { jaar: row.jaar, leeftijd: row.leeftijd, count: 0 };
    avgDeelnamesPerLeeftijd.push(entry);
  }
  entry.count++;
});


const avgDeelnamesPerLeeftijdCsv = toCsv(
  avgDeelnamesPerLeeftijd,
  ['jaar', 'leeftijd', 'count'],
  undefined,
  undefined,
  ';',
);
const totalenCsv = toCsv(
  totalen,
  ['jaar', 'deelnemerCount', 'avgDeelnames'],
  undefined,
  undefined,
  ';',
);

// console.log(avgDeelnamesPerLeeftijdCsv);
// // console.log(avgDeelnamesPerLeeftijd);
import fs from 'fs';
fs.writeFileSync('deelnames-per-leeftijd-per-jaar.csv', avgDeelnamesPerLeeftijdCsv);
fs.writeFileSync('totalen.csv', totalenCsv);
