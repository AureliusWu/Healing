import { chromium, devices, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const target = new URL(process.env.GAME_URL || 'https://aureliuswu.github.io/Project1/');
const version = process.env.EXPECTED_VERSION || JSON.parse(await readFile('package.json', 'utf8')).version;
if (!['https:', 'http:'].includes(target.protocol)) throw new Error('Expected an HTTP(S) game URL');
target.searchParams.set('verify', process.env.GITHUB_SHA || `v${version}`);
await mkdir('test-results/live', { recursive: true });
for (const screen of ['desktop', 'mobile']) {
  const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS || '[]') } : {}), ...(process.env.PLAYWRIGHT_PROXY ? { proxy: { server: process.env.PLAYWRIGHT_PROXY } } : {}) });
  try {
    const context = await browser.newContext(screen === 'mobile' ? { ...devices['Pixel 7'], viewport: { width: 412, height: 915 } } : { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true })); });
    await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('湿性愈合', { timeout: 20000 });
    await expect(page.locator('.title-footer')).toContainText(`v${version}`);
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 45000 }).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `test-results/live/title-${screen}.png`, fullPage: true });
    await page.getByRole('button', { name: '开始阅读', exact: true }).click();
    await page.getByRole('button', { name: '显示下一段', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.title-footer')).toContainText(`v${version}`);
    await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/live/reading-${screen}.png` });
    console.log(`LIVE_SMOKE_OK ${JSON.stringify({ url: target.origin + target.pathname, version, screen, art: true, autosave: true, offline: true, pageErrors: errors.length })}`);
  } finally { await browser.close(); }
}
