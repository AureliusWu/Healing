import { test, expect, type Page } from '@playwright/test';
import { newGame, getScene } from '../../src/game/engine';
import { encodeSave, KEY } from '../../src/game/storage';

const initial = newGame();
const paragraph = getScene(initial).lines[initial.line].text;
const characters = Array.from(paragraph);
const visibleText = (page: Page) => page.locator('.dialogue-text > span[aria-hidden="true"]');
const confirmation = (page: Page) => page.getByRole('dialog', { name: '留住这一刻', exact: true });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(`${key}:settings`, JSON.stringify({
    textSpeed: 4, music: false, ambience: false, soundEffects: false, reducedMotion: false,
  })), KEY);
  await page.clock.install({ time: new Date('2026-10-15T00:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-15T00:00:10Z'));
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await expect(visibleText(page)).toHaveText('');
  await page.clock.runFor(500);
  await expect(visibleText(page)).toHaveText(characters.slice(0, 2).join(''));
  await page.locator('.dialogue-text').click();
  await expect(visibleText(page)).toHaveText(paragraph);
});

async function openSameParagraphReread(page: Page) {
  await page.getByRole('button', { name: '回看', exact: true }).click();
  const history = page.getByRole('dialog', { name: '已读文字', exact: true });
  await expect(history.locator('.history-list article')).toHaveCount(1);
  await history.getByRole('button', { name: '从这里重读', exact: true }).click();
  await expect(confirmation(page)).toContainText('第 1 段重新阅读');
}

async function expectRestarted(page: Page) {
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', initial.sceneId);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(initial.line));
  await expect(visibleText(page)).toHaveText('');
  await expect(page.locator('.dialogue-text')).toHaveAttribute('aria-label', '显示完整文字');
  await page.clock.runFor(750);
  await expect(visibleText(page)).toHaveText(characters.slice(0, 3).join(''));
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(`${key}:save:auto`)!), KEY);
  expect(saved.schema).toBe(1);
  expect(saved.state).toEqual(initial);
}

test('exports the original route before confirming same-paragraph reread and restarts typing', async ({ page }) => {
  const auto = await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY);
  await openSameParagraphReread(page);
  await page.clock.runFor(1000);
  const downloaded = page.waitForEvent('download');
  await confirmation(page).getByRole('button', { name: '导出原进度', exact: true }).click();
  const stream = await (await downloaded).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(exported.schema).toBe(1);
  expect(exported.state).toEqual(initial);
  await expect(confirmation(page)).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY)).toBe(auto);
  await confirmation(page).getByRole('button', { name: '继续', exact: true }).click();
  await expectRestarted(page);
});

test('cancelling same-paragraph reread retains the completed text and original save', async ({ page }) => {
  const auto = await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY);
  await openSameParagraphReread(page);
  await page.clock.runFor(1000);
  await confirmation(page).getByRole('button', { name: '再想一下', exact: true }).click();
  const history = page.getByRole('dialog', { name: '已读文字', exact: true });
  await expect(history).toBeVisible();
  await history.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(visibleText(page)).toHaveText(paragraph);
  await page.clock.runFor(750);
  await expect(visibleText(page)).toHaveText(paragraph);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(initial.line));
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY)).toBe(auto);
});

test('loading a manual save for the current paragraph restarts typing and retains the manual slot', async ({ page }) => {
  await page.getByRole('button', { name: '存档', exact: true }).click();
  const slot = page.locator('.save-card').filter({ hasText: '手动存档 1' });
  await slot.getByRole('button', { name: '存入', exact: true }).click();
  const manual = await page.evaluate(key => localStorage.getItem(`${key}:save:1`), KEY);
  expect(JSON.parse(manual!).state).toEqual(initial);
  await slot.getByRole('button', { name: '读取', exact: true }).click();
  await expectRestarted(page);
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:1`), KEY)).toBe(manual);
});

test('importing a save for the current paragraph restarts typing after confirmation', async ({ page }) => {
  await page.getByRole('button', { name: '存档', exact: true }).click();
  await page.getByLabel('选择存档文件', { exact: true }).setInputFiles({
    name: 'same-paragraph.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(encodeSave(initial))),
  });
  await expect(confirmation(page)).toContainText('导入后会切换到这份存档');
  await page.clock.runFor(1000);
  await confirmation(page).getByRole('button', { name: '继续', exact: true }).click();
  await expectRestarted(page);
});
