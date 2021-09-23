import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import childProcess from 'child_process';

const resolveDocs = path.resolve.bind(path, path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');

const entries = await fs.promises.readdir(resolveDocs(), { withFileTypes: true });

entries.forEach((entry) => {
  if (entry.isFile() && entry.name.endsWith('.mmd')) {
    console.log(`Watching ${entry.name} 👀`);
    fs.watchFile(resolveDocs(entry.name), { interval: 500 }, () => {
      console.log(`👀 ${entry.name} changed, running mermaid-js`);
      runMermaid();
    });
  }
});

function runMermaid() {
  childProcess.exec(`npm run docs:mermaid`, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`✅ Done`);
    }
  });
}

runMermaid();

