import { test, expect, type Page } from '@playwright/test';
import { advance, choose, getScene, newGame } from '../../src/game/engine';
import { encodeSave } from '../../src/game/storage';
import { mkdir } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true })); });
});
async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'arrival');
}
async function playToChoice(page: Page) {
  for (let i = 0; i < 100; i++) {
    if (await page.locator('.choice-panel').isVisible()) return;
    if (await page.locator('.ending-card').isVisible()) return;
    // The final paragraph can render the choice between our visibility check
    // and pointer dispatch. The reader is then intentionally disabled.
    try { await page.getByRole('button', { name: '显示下一段', exact: true }).click({ timeout: 1500 }); }
    catch (error) {
      if (await page.locator('.choice-panel').isVisible() || await page.locator('.ending-card').isVisible()) return;
      throw error;
    }
  }
  throw new Error('Did not reach choice or ending');
}

test('title, original art, chapter and character screens render without page errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('湿性愈合');
  await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await mkdir('test-results/previews', { recursive: true });
  await page.screenshot({ path: `test-results/previews/title-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await expect(page.getByRole('heading', { name: '林见夏', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '陈知遥', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '章节', exact: true }).click();
  await expect(page.getByRole('heading', { name: '生长痛', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('choices change the route and autosave survives a reload', async ({ page }, testInfo) => {
  await start(page);
  await playToChoice(page);
  await page.getByRole('button', { name: /我其实/ }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'desk-honest');
  await mkdir('test-results/previews', { recursive: true });
  await page.screenshot({ path: `test-results/previews/reading-${testInfo.project.name}.png` });
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'desk-honest');
  await expect(page.locator('.dialogue-text')).toContainText('不太想让家里看到成绩');
});

test('manual slots restore an earlier paragraph and history can be read', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: '显示下一段', exact: true }).click();
  await page.getByRole('button', { name: '存档', exact: true }).click();
  await page.locator('.save-card').filter({ hasText: '手动存档 1' }).getByRole('button', { name: '存入', exact: true }).click();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '显示下一段', exact: true }).click();
  await page.getByRole('button', { name: '存档', exact: true }).click();
  await page.locator('.save-card').filter({ hasText: '手动存档 1' }).getByRole('button', { name: /读取/ }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  await page.getByRole('button', { name: '回看', exact: true }).click();
  await expect(page.locator('.history-list')).toContainText('十七岁的秋天');
});

test('one full playthrough reaches the shared ending and unlocks its memory', async ({ page }) => {
  await start(page);
  for (let choice = 0; choice < 4; choice++) {
    await playToChoice(page);
    await page.locator('.choice-panel button').first().click();
  }
  await playToChoice(page);
  await expect(page.locator('.ending-card')).toContainText('窗还开着');
  await page.getByRole('button', { name: /回到标题/ }).click();
  await page.getByRole('button', { name: '回忆', exact: true }).click();
  await expect(page.locator('.memory.unlocked')).toHaveCount(1);
  await expect(page.locator('.memory.unlocked')).toContainText('窗还开着');
});

test('portable save import reconstructs the selected branch and rejects malformed files', async ({ page }) => {
  let state = newGame();
  while (!(state.sceneId === 'desk' && state.line === getScene(state).lines.length - 1)) state = advance(state);
  state = choose(state, 'help');
  state = advance(state);
  await page.goto('/');
  await page.getByRole('button', { name: '存档迁移', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'corrupt.json', mimeType: 'application/json', buffer: Buffer.from('{"schema":999}') });
  await expect(page.getByRole('status')).toContainText('存档');
  await page.locator('input[type=file]').setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(encodeSave(state))) });
  await page.getByRole('dialog', { name: '留住这一刻' }).getByRole('button', { name: '继续', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'desk-help');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  await page.getByRole('button', { name: '存档', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出存档', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^MoistHealing-/);
});

test('PWA caches every asset and restores the same story after going offline', async ({ page, context }) => {
  await start(page);
  await page.getByRole('button', { name: '显示下一段', exact: true }).click();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find(key => key.startsWith('moist-healing-'))!);
    return (await cache.keys()).map(request => new URL(request.url).pathname);
  });
  for (const art of ['classroom', 'campus', 'lin', 'chen']) expect(cached).toContain(`/art/${art}.webp`);
  expect(cached.some(url => url.endsWith('.woff2'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
});

test('short landscape screens keep full-window artwork and reading controls inside the viewport', async ({ page }, testInfo) => {
  for (const [width, height] of [[568, 320], [640, 360], [844, 390], [915, 412]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('moist-healing:v1:save:auto'));
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    const title = await page.locator('.title-header, .title-menu, .title-nav, .title-footer').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
    for (const box of title) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(width); expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(height); }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    if (width === 844) await page.screenshot({ path: `test-results/previews/title-landscape-${testInfo.project.name}.png` });
    await page.getByRole('button', { name: '开始阅读', exact: true }).click();
    await playToChoice(page);
    const [header, stage, frame, choices, reader, character] = await page.evaluate(() => ['.game-header', '.game-stage', '.scene-frame', '.choice-panel', '.reading-panel', '.scene-character'].map(selector => {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    }));
    for (const box of [header, stage, frame, choices, reader, character]) { expect(box.left).toBeGreaterThanOrEqual(-1); expect(box.right).toBeLessThanOrEqual(width + 1); expect(box.top).toBeGreaterThanOrEqual(-1); expect(box.bottom).toBeLessThanOrEqual(height + 1); }
    expect(stage.top).toBeGreaterThanOrEqual(header.bottom - 1);
    expect(reader.top).toBeGreaterThanOrEqual(stage.bottom - 1);
    expect(choices.top).toBeGreaterThanOrEqual(reader.top);
    expect(choices.bottom).toBeLessThanOrEqual(reader.bottom);
    expect(character.top).toBeGreaterThanOrEqual(frame.top - 1);
    expect(character.bottom).toBeLessThanOrEqual(frame.bottom + 1);
    expect(frame.left).toBeCloseTo(0, 0);
    expect(frame.top).toBeCloseTo(0, 0);
    expect(frame.width).toBeCloseTo(width, 0);
    expect(frame.height).toBeCloseTo(height, 0);
    expect(await page.locator('.scene-background').evaluate(element => getComputedStyle(element).objectFit)).toBe('cover');
    expect(stage.height).toBeGreaterThan(height * .35);
    if (width === 844) await page.screenshot({ path: `test-results/previews/choices-landscape-${testInfo.project.name}.png` });
  }
});
