import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.env.GAME_URL || 'http://127.0.0.1:4173/';
const output = process.env.PREVIEW_DIR || 'test-results/character-art';
await mkdir(output, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS || '[]'),
} : {});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true })));
  await page.goto(url);
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/characters-desktop.png` });
  await page.getByRole('button', { name: '三视图', exact: true }).click();
  for (const [id, name] of [['lin', '林见夏'], ['chen', '陈知遥'], ['tang', '许棠']]) {
    const sheet = page.getByRole('img', { name: `${name}的正面、侧面、背面三视图`, exact: true });
    await expect.poll(() => sheet.evaluate(image => image.naturalWidth)).toBeGreaterThan(1000);
    await sheet.screenshot({ path: `${output}/${id}-turnaround.png` });
  }
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  const decisions = [{ sceneId: 'desk', choiceId: 'honest' }, { sceneId: 'lunch', choiceId: 'lin' }, { sceneId: 'club', choiceId: 'plain' }];
  for (const [id, sceneId, line, expression] of [['lin', 'misunderstanding', 1, 'hurt'], ['chen', 'misunderstanding', 3, 'surprised'], ['tang', 'tang-interlude', 4, 'worried']]) {
    await page.evaluate(save => localStorage.setItem('moist-healing:v1:save:auto', JSON.stringify(save)), {
      schema: 1, game: 'moist-healing', savedAt: new Date().toISOString(),
      state: { schema: 1, storyVersion: 'chapter1-v1', sceneId, line, decisions, stats: { honesty: 0, lin: 0, chen: 0 }, history: [] },
    });
    await page.reload();
    await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect(page.locator('.scene-character')).toHaveAttribute('data-character', id);
    await expect(page.locator('.scene-character')).toHaveAttribute('data-expression', expression);
    await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await expect(page.locator('.toast.visible')).toHaveCount(0);
    for (const [screen, width, height] of [['desktop', 1440, 900], ['landscape', 844, 390], ['mobile', 412, 915]]) {
      await page.setViewportSize({ width, height });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await page.locator('.scene-character').boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 1);
      await page.screenshot({ path: `${output}/${id}-${screen}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: '返回标题', exact: true }).click();
  }
  expect(errors).toEqual([]);
  console.log(`CHARACTER_PREVIEW_OK ${JSON.stringify({ url, characters: 3, expressions: 6, screens: 3, pageErrors: errors.length, output })}`);
} finally { await browser.close(); }
