import { expect, test } from '@playwright/test';

test.describe('Milestone 9: Exports, Printable View, Settings & Account Deletion', () => {
  test('exports ICS/CSV/JSON, renders print view, saves dark theme settings, and deletes account', async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `m9.e2e.${stamp}@roamigo.test`;

    await page.goto('/auth/register');
    await page.fill('#auth-name', 'Elena Explorer');
    await page.fill('#auth-email', email);
    await page.fill('#auth-password', 'ElenaPass123');
    await page.getByTestId('auth-submit-btn').click();
    await expect(page).toHaveURL(/\/trips$/);

    // Open Barcelona Demo Trip & clone editable copy
    await page
      .locator('[data-testid^="trip-card-"]', {
        hasText: 'Barcelona Long Weekend (Demo Trip)',
      })
      .getByRole('link', { name: 'Open Workspace' })
      .click();
    await page.getByTestId('workspace-clone-demo-btn').click();
    await expect(page.getByTestId('workspace-clone-demo-btn')).not.toBeVisible();

    const tripId = page.url().split('/trips/')[1]!;

    // Verify Export menu opens and download endpoints return 200
    await page.getByTestId('workspace-export-btn').click();
    await expect(page.getByTestId('workspace-export-menu')).toBeVisible();

    const icsResp = await page.request.get(`/api/trips/${tripId}/export/ics`);
    expect(icsResp.status()).toBe(200);
    expect(await icsResp.text()).toContain('BEGIN:VCALENDAR');

    const csvResp = await page.request.get(`/api/trips/${tripId}/export/csv`);
    expect(csvResp.status()).toBe(200);

    const jsonResp = await page.request.get(`/api/trips/${tripId}/export/json`);
    expect(jsonResp.status()).toBe(200);

    // Open Print / Save PDF view
    await page.getByTestId('export-print-link').click();
    await expect(page.getByTestId('trip-print-view')).toBeVisible();
    await expect(page.getByTestId('trigger-window-print-btn')).toBeVisible();

    // Navigate to /settings and update display name + dark theme
    await page.goto('/settings');
    await expect(page.getByTestId('profile-settings-card')).toBeVisible();
    await page.getByTestId('settings-display-name').fill('Elena Nomad');
    await page.getByTestId('settings-theme').selectOption('dark');
    await page.getByTestId('save-settings-btn').click();

    await expect(page.getByTestId('shell-user-name')).toHaveText('Elena Nomad');
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    );
    expect(isDark).toBe(true);

    // Permanently delete account -> redirected to / and signed out
    await page.getByTestId('delete-confirm-input').fill('DELETE MY ACCOUNT');
    await page.getByTestId('delete-account-btn').click();
    await expect(page).toHaveURL(/\/$/);

    const meAfter = await page.request.get('/api/auth/me');
    const meJson = (await meAfter.json()) as {
      data: { authenticated: boolean };
    };
    expect(meJson.data.authenticated).toBe(false);
  });
});
