import { expect, test } from '@playwright/test';

test.describe('Milestone 8: Budgets, Penny-Exact Splits & Settlements', () => {
  test('logs penny-exact shared expenses, syncs settlements live, and marks transfers paid', async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const stamp = Date.now();
    const emailA = `budget.alice.${stamp}@roamigo.test`;
    const emailB = `budget.ben.${stamp}@roamigo.test`;

    try {
      // Register Organiser Alice
      await pageA.goto('/auth/register');
      await pageA.fill('#auth-name', 'Alice Organiser');
      await pageA.fill('#auth-email', emailA);
      await pageA.fill('#auth-password', 'AlicePass123');
      await pageA.getByTestId('auth-submit-btn').click();
      await expect(pageA).toHaveURL(/\/trips$/);

      // Clone Barcelona Demo Trip in Browser A
      await pageA
        .locator('[data-testid^="trip-card-"]', {
          hasText: 'Barcelona Long Weekend (Demo Trip)',
        })
        .getByRole('link', { name: 'Open Workspace' })
        .click();
      await pageA.getByTestId('workspace-clone-demo-btn').click();
      await expect(
        pageA.getByTestId('workspace-clone-demo-btn'),
      ).not.toBeVisible();

      // Generate invite link for Ben
      await pageA.getByTestId('open-members-modal-btn').click();
      await pageA.getByTestId('invite-email-input').fill(emailB);
      await pageA.getByTestId('create-invite-btn').click();
      const inviteUrlText =
        (await pageA.getByTestId('generated-invite-url').textContent()) ?? '';
      const invitePath = new URL(inviteUrlText.trim()).pathname;
      await pageA.keyboard.press('Escape');

      // Register Ben in Browser B & accept invite
      await pageB.goto('/auth/register');
      await pageB.fill('#auth-name', 'Ben Traveller');
      await pageB.fill('#auth-email', emailB);
      await pageB.fill('#auth-password', 'BenPass123');
      await pageB.getByTestId('auth-submit-btn').click();
      await expect(pageB).toHaveURL(/\/trips$/);

      await pageB.goto(invitePath);
      await pageB.getByTestId('accept-invite-btn').click();
      await expect(pageB).toHaveURL(/\/trips\/[0-9a-f-]+$/);

      // Wait until Alice's workspace reflects 2 members
      await expect(pageA.getByTestId('open-members-modal-btn')).toContainText(
        'Members (2)',
      );

      // Both switch to Budgets & Splits mode
      await pageA.getByTestId('ws-mode-expenses').click();
      await pageB.getByTestId('ws-mode-expenses').click();
      await expect(pageA.getByTestId('trip-budget-dashboard')).toBeVisible();

      // Update Shared Group Cap to 1500.00
      await pageA.getByTestId('shared-cap-input').fill('1500');
      await pageA.getByTestId('save-shared-cap-btn').click();
      await expect(pageA.getByTestId('trip-budget-dashboard')).toContainText(
        '1,500.00',
      );

      // Log a 99.99 EQUAL expense across Alice + Ben (50.00 + 49.99)
      await pageA.getByTestId('expense-title-input').fill('El Born Tapas Dinner');
      await pageA.getByTestId('expense-amount-input').fill('99.99');
      await pageA.getByTestId('submit-expense-btn').click();

      await expect(pageA.getByTestId('actual-logged-total')).toContainText(
        '99.99',
      );
      await expect(pageA.getByTestId('expenses-ledger-card')).toContainText(
        'El Born Tapas Dinner',
      );
      // Ben sees live settlement obligation in Browser B without page reload!
      await expect(pageB.getByTestId('settlements-card')).toContainText(
        'Ben Traveller',
      );

      // Ben marks his suggested settlement transfer as Paid -> Alice sees Paid live!
      const toggleBtn = pageB
        .locator('[data-testid^="toggle-settlement-"]')
        .first();
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click();
      await expect(pageA.getByTestId('settlements-card')).toContainText('Paid');
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
