import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fingerprintFiles, renderWorker } from './pwa-build.mjs';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(name));
    else if (path.relative('dist', name) !== 'sw.js') result.push(name);
  }
  return result;
}
const entries = (await files('dist')).sort();
const artifacts = await Promise.all(entries.map(async entry => ({ name: path.relative('dist', entry).split(path.sep).join('/'), bytes: await readFile(entry) })));
const version = fingerprintFiles(artifacts);
const urls = artifacts.filter(file => !file.name.endsWith('.ico')).map(file => './' + file.name.split('/').map(encodeURIComponent).join('/'));
const worker = renderWorker({ namespace: 'moist-healing', version, urls });
await writeFile('dist/sw.js', worker);
console.log(`PWA: ${urls.length} files, cache version ${version}`);
