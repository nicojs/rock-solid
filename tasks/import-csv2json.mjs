// @ts-check
import csv from 'csv-parser';
import stripBom from 'strip-bom-stream';
import fs from 'fs';
import path from 'path';

/**
 * @param {URL | string} fileName
 * @returns {Promise<Array>}
 */
function parseCsvFile(fileName) {
  const results = [];
  return new Promise((res, rej) => {
    fs.createReadStream(fileName)
      .pipe(stripBom())
      .pipe(csv({ separator: ';' }))
      .on('data', (data) => results.push(data))
      .on('error', (err) => rej(err))
      .on('end', () => {
        res(results);
      });
  });
}

async function main() {
  const csvFiles = await fs.promises.readdir(
    new URL('../import/csv', import.meta.url),
  );
  await fs.promises.mkdir(new URL(`../import/json`, import.meta.url), {
    recursive: true,
  });
  await Promise.all(
    csvFiles.map(async (fileName) => {
      const to = `${path.parse(fileName).name}.json`;
      const obj = await parseCsvFile(
        new URL(`../import/csv/${fileName}`, import.meta.url),
      );
      await fs.promises.writeFile(
        new URL(`../import/json/${to}`, import.meta.url),
        JSON.stringify(obj, null, 2),
        'utf-8',
      );
      console.log(`✅ ${fileName} -> ${to} (${obj.length})`);
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
