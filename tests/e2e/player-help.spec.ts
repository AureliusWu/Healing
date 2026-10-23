import { test, expect } from '@playwright/test';

test('help keeps the reading position, typed text, saves and keyboard focus', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 4, music: false, voiceEnabled: false })));
  await page.goto('/');
  const titleHelp = page.getByRole('button', { name: '游玩帮助', exact: true });
  await titleHelp.click();
  const dialog = page.getByRole('dialog', { name: '游玩帮助', exact: true });
  await expect(dialog).toContainText('第三章通向四个最终结局');
  await page.keyboard.press('Escape');
  await expect(titleHelp).toBeFocused();
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  const typed = page.locator('.dialogue-text > span[aria-hidden="true"]');
  await expect(typed).not.toHaveText('');
  await page.waitForFunction(() => localStorage.getItem('moist-healing:v1:save:auto') !== null);
  const help = page.getByRole('button', { name: '帮助', exact: true });
  await help.click();
  await expect(dialog).toBeVisible();
  const before = await page.locator('.game-screen').getAttribute('data-line');
  const text = await typed.textContent();
  const saves = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('moist-healing:v1:save:'))));
  await page.keyboard.press('a');
  await page.keyboard.press('l');
  await page.waitForTimeout(900);
  await expect(typed).toHaveText(text!);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', before!);
  expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('moist-healing:v1:save:'))))).toEqual(saves);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(help).toBeFocused();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', before!);
});

test('help remains readable and closable in a short landscape window', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto('/');
  await page.getByRole('button', { name: '游玩帮助', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '游玩帮助', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('heading', { name: '声音与画面', exact: true }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
