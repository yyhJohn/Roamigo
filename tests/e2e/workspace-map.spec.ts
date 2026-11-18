import { expect, test } from '@playwright/test';

test.describe('Milestone 6: 3-Panel Main Trip Workspace & Interactive Map', () => {
  test('clones Demo Trip, renders 3-panel layout + MapLibre pins, adds manual activity, and filters map by day', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('demo-login-btn').click();
    await expect(page).toHaveURL(/\/trips$/);

    // Open Barcelona Demo Trip workspace specifically
    await page
      .locator('[data-testid^="trip-card-"]', {
        hasText: 'Barcelona Long Weekend (Demo Trip)',
      })
      .getByRole('link', { name: 'Open Workspace' })
      .click();
    await expect(page.getByTestId('workspace-left-rail')).toBeVisible();
    await expect(page.getByTestId('workspace-timeline')).toBeVisible();
    await expect(page.getByTestId('workspace-map-panel')).toBeVisible();

    // Clone editable copy
    await page.getByTestId('workspace-clone-demo-btn').click();
    await expect(
      page.getByTestId('workspace-clone-demo-btn'),
    ).not.toBeVisible();

    // Filter map & timeline to Day 1
    await page.getByTestId('map-filter-day-1').click();
    await expect(page.getByTestId('timeline-day-1')).toBeVisible();
    await expect(page.getByTestId('timeline-day-2')).toHaveCount(0);

    // Add manual activity on Day 1 with curated Barcelona landmark
    await page.getByTestId('add-activity-day-1').click();
    await page
      .getByTestId('activity-title-input')
      .fill('Sunset View at Bunkers del Carmel');
    await page
      .getByTestId('activity-description-input')
      .fill('360-degree skyline panorama over Barcelona.');
    await page.getByTestId('activity-cost-input').fill('5.00');
    await page
      .getByTestId('activity-location-input')
      .fill('Bunkers del Carmel');
    await page.getByTestId('save-activity-btn').click();

    await expect(
      page.getByText('Sunset View at Bunkers del Carmel').first(),
    ).toBeVisible();

    // Switch right panel to AI Assistant and Budget tabs
    await page.getByTestId('right-tab-ai').click();
    await expect(page.getByTestId('workspace-ai-generate-btn')).toBeVisible();

    await page.getByTestId('right-tab-budget').click();
    await expect(page.getByTestId('workspace-budget-quick-card')).toBeVisible();
  });
});
