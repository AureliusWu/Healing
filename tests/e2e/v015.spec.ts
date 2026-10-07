import { test, expect } from '@playwright/test';

test.describe('v0.1.5 regressions', () => {
  test('mobile fullscreen control uses page immersive mode without native Fullscreen API', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile regression only');
    await page.goto('/');

    await page.getByRole('button', { name: '全屏阅读' }).first().click();

    await expect(page.locator('html')).toHaveClass(/immersive-reading/);
    const exitButton = page.getByRole('button', { name: '退出全屏' }).first();
    await expect(exitButton).toBeVisible();
    expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(true);

    await exitButton.click();
    await expect(page.locator('html')).not.toHaveClass(/immersive-reading/);
    await expect(page.getByRole('button', { name: '全屏阅读' }).first()).toBeVisible();
  });

  test('character archive keeps birthdays and measurements alongside the restored high-school ages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /角色/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('林见夏');
    await expect(dialog).toContainText('陈知遥');
    await expect(dialog).toContainText('许棠');
    await expect(dialog).toContainText('17岁');
    await expect(dialog).not.toContainText('18岁');
    await expect(dialog).toContainText('5月22日');
    await expect(dialog).toContainText('2月11日');
    await expect(dialog).toContainText('7月17日');
    await expect(dialog).toContainText('165cm');
    await expect(dialog).toContainText('168cm');
    await expect(dialog).toContainText('166cm');
  });
});
