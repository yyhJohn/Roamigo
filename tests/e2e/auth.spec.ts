import { expect, test } from '@playwright/test';

test.describe('Authentication & secure cookie session UI', () => {
  test('signs in via Demo Account, guards /trips, stores zero auth secrets in localStorage, and signs out', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/trips');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Ftrips/);

    await page.getByTestId('demo-login-btn').click();
    await expect(page).toHaveURL(/\/trips$/);
    await expect(page.getByTestId('shell-user-name')).toContainText(
      'Alice Chen',
    );

    const storageKeys = await page.evaluate(() =>
      Object.keys(window.localStorage),
    );
    for (const key of storageKeys) {
      expect(key.toLowerCase()).not.toContain('token');
      expect(key.toLowerCase()).not.toContain('session');
      expect(key.toLowerCase()).not.toContain('csrf');
    }

    await page.getByTestId('shell-logout-btn').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('nav-login-link')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
