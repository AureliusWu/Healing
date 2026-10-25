import { test, expect } from '@playwright/test';
import { newGame, getScene, advance, choose, continueStory } from '../../src/game/engine';
import { encodeSave, KEY } from '../../src/game/storage';
import { presentationAt } from '../../src/game/presentation';
import { readFileSync } from 'node:fs';
const frames = JSON.parse(readFileSync(new URL('../../src/game/character-frames.json', import.meta.url), 'utf8')) as { chen: { frames: number[][] } };
import type { Expression, GameState } from '../../src/game/types';

function stateWith(expression: Expression): GameState {
  const queue = [newGame()], seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    let state = queue[i]; const scene = getScene(state);
    if (seen.has(scene.id)) continue; seen.add(scene.id);
    for (;;) {
      const p = presentationAt(scene, state.line);
      if (!scene.cg && p.character === 'chen' && p.expression === expression) return state;
      if (state.line === scene.lines.length - 1) break;
      state = advance(state);
    }
    if (scene.choices) queue.push(...scene.choices.map(c => choose(state, c.id)));
    else if (scene.continuation) queue.push(continueStory(state));
    else if (!scene.ending && !scene.chapterEnd) queue.push(advance(state));
  }
  throw Error('No authored Chen expression: ' + expression);
}

for (const expression of ['surprised', 'shy'] as const) test(`repaired ${expression} is used by actual story, old save and offline reload`, async ({ page, context }) => {
  const state = stateWith(expression), save = JSON.stringify(encodeSave(state));
  await page.addInitScript(({ key, save }) => {
    if (!localStorage.getItem(key + ':save:auto')) localStorage.setItem(key + ':save:auto', save);
    localStorage.setItem(key + ':settings', JSON.stringify({ textSpeed: 0, music: false, ambience: false, voiceEnabled: false, reducedMotion: true }));
  }, { key: KEY, save });
  await page.goto('/'); await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  const sprite = page.locator('.scene-character');
  await expect(sprite).toHaveAttribute('data-character', 'chen');
  await expect(sprite).toHaveAttribute('data-expression', expression);
  await expect(sprite.locator('img')).toHaveJSProperty('naturalWidth', 1536);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(state.line));
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key + ':save:auto')!).state, KEY);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true); await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(sprite).toHaveAttribute('data-expression', expression);
  await expect(sprite.locator('img')).toHaveJSProperty('naturalWidth', 1536);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key + ':save:auto')!).state, KEY)).toEqual(before);
});

test('all six repaired samples have real transparent book margins at required screen sizes', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '角色', exact: true }).click();
  const card = page.locator('.character-card').filter({ has: page.getByRole('heading', { name: '陈知遥', exact: true }) });
  for (const [width, height] of [[1440, 900], [412, 915], [568, 320], [640, 360], [844, 390], [915, 412]]) {
    await page.setViewportSize({ width, height });
    for (const [i, label] of ['平静', '微笑', '惊讶', '担忧', '委屈', '害羞'].entries()) {
      await card.getByRole('button', { name: label, exact: true }).click();
      const image = card.locator('.expression-atlas');
      const measured = await image.evaluate(async (element, frame) => {
        const img = element as HTMLImageElement; await img.decode();
        const [x, y, w, h] = frame;
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        const rgba = ctx.getImageData(0, 0, w, h).data;
        let left = w, right = 0, top = h, bottom = 0;
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (rgba[(yy * w + xx) * 4 + 3] >= 200) {
          left = Math.min(left, xx); right = Math.max(right, xx); top = Math.min(top, yy); bottom = Math.max(bottom, yy);
        }
        return { width: img.naturalWidth, left, right: w - right - 1, top, bottom: h - bottom - 1 };
      }, frames.chen.frames[i]);
      expect(measured.width).toBe(1536);
      expect(measured.left).toBeGreaterThanOrEqual(12); expect(measured.right).toBeGreaterThanOrEqual(12);
      expect(measured.top).toBeGreaterThanOrEqual(5); expect(measured.bottom).toBeGreaterThanOrEqual(5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
