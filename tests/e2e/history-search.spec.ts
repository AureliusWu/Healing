import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { replay, sceneMap } from '../../src/game/engine';
import { encodeSave } from '../../src/game/storage';
import { advance, newGame, recordLine } from '../../src/game/engine';

const key = 'moist-healing:v1';
let state = newGame();
for (let step = 0; step < 12; step++) state = advance(state);
const records = recordLine(state).history;

test('searches actual read history, resets filters and keeps the saved route through typing and rotation', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key + ':settings', JSON.stringify({ textSpeed: 0, music: false, reducedMotion: true }));
  }, { key });
  await page.goto('/');
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  for (let step = 0; step < 12; step++) {
    if (await page.locator('.choice-panel').isVisible()) break;
    await expect(page.locator('.dialogue-text')).toHaveAttribute('aria-label', '显示下一段');
    await page.locator('.dialogue-text').click();
  }
  const saved = await page.evaluate(key => localStorage.getItem(key + ':save:auto'), key);
  await page.getByRole('button', { name: '回看', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '已读文字', exact: true });
  await expect(dialog.locator('.history-list article')).toHaveCount(records.length);
  await expect(dialog.getByLabel('章节', { exact: true }).locator('option')).toHaveCount(2);
  await dialog.getByRole('searchbox', { name: '搜索已读文字' }).fill('未读XYZ a h l s');
  await expect(dialog.locator('.history-list article')).toHaveCount(0);
  await expect(dialog).toContainText('没有找到这条记录');
  await dialog.getByRole('button', { name: '清除筛选', exact: true }).click();
  const entry = records.find(row => row.speaker !== '旁白')!;
  await dialog.getByLabel('说话人', { exact: true }).selectOption(entry.speaker);
  await expect(dialog.locator('.history-list article')).toHaveCount(records.filter(row => row.speaker === entry.speaker).length);
  await dialog.getByRole('searchbox').fill(entry.text.slice(0, 6));
  await expect(dialog.locator('.history-list')).toContainText(entry.text);
  await mkdir('test-results/previews', { recursive: true });
  await page.screenshot({ path: `test-results/previews/history-search-${info.project.name}.png` });
  await page.setViewportSize({ width: 568, height: 320 });
  await expect(dialog.getByRole('searchbox')).toBeVisible();
  await dialog.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(dialog.locator('.history-list article')).toHaveCount(records.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', state.sceneId);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(state.line));
  expect(await page.evaluate(key => localStorage.getItem(key + ':save:auto'), key)).toBe(saved);
  await page.getByRole('button', { name: '回看', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(page.getByLabel('说话人', { exact: true })).toHaveValue('');
  expect(errors).toEqual([]);
});


test('intersects read chapters, speakers and text without changing history identities or stored progress', async ({ page }, info) => {
  const fixture = JSON.parse(readFileSync('electron/smoke-fixtures.json', 'utf8'));
  const source = replay(fixture.final.decisions, fixture.final.sceneId, fixture.final.line);
  const rows = recordLine(source).history;
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key + ':save:auto', save);
    localStorage.setItem(key + ':settings', JSON.stringify({ textSpeed: 0, music: false, reducedMotion: true }));
  }, { key, save: JSON.stringify(encodeSave(source)) });
  await page.goto('/');
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toHaveAttribute('aria-label', '显示下一段');
  const snapshot = () => page.evaluate(key => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith(key + ':')).sort().map(k => [k, localStorage.getItem(k)])), key);
  const before = await snapshot();
  await page.getByRole('button', { name: '回看', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '已读文字', exact: true });
  const selected = String(sceneMap.get(rows.at(-1)!.sceneId)!.chapter ?? 1);
  const chapterRows = rows.filter(row => String(sceneMap.get(row.sceneId)!.chapter ?? 1) === selected);
  await dialog.getByLabel('章节', { exact: true }).selectOption(selected);
  await expect(dialog.locator('.history-list article')).toHaveCount(chapterRows.length);
  const entry = chapterRows[0];
  await dialog.getByLabel('说话人', { exact: true }).selectOption(entry.speaker);
  await dialog.getByRole('searchbox').fill(entry.text.slice(0, 10));
  const found = chapterRows.filter(row => row.speaker === entry.speaker && (row.speaker + ' ' + row.text).includes(entry.text.slice(0, 10)));
  await expect(dialog.locator('.history-list article')).toHaveCount(found.length);
  await mkdir('test-results/previews', { recursive: true });
  await expect(page.locator('.toast')).not.toHaveClass(/visible/);
  await page.screenshot({ path: `test-results/previews/chapter-search-${info.project.name}.png` });
  for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect(dialog.getByLabel('章节', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await dialog.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(dialog.getByLabel('章节', { exact: true })).toHaveValue('');
  await expect(dialog.getByLabel('说话人', { exact: true })).toHaveValue('');
  await expect(dialog.getByRole('searchbox')).toHaveValue('');
  await expect(dialog.locator('.history-list article')).toHaveCount(rows.length);
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  expect(await snapshot()).toEqual(before);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', source.sceneId);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(source.line));
});
