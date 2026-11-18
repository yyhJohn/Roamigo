import { expect, test } from '@playwright/test';

test.describe('My Trips dashboard & 10-step Create Trip Wizard', () => {
  test('renders Demo Trip on /trips, preserves wizard inputs, saves draft, resumes, and launches', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('demo-login-btn').click();
    await expect(page).toHaveURL(/\/trips$/);

    await expect(
      page.getByText('Barcelona Long Weekend (Demo Trip)'),
    ).toBeVisible();

    await page.getByTestId('create-trip-cta').click();
    await expect(page).toHaveURL(/\/trips\/new$/);

    await page.fill('#wiz-title', 'Kyoto Temple & Ramen Week');
    await page.fill('#wiz-dest', 'Kyoto');
    await page.getByTestId('wizard-next-btn').click();

    await page.fill('#wiz-departure', 'Manchester');
    await page.getByTestId('wizard-back-btn').click();
    await expect(page.locator('#wiz-title')).toHaveValue(
      'Kyoto Temple & Ramen Week',
    );

    await page.getByTestId('wizard-next-btn').click();
    await expect(page.locator('#wiz-departure')).toHaveValue('Manchester');

    // Save draft at Step 2 & verify Drafts tab
    await page.getByTestId('wizard-save-draft-btn').click();
    await expect(page).toHaveURL(/\/trips$/);

    await page.getByTestId('filter-tab-drafts').click();
    await expect(page.getByText('Kyoto Temple & Ramen Week')).toBeVisible();

    await page.click('a:has-text("Resume Draft")');
    await expect(page.getByTestId('wizard-step-heading')).toContainText(
      'Departure City',
    );

    // Jump to Step 10 Review & Launch
    await page.click('button[aria-label^="Step 10:"]');
    await page.getByTestId('wizard-finish-btn').click();
    await expect(page).toHaveURL(/\/trips\/[0-9a-f-]+$/);
    await expect(
      page.getByRole('heading', { name: 'Kyoto Temple & Ramen Week' }),
    ).toBeVisible();
  });
});
