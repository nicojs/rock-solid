// Cleans @kei local dependencies from package.json of the backend (for docker build)
// Writes to the package.release.json file (for copying in Docker image)

import fs from 'fs/promises';

async function main() {
  const pkg = JSON.parse(
    await fs.readFile(
      new URL('../packages/backend/package.json', import.meta.url),
      'utf-8',
    ),
  );
  delete pkg.dependencies['@kei-crm/frontend'];
  delete pkg.dependencies['@kei-crm/shared'];
  await fs.writeFile(
    new URL('../packages/backend/package.release.json', import.meta.url),
    JSON.stringify(pkg, null, 2),
    'utf-8',
  );
  console.log('✅ packages/backend/{package.json -> package.release.json}');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
