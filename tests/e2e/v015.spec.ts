import { test, expect } from '@playwright/test';

test.describe('v0.1.5 regressions', () => {
  test('mobile fullscreen control uses page immersive mode without native Fullscreen API', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile regression only');
    await page.goto('/');

    const button = page.getByRole('button', { name: '全屏阅读' }).first();
    await button.click();

    await expect(page.locator('html')).toHaveClass(/immersive-reading/);
    await expect(button).toHaveAttribute('aria-label', '退出全屏');
    expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(true);

    await button.click();
    await expect(page.locator('html')).not.toHaveClass(/immersive-reading/);
    await expect(button).toHaveAttribute('aria-label', '全屏阅读');
  });

  test('character archive exposes adult profile details for all three heroines', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /角色/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('林见夏');
    await expect(dialog).toContainText('陈知遥');
    await expect(dialog).toContainText('许棠');
    await expect(dialog).toContainText('18岁');
    await expect(dialog).toContainText('5月22日');
    await expect(dialog).toContainText('2月11日');
    await expect(dialog).toContainText('7月17日');
    await expect(dialog).toContainText('165cm');
    await expect(dialog).toContainText('168cm');
    await expect(dialog).toContainText('166cm');
  });
});
