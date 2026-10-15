import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { getScene, newGame } from '../../src/game/engine';
import { decodeSave, encodeSave, KEY } from '../../src/game/storage';

const fixtures = JSON.parse(readFileSync('electron/smoke-fixtures.json', 'utf8'));
const initial = newGame();
const visibleText = (page: Page) => page.locator('.dialogue-text > span[aria-hidden="true"]');
const firstCharacters = (state: typeof initial, count: number) => Array.from(getScene(state).lines[state.line].text).slice(0, count).join('');

// The UI, typewriter and Service Worker are real. Headless Chromium does not
// hide background tabs consistently, so inject only the lifecycle signal.
async function visibility(page: Page, hidden: boolean) {
  await page.evaluate(value => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value ? 'hidden' : 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(`${key}:settings`, JSON.stringify({
    textSpeed: 4, autoDelay: 800, music: false, ambience: false, soundEffects: false, reducedMotion: false,
  })), KEY);
  await page.clock.install({ time: new Date('2026-10-15T04:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-15T04:00:10Z'));
});

test('backgrounding pauses an unread paragraph and foregrounding resumes its visible characters', async ({ page }) => {
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await page.clock.runFor(500);
  await expect(visibleText(page)).toHaveText(firstCharacters(initial, 2));
  await page.getByRole('button', { name: '自动', exact: true }).click();
  const saved = await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY);
  await visibility(page, true);
  await page.clock.runFor(60_000);
  await expect(visibleText(page)).toHaveText(firstCharacters(initial, 2));
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '0');
  await expect(page.getByRole('button', { name: '自动', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY)).toBe(saved);
  await visibility(page, false);
  await page.clock.runFor(750);
  await expect(visibleText(page)).toHaveText(firstCharacters(initial, 5));
  await page.getByRole('button', { name: '回看', exact: true }).click();
  await expect(page.locator('.history-list article')).toHaveCount(0);
});

test('a same-paragraph reread stays paused through backgrounding and retains manual saves', async ({ page }) => {
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await page.locator('.dialogue-text').click();
  await page.getByRole('button', { name: '存档', exact: true }).click();
  await page.locator('.save-card').filter({ hasText: '手动存档 1' }).getByRole('button', { name: '存入', exact: true }).click();
  const manual = await page.evaluate(key => localStorage.getItem(`${key}:save:1`), KEY);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '回看', exact: true }).click();
  await page.getByRole('button', { name: '从这里重读', exact: true }).click();
  await page.getByRole('dialog', { name: '留住这一刻', exact: true }).getByRole('button', { name: '继续', exact: true }).click();
  await expect(visibleText(page)).toHaveText('');
  await visibility(page, true);
  await page.clock.runFor(60_000);
  await expect(visibleText(page)).toHaveText('');
  await visibility(page, false);
  await page.clock.runFor(750);
  await expect(visibleText(page)).toHaveText(firstCharacters(initial, 3));
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:1`), KEY)).toBe(manual);
});

test('a legacy manual save resumes offline after rotation without background reading or route loss', async ({ page, context }) => {
  const legacy = encodeSave(fixtures.legacy);
  expect(legacy.state.storyVersion).toBe('chapter1-v1');
  const restored = decodeSave(JSON.stringify(legacy)).state;
  await page.evaluate(({ key, save }) => {
    localStorage.setItem(`${key}:save:auto`, save);
    localStorage.setItem(`${key}:save:1`, save);
  }, { key: KEY, save: JSON.stringify(legacy) });
  await page.reload();
  await expect(page.locator('.title-footer')).toContainText('离线阅读已就绪');
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.getByRole('button', { name: '存档迁移', exact: true }).click();
  await page.locator('.save-card').filter({ hasText: '手动存档 1' }).getByRole('button', { name: '读取', exact: true }).click();
  await page.clock.runFor(500);
  await expect(visibleText(page)).toHaveText(firstCharacters(restored, 2));
  const before = await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY);
  await visibility(page, true);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(60_000);
  await expect(visibleText(page)).toHaveText(firstCharacters(restored, 2));
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY)).toBe(before);
  await visibility(page, false);
  await page.clock.runFor(750);
  await expect(visibleText(page)).toHaveText(firstCharacters(restored, 5));
  const auto = await page.evaluate(key => JSON.parse(localStorage.getItem(`${key}:save:auto`)!), KEY);
  expect(auto.state).toEqual(restored);
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:1`), KEY)).toBe(JSON.stringify(legacy));
  await page.reload();
  await expect(page.locator('.title-footer')).toContainText('正在离线阅读');
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', restored.sceneId);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(restored.line));
  await expect(visibleText(page)).toHaveText('');
  await page.clock.runFor(500);
  await expect(visibleText(page)).toHaveText(firstCharacters(restored, 2));
});
