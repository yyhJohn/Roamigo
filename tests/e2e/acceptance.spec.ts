import { expect, test } from '@playwright/test';

const FIXTURE_ITINERARY = {
  chosenDestination: 'Barcelona',
  overview: 'Three balanced days in Barcelona mixing culture, food, and coast.',
  compromiseSummary:
    'Combines affordable museums for Alice, tapas/nightlife for Bob, and coastal/park hikes for Charlie.',
  generatedAt: '2026-11-18T14:55:00Z',
  days: [
    {
      dayNumber: 1,
      date: '2026-12-01',
      theme: 'Gothic Quarter, Museums & Tapas',
      activities: [
        {
          id: 'day1-act1',
          title: 'Picasso Museum & El Born Walk',
          description: 'Guided culture morning in El Born.',
          timeSlot: 'morning',
          estimatedCostPerPerson: 35,
          compromiseExplanation:
            'Matches Alice’s museum interest while keeping morning free-walk budget low.',
          matchedTravellers: ['Alice'],
          included: true,
        },
        {
          id: 'day1-act2',
          title: 'Tapas & Nightlife Tasting Tour',
          description: 'Evening tapas crawl in Gràcia.',
          timeSlot: 'evening',
          estimatedCostPerPerson: 120,
          compromiseExplanation:
            'Delivers Bob’s food and nightlife priority with shared plates.',
          matchedTravellers: ['Bob'],
          included: true,
        },
      ],
    },
    {
      dayNumber: 2,
      date: '2026-12-02',
      theme: 'Montjuïc & Coastline Outdoors',
      activities: [
        {
          id: 'day2-act1',
          title: 'Barceloneta Kayaking & Coastal Trail',
          description: 'Morning sea kayaking and Montjuïc hike.',
          timeSlot: 'morning',
          estimatedCostPerPerson: 85,
          compromiseExplanation:
            'Satisfies Charlie’s outdoor preference with scenic views everyone enjoys.',
          matchedTravellers: ['Charlie'],
          included: true,
        },
      ],
    },
    {
      dayNumber: 3,
      date: '2026-12-03',
      theme: 'Park Güell & Farewell Market',
      activities: [
        {
          id: 'day3-act1',
          title: 'Park Güell & Boqueria Market Lunch',
          description: 'Architecture walk followed by casual market stalls.',
          timeSlot: 'afternoon',
          estimatedCostPerPerson: 25,
          compromiseExplanation:
            'Bridges culture, food, and outdoors at an accessible cost.',
          matchedTravellers: ['Alice', 'Bob', 'Charlie'],
          included: true,
        },
      ],
    },
  ],
};

