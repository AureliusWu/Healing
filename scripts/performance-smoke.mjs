import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const label = process.argv[2] || 'current';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Use a simple measurement label');
const root = path.resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {});
const samples = [];
try {
  for (let sample = 0; sample < 3; sample++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: .1, reducedMotion: true }));
      window.__measurementLongTasks = [];
      new PerformanceObserver(list => { window.__measurementLongTasks.push(...list.getEntries().map(entry => entry.duration)); }).observe({ type: 'longtask', buffered: true });
    });
    const measure = async kind => {
      if (kind === 'warm') await page.evaluate(() => localStorage.removeItem('moist-healing:v1:save:auto'));
      const before = performance.now();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { level: 1 })).toContainText('湿性愈合');
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      const startupMs = performance.now() - before;
      await expect(page.locator('.title-footer')).toContainText('离线阅读已就绪');
      const started = performance.now();
      await page.getByRole('button', { name: '开始阅读', exact: true }).click();
      await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'arrival');
      await page.getByRole('button', { name: '显示下一段', exact: true }).click();
      await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
      const interactionMs = performance.now() - started;
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        return { responseMs: nav.responseEnd - nav.requestStart, domContentLoadedMs: nav.domContentLoadedEventEnd, requests: resources.length + 1, transferBytes: nav.transferSize + resources.reduce((sum, entry) => sum + entry.transferSize, 0), longTaskWorstMs: Math.max(0, ...window.__measurementLongTasks) };
      });
      samples.push({ sample: sample + 1, kind, startupMs, interactionMs, ...timing, pageErrors: errors.length });
    };
    await measure('cold');
    await measure('warm');
    expect(errors).toEqual([]);
    await context.close();
  }
} finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
const assets = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else {
      const bytes = await readFile(file);
      assets.push({ path: path.relative(root, file).replaceAll(path.sep, '/'), bytes: bytes.length, gzipBytes: gzipSync(bytes).length });
    }
  }
}
await collect(root);
const result = { measuredAt: new Date().toISOString(), label, version: JSON.parse(await readFile('package.json', 'utf8')).version, browser: browser.version(), method: '3 fresh contexts, then warm service-worker navigation; 1440x900, local no-store host, text speed 0', samples, assets };
await mkdir('test-results/performance', { recursive: true });
await writeFile(`test-results/performance/${label}.json`, JSON.stringify(result, null, 2) + '\n');
console.log('PERFORMANCE_SMOKE_OK', JSON.stringify(result));
