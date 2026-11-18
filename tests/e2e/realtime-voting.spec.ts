import { expect, test } from '@playwright/test';

test.describe('Milestone 7: Multi-Context Real-Time Collaborative Voting', () => {
  test('syncs votes and organiser lock-in live across two independent browser contexts without page reload', async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const stamp = Date.now();
    const emailA = `collab.a.${stamp}@roamigo.test`;
    const emailB = `collab.b.${stamp}@roamigo.test`;

    // Register Organiser A
    await pageA.goto('/auth/register');
    await pageA.fill('#auth-name', 'Nina Organiser');
    await pageA.fill('#auth-email', emailA);
    await pageA.fill('#auth-password', 'Collaborate123');
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

    // Generate invite link for Member B
    await pageA.getByTestId('open-members-modal-btn').click();
    await pageA.getByTestId('invite-email-input').fill(emailB);
    await pageA.getByTestId('create-invite-btn').click();
    const inviteUrlText =
      (await pageA.getByTestId('generated-invite-url').textContent()) ?? '';
    const invitePath = new URL(inviteUrlText.trim()).pathname;
    await pageA.keyboard.press('Escape');

    // Register Member B in independent Browser Context B & accept invite
    await pageB.goto('/auth/register');
    await pageB.fill('#auth-name', 'Sam Collaborator');
    await pageB.fill('#auth-email', emailB);
    await pageB.fill('#auth-password', 'Collaborate123');
    await pageB.getByTestId('auth-submit-btn').click();
    await expect(pageB).toHaveURL(/\/trips$/);

    await pageB.goto(invitePath);
    await pageB.getByTestId('accept-invite-btn').click();
    await expect(pageB).toHaveURL(/\/trips\/[0-9a-f-]+$/);

    // Verify both browsers show Live (2 online) via Socket.IO room presence
    await expect(pageA.getByTestId('realtime-status-badge')).toContainText(
      'Live (2 online)',
    );
    await expect(pageB.getByTestId('realtime-status-badge')).toContainText(
      'Live (2 online)',
    );

    // Grab first activity id from Browser B's timeline
    const firstCardB = pageB
      .locator('[data-testid^="workspace-activity-card-"]')
      .first();
    const cardTestId = (await firstCardB.getAttribute('data-testid'))!;
    const activityId = cardTestId.replace('workspace-activity-card-', '');

    // Member B votes DOWN -> Organiser A sees down-count increment live without reload!
    const beforeDownA = Number(
      await pageA.getByTestId(`down-count-${activityId}`).textContent(),
    );
    await pageB.getByTestId(`vote-down-${activityId}`).click();
    await expect(pageA.getByTestId(`down-count-${activityId}`)).toHaveText(
      String(beforeDownA + 1),
    );

    // Organiser A clicks Lock In -> Member B sees Locked In consensus badge live!
    await pageA.getByTestId(`lock-in-${activityId}`).click();
    await expect(
      pageB.getByTestId(`consensus-badge-${activityId}`),
    ).toHaveText('Locked In');

    await contextA.close();
    await contextB.close();
  });
});
