import fs from 'fs/promises';

const deelnemers = JSON.parse(
  await fs.readFile('./import/deelnemers.json', 'utf8'),
);

console.log(
  JSON.stringify(
    deelnemers
      .filter(
        (d) =>
          d['Begeleidende dienst'] ||
          d['contactpersonen cursussen'] ||
          d['contactpersonen vakanties'],
      )
      .map((d) => ({
        id: d[''],
        dienst: d['Begeleidende dienst'],
        cursussen: d['contactpersonen cursussen'],
        vakanties: d['contactpersonen vakanties'],
      })),
    null,
    2,
  ),
);
