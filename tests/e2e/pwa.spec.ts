import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

async function gameHost() {
  const root = path.resolve('dist');
  const version = { value: 1, failAsset: false };
  const server: Server = createServer(async (request, response) => {
    const url = new URL(request.url!, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/school\//, '') || 'index.html';
    const file = path.resolve(root, relative);
    if (!url.pathname.startsWith('/school/') || !file.startsWith(root + path.sep)) { response.writeHead(404).end(); return; }
    if (version.failAsset && relative === 'art/campus.webp') { response.writeHead(503).end(); return; }
    try {
      let body = await readFile(file);
      if (relative === 'sw.js') body = Buffer.from(body.toString().replace(/const CACHE = '([^']+)'/, `const CACHE = '$1-test-${version.value}'`) + `\n// fixture version ${version.value}`);
      if (relative === 'index.html') body = Buffer.from(body.toString().replace('</head>', `<meta name="test-release" content="${version.value}"></head>`));
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  return { url: `http://127.0.0.1:${address.port}/school/`, version, close: () => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }) };
}

test('failed precache is reported and retry enables offline reading in a subdirectory', async ({ page, context }) => {
  const host = await gameHost();
  try {
    host.version.failAsset = true;
    await page.goto(host.url);
    await expect(page.locator('.title-footer')).toContainText('离线下载待重试');
    await page.getByRole('button', { name: '安装与离线', exact: true }).click();
    await expect(page.getByRole('heading', { name: '可以离线阅读', exact: true })).toHaveCount(0);
    host.version.failAsset = false;
    await page.getByRole('button', { name: '重新下载', exact: true }).click();
    await expect(page.getByRole('heading', { name: '可以离线阅读', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.title-footer')).toContainText('正在离线阅读');
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  } finally { await host.close(); }
});

test('a downloaded update waits while reading and preserves progress after all game windows close', async ({ page, context }) => {
  const host = await gameHost();
  try {
    await page.addInitScript(() => { localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true })); });
    await page.goto(host.url);
    await expect(page.locator('.title-footer')).toContainText('离线阅读已就绪');
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.getByRole('button', { name: '开始阅读', exact: true }).click();
    await page.getByRole('button', { name: '显示下一段', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    await page.getByRole('button', { name: '返回标题', exact: true }).click();
    await page.getByRole('button', { name: '安装与离线', exact: true }).click();
    host.version.value = 2;
    await page.getByRole('button', { name: '检查更新', exact: true }).click();
    await expect(page.getByRole('heading', { name: '新版本已下载', exact: true })).toBeVisible();
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.waiting?.state)).toBe('installed');
    await expect(page.locator('meta[name="test-release"]')).toHaveAttribute('content', '1');
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    const observer = await context.newPage();
    // Same origin, outside the game's worker scope: observe activation without
    // opening another game client that would keep the old worker alive.
    await observer.goto(new URL('/observer', host.url).href);
    await page.close();
    await expect.poll(() => observer.evaluate(async url => !(await navigator.serviceWorker.getRegistration(url))?.waiting, host.url)).toBe(true);
    await observer.goto(host.url);
    await expect(observer.locator('meta[name="test-release"]')).toHaveAttribute('content', '2');
    await observer.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect(observer.locator('.game-screen')).toHaveAttribute('data-line', '1');
  } finally { await host.close(); }
});

test('installation uses the browser prompt and then offers no duplicate installation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt');
    Object.assign(event, { prompt: async () => { document.documentElement.dataset.installPrompt = 'shown'; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: '安装与离线', exact: true }).click();
  await page.getByRole('button', { name: '安装游戏', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-install-prompt', 'shown');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('heading', { name: '已安装到这台设备', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '安装游戏', exact: true })).toHaveCount(0);
});
