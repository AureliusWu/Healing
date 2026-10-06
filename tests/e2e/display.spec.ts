import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.use({ hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: false, volume: 0.1, reducedMotion: true })));
});

test('rotation keeps the reading position and the portrait hint can be dismissed', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  await expect(page.getByRole('complementary', { name: '横屏提示' })).toBeVisible();
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await page.getByRole('button', { name: '显示下一段', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('complementary', { name: '横屏提示' })).toHaveCount(0);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  await mkdir('test-results/previews', { recursive: true });
  await page.screenshot({ path: `test-results/previews/reading-landscape-${testInfo.project.name}.png` });
  await page.setViewportSize({ width: 412, height: 915 });
  await expect(page.getByRole('complementary', { name: '横屏提示' })).toBeVisible();
  await page.getByRole('button', { name: '继续竖屏', exact: true }).click();
  await expect(page.getByRole('complementary', { name: '横屏提示' })).toHaveCount(0);
  await page.getByRole('button', { name: '阅读设置', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '阅读设置' }).getByRole('button', { name: '全屏阅读', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '返回标题', exact: true }).click();
  await expect(page.getByRole('complementary', { name: '横屏提示' })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
});

test('real fullscreen follows external exit and gracefully handles orientation lock rejection', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: async (direction: string) => { document.documentElement.dataset.direction = direction; } });
    Object.defineProperty(screen.orientation, 'unlock', { configurable: true, value: () => { document.documentElement.dataset.unlocked = 'yes'; } });
  });
  await page.getByRole('button', { name: '全屏阅读', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-direction', 'landscape');
  await expect(page.getByRole('button', { name: '退出全屏', exact: true })).toBeVisible();
  // Exercise a browser/system exit, rather than only our own exit button.
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.getByRole('button', { name: '全屏阅读', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-unlocked', 'yes');
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: async () => { throw new DOMException('Unsupported orientation', 'NotSupportedError'); } });
  });
  await page.getByRole('button', { name: '全屏阅读', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('已进入全屏');
  await page.getByRole('button', { name: '退出全屏', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
});

test('blocked or unavailable fullscreen preserves reading and explains how to continue', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: '开始阅读', exact: true }).click();
  await page.getByRole('button', { name: '显示下一段', exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: async () => { throw new DOMException('Fullscreen blocked', 'NotAllowedError'); } });
  });
  await page.getByRole('button', { name: '全屏阅读', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('暂时无法进入全屏');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  await page.evaluate(() => { Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: undefined }); });
  await page.getByRole('button', { name: '全屏阅读', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('当前浏览器不支持全屏');
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', '1');
  expect(errors).toEqual([]);
});
