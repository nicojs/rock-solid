import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import childProcess from 'child_process';

const resolveDocs = path.resolve.bind(path, path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');

const dirents = await fs.promises.readdir(resolveDocs(), { withFileTypes: true });

dirents.forEach((dirent) => {
  if (dirent.isFile() && dirent.name.endsWith('.mmd')) {
    console.log(`Watching ${dirent.name} 👀`);
    fs.watchFile(resolveDocs(dirent.name), { interval: 500 }, () => {
      console.log(`👀 ${dirent.name} changed, running mermaidjs`);
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

