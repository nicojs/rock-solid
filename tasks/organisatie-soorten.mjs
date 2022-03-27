import fs from 'fs/promises';

async function main() {
  const orgs = JSON.parse(
    await fs.readFile('import/json/organisaties.json', 'utf-8'),
  );
  const soorten = new Set();
  for (const org of orgs) {
    org.soort
      .split(',')
      .map(soort => soort.trim())
      .filter(Boolean)
      .forEach((soort) => soorten.add(soort));
  }
  console.log(`${orgs.length} orgs geven ${soorten.size} soorten`);
  await fs.writeFile('soorten.txt', [...soorten.values()].join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
