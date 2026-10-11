import { test, expect } from '@playwright/test';
import { advance, getScene, newGame } from '../../src/game/engine';
import { encodeSave } from '../../src/game/storage';

test('reading opacity persists while the full-window artwork and save position stay intact', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, music: false, reducedMotion: true })));
  await page.goto('/');
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await page.getByRole('button', { name: /调整对话框透明度/ }).click();
  const range = page.getByRole('slider', { name: '对话框透明度', exact: true });
  await range.focus();
  await range.press('Home');
  for (let i = 0; i < 4; i++) await range.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('moist-healing:v1:dialogue-opacity'))).toBe('0.55');
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '0');
  await expect(page.getByRole('button', { name: '调整对话框透明度，当前 55%', exact: true })).toBeVisible();
  const fullWindow = await page.locator('.scene-frame').evaluate(element => {
    const frame = element.getBoundingClientRect();
    return Math.abs(frame.left) <= 1 && Math.abs(frame.top) <= 1 && Math.abs(frame.width - innerWidth) <= 1 && Math.abs(frame.height - innerHeight) <= 1;
  });
  expect(fullWindow).toBe(true);
});

test('hidden interface pauses playback and restores touch or keyboard without advancing or choosing', async ({ page }) => {
  let state = newGame();
  while (!(state.sceneId === 'desk' && state.line === getScene(state).lines.length - 1)) state = advance(state);
  await page.addInitScript(save => {
    localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true }));
    if (!localStorage.getItem('moist-healing:v1:save:auto')) localStorage.setItem('moist-healing:v1:save:auto', JSON.stringify(save));
  }, encodeSave(state));
  await page.goto('/');
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.choice-panel')).toBeVisible();
  const choiceLine = await page.locator('.game-screen').getAttribute('data-line');
  await page.getByRole('button', { name: '隐藏界面', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-ui-hidden', 'true');
  await expect(page.locator('.choice-panel')).toBeHidden();
  await expect(page.locator('.game-header')).toBeHidden();
  await expect(page.locator('.story-controls')).toBeHidden();
  const stageHeight = await page.locator('.game-stage').evaluate(element => element.getBoundingClientRect().height);
  expect(stageHeight).toBe(await page.evaluate(() => innerHeight));
  await page.getByRole('button', { name: '恢复阅读界面', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', choiceLine!);
  await expect(page.locator('.choice-panel')).toBeVisible();
  await page.getByRole('button', { name: /我其实/ }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'desk-honest');
  await expect(page.locator('.scene-character')).toBeVisible();
  const line = await page.locator('.game-screen').getAttribute('data-line');
  await page.getByRole('button', { name: '自动', exact: true }).click();
  await page.keyboard.press('h');
  await page.keyboard.press('a');
  await page.waitForTimeout(3600);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', line!);
  await page.keyboard.press('Escape');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-ui-hidden', 'false');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', line!);
  await expect(page.getByRole('button', { name: '自动', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('h');
  await page.keyboard.press('h');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-ui-hidden', 'false');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', line!);
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', line!);
});
