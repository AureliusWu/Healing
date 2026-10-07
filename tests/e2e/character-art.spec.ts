import { test, expect } from '@playwright/test';
import { replay } from '../../src/game/engine';
import { encodeSave } from '../../src/game/storage';

test('every heroine has six selectable expressions and offline-ready turnaround art', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '角色', exact: true }).click();
  for (const name of ['林见夏', '陈知遥', '许棠']) {
    const card = page.locator('.character-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
    for (const expression of ['平静', '微笑', '惊讶', '担忧', '委屈', '害羞']) {
      await card.getByRole('button', { name: expression, exact: true }).click();
      await expect(card.getByRole('img', { name: `${name} · ${expression}`, exact: true })).toBeVisible();
      await expect(card.getByRole('button', { name: expression, exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
  }
  await page.getByRole('button', { name: '三视图', exact: true }).click();
  for (const name of ['林见夏', '陈知遥', '许棠']) {
    const sheet = page.getByRole('img', { name: `${name}的正面、侧面、背面三视图`, exact: true });
    await expect(sheet).toBeVisible();
    await expect.poll(() => sheet.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(1000);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.getByRole('button', { name: '三视图', exact: true }).click();
  await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))).toBe(true);
});

test('a saved argument restores the hurt expression without changing paragraph or choices', async ({ page }) => {
  const state = replay([{ sceneId: 'desk', choiceId: 'honest' }, { sceneId: 'lunch', choiceId: 'lin' }, { sceneId: 'club', choiceId: 'plain' }], 'misunderstanding', 2);
  await page.addInitScript(save => {
    localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true }));
    if (!localStorage.getItem('moist-healing:v1:save:auto')) localStorage.setItem('moist-healing:v1:save:auto', JSON.stringify(save));
  }, encodeSave(state));
  await page.goto('/');
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.scene-character')).toHaveAttribute('data-expression', 'hurt');
  await expect(page.locator('.scene-character')).toHaveAttribute('data-character', 'lin');
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.scene-character')).toHaveAttribute('data-expression', 'hurt');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '2');
  await page.getByRole('button', { name: '显示下一段', exact: true }).click();
  await expect(page.locator('.scene-character')).toHaveAttribute('data-character', 'chen');
  await expect(page.locator('.scene-character')).toHaveAttribute('data-expression', 'surprised');
});
