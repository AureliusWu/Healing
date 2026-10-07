import { chromium, devices, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const target = new URL(process.env.GAME_URL || 'https://aureliuswu.github.io/Project1/');
const version = process.env.EXPECTED_VERSION || JSON.parse(await readFile('package.json', 'utf8')).version;
if (!['https:', 'http:'].includes(target.protocol)) throw new Error('Expected an HTTP(S) game URL');
target.searchParams.set('verify', process.env.GITHUB_SHA || `v${version}`);
await mkdir('test-results/live', { recursive: true });
for (const screen of ['desktop', 'mobile', 'landscape']) {
  const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS || '[]') } : {}), ...(process.env.PLAYWRIGHT_PROXY ? { proxy: { server: process.env.PLAYWRIGHT_PROXY } } : {}) });
  try {
    const context = await browser.newContext(screen === 'desktop' ? { viewport: { width: 1440, height: 900 } } : { ...devices['Pixel 7'], viewport: screen === 'mobile' ? { width: 412, height: 915 } : { width: 844, height: 390 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true })); });
    await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('湿性愈合', { timeout: 20000 });
    await expect(page.locator('.title-footer')).toContainText(`v${version}`);
    const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel="manifest"]').href)).json());
    expect(manifest.orientation).toBe('landscape');
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 45000 }).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `test-results/live/title-${screen}.png`, fullPage: true });
    await page.getByRole('button', { name: '开始阅读', exact: true }).click();
    await page.getByRole('button', { name: '快进', exact: true }).click();
    await expect(page.locator('.choice-panel')).toBeVisible();
    await page.screenshot({ path: `test-results/live/choices-${screen}.png` });
    await page.getByRole('button', { name: /我其实/ }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'desk-honest');
    await page.getByRole('button', { name: '显示下一段', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    if (screen === 'mobile') {
      await page.setViewportSize({ width: 844, height: 390 });
      await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
      await expect(page.getByRole('complementary', { name: '横屏提示' })).toHaveCount(0);
      await page.setViewportSize({ width: 412, height: 915 });
      await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    }
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.title-footer')).toContainText(`v${version}`);
    await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const separated = await page.evaluate(() => {
      const stage = document.querySelector('.game-stage').getBoundingClientRect();
      const header = document.querySelector('.game-header').getBoundingClientRect();
      const reader = document.querySelector('.reading-panel').getBoundingClientRect();
      return header.bottom <= stage.top + 1 && stage.bottom <= reader.top + 1;
    });
    expect(separated).toBe(true);
    expect(errors).toEqual([]);
    await expect(page.locator('.toast.visible')).toHaveCount(0);
    await page.screenshot({ path: `test-results/live/reading-${screen}.png` });
    await page.getByRole('button', { name: '隐藏界面', exact: true }).click();
    await expect(page.locator('.story-controls')).toBeHidden();
    await page.screenshot({ path: `test-results/live/picture-${screen}.png` });
    await page.getByRole('button', { name: '恢复阅读界面', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
    await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'desk-honest');
    console.log(`LIVE_SMOKE_OK ${JSON.stringify({ url: target.origin + target.pathname, version, screen, orientation: manifest.orientation, art: true, stageSeparated: separated, pictureMode: true, autosave: true, offline: true, pageErrors: errors.length })}`);
  } finally { await browser.close(); }
}
