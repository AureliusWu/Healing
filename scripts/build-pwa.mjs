import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(name));
    else if (!name.endsWith('sw.js')) result.push(name);
  }
  return result;
}
const entries = (await files('dist')).sort();
const hash = createHash('sha256');
for (const entry of entries) hash.update(await readFile(entry));
const version = hash.digest('hex').slice(0, 14);
const urls = entries.filter(file => !file.endsWith('.ico')).map(file => './' + path.relative('dist', file).split(path.sep).join('/'));
const worker = `// Generated from actual build output. Every game asset is cached atomically.
const CACHE = 'moist-healing-${version}';
const FILES = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('moist-healing-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Precache fetches and module/navigation requests may have different Origin
    // headers on hosts that return Vary: Origin. These are immutable local files.
    if (request.mode === 'navigate') {
      const shell = await cache.match(new URL('index.html', self.registration.scope), { ignoreVary: true });
      if (shell) return shell;
    }
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    try { return await fetch(request); }
    catch (error) {
      if (request.mode === 'navigate') return await cache.match(new URL('index.html', self.registration.scope), { ignoreVary: true }) || Response.error();
      return Response.error();
    }
  }));
});
`;
await writeFile('dist/sw.js', worker);
console.log(`PWA: ${urls.length} files, cache version ${version}`);