test.describe('Roamigo acceptance criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('AC1 & AC2: traveller management and inline validation preserving inputs', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const iconSvg = await page.request.get('/favicon.svg');
    const iconIco = await page.request.get('/favicon.ico');
    expect(iconSvg.status()).toBe(200);
    expect(iconIco.status()).toBe(200);

    await page.fill('#trip-destinations', 'Barcelona');

    // AC2: invalid negative budget + empty name preserves existing inputs
    await page.fill('#traveller-name', '');
    await page.fill('#traveller-budget', '-50');
    await page.fill('#traveller-interests', 'museums, culture');
    await page.click('button:has-text("Add Traveller")');

    await expect(page.getByTestId('error-traveller-name')).toBeVisible();
    await expect(page.getByTestId('error-traveller-budget')).toBeVisible();
    await expect(page.locator('#traveller-budget')).toHaveValue('-50');
    await expect(page.locator('#traveller-interests')).toHaveValue(
      'museums, culture',
    );

    // Edge case: 200-char name rejected without clearing
    await page.fill('#traveller-name', 'A'.repeat(200));
    await page.fill('#traveller-budget', '200');
    await page.click('button:has-text("Add Traveller")');
    await expect(page.getByTestId('error-traveller-name')).toBeVisible();

    // AC1: add Alice, Bob, Charlie
    await page.fill('#traveller-name', 'Alice');
    await page.fill('#traveller-budget', '200');
    await page.fill('#traveller-interests', 'museums, culture');
    await page.click('button:has-text("Add Traveller")');

    await page.fill('#traveller-name', 'Bob');
    await page.fill('#traveller-budget', '300');
    await page.fill('#traveller-interests', 'food, nightlife');
    await page.click('button:has-text("Add Traveller")');

    await page.fill('#traveller-name', 'Charlie');
    await page.fill('#traveller-budget', '500');
    await page.fill('#traveller-interests', 'outdoor activities');
    await page.click('button:has-text("Add Traveller")');

    await expect(page.getByTestId('traveller-card-Alice')).toContainText('£200');
    await expect(page.getByTestId('traveller-card-Bob')).toContainText('£300');
    await expect(page.getByTestId('traveller-card-Charlie')).toContainText(
      '£500',
    );

    // Remove Charlie and verify update
    await page.click('button[aria-label="Remove Charlie"]');
    await expect(page.getByTestId('traveller-card-Charlie')).toHaveCount(0);

    // LocalStorage persistence on reload
    await page.reload();
    await expect(page.getByTestId('traveller-card-Alice')).toBeVisible();
    await expect(page.getByTestId('traveller-card-Bob')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('AC3 error state when server AI credentials are unconfigured', async ({
    page,
  }) => {
    await page.fill('#traveller-name', 'Alice');
    await page.fill('#traveller-budget', '200');
    await page.fill('#traveller-interests', 'museums, culture');
    await page.click('button:has-text("Add Traveller")');

    const healthRes = await page.request.get('/api/health');
    const healthJson = (await healthRes.json()) as { aiConfigured: boolean };
    if (!healthJson.aiConfigured) {
      await page.getByTestId('generate-itinerary-btn').click();
      await expect(page.getByTestId('itinerary-error')).toBeVisible();
    }
  });

  test('AC3, AC4 & AC5 UI workflow with deterministic itinerary fixture', async ({
    page,
  }) => {
    await page.route('**/api/itinerary/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ itinerary: FIXTURE_ITINERARY }),
      });
    });

    await page.fill('#trip-destinations', 'Barcelona');
    await page.fill('#traveller-name', 'Alice');
    await page.fill('#traveller-budget', '200');
    await page.fill('#traveller-interests', 'museums, culture');
    await page.click('button:has-text("Add Traveller")');

    await page.fill('#traveller-name', 'Bob');
    await page.fill('#traveller-budget', '300');
    await page.fill('#traveller-interests', 'food, nightlife');
    await page.click('button:has-text("Add Traveller")');

    await page.fill('#traveller-name', 'Charlie');
    await page.fill('#traveller-budget', '500');
    await page.fill('#traveller-interests', 'outdoor activities');
    await page.click('button:has-text("Add Traveller")');

    // AC3: generate & render day-by-day itinerary
    await page.getByTestId('generate-itinerary-btn').click();
    await expect(page.getByTestId('itinerary-content')).toBeVisible();
    await expect(page.getByTestId('itinerary-day-1')).toBeVisible();
    await expect(page.getByTestId('itinerary-day-2')).toBeVisible();
    await expect(page.getByTestId('itinerary-day-3')).toBeVisible();

    // AC4: Alice & Bob vote; changing Alice's vote does not duplicate count
    await page.getByTestId('vote-up-day1-act1').click();
    await expect(page.getByTestId('up-count-day1-act1')).toHaveText('1');

    const bobOption = await page
      .locator('#active-voter-select option', { hasText: 'Bob' })
      .getAttribute('value');
    if (!bobOption) throw new Error('Bob option missing');
    await page.selectOption('#active-voter-select', bobOption);
    await page.getByTestId('vote-up-day1-act1').click();
    await expect(page.getByTestId('up-count-day1-act1')).toHaveText('2');

    const aliceOption = await page
      .locator('#active-voter-select option', { hasText: 'Alice' })
      .getAttribute('value');
    if (!aliceOption) throw new Error('Alice option missing');
    await page.selectOption('#active-voter-select', aliceOption);
    await page.getByTestId('vote-down-day1-act1').click();
    await expect(page.getByTestId('up-count-day1-act1')).toHaveText('1');
    await expect(page.getByTestId('down-count-day1-act1')).toHaveText('1');

    // AC5: Total is £265 (exceeds Alice's £200 budget); exclude £120 activity -> £145 (within budget)
    await expect(page.getByTestId('estimated-cost-per-person')).toHaveText(
      '£265 est.',
    );
    await expect(page.getByTestId('budget-warning-banner')).toContainText(
      'Alice',
    );
    await page.getByTestId('toggle-include-day1-act2').click();
    await expect(page.getByTestId('estimated-cost-per-person')).toHaveText(
      '£145 est.',
    );
    await expect(page.getByTestId('budget-ok-badge')).toBeVisible();

    // Reduce Bob's budget below £145 -> budget warning reappears
    await page.click('button[aria-label="Edit budget for Bob"]');
    await page.fill('input[aria-label="Edit budget for Bob"]', '100');
    await page
      .getByTestId('traveller-card-Bob')
      .locator('button:has-text("Save")')
      .click();
    await expect(page.getByTestId('budget-warning-banner')).toContainText('Bob');
  });
});
