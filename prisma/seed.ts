import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/lib/crypto.js';
import {
  DEMO_BARCELONA_DAYS,
  DEMO_PASSWORD,
  DEMO_TRIP_ID,
} from './seedData.js';

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const now = new Date();

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(904210)`;

      const alice = await tx.user.upsert({
        where: { email: 'alice@roamigo.demo' },
        update: { displayName: 'Alice Chen', isDemo: true, emailVerifiedAt: now },
        create: {
          email: 'alice@roamigo.demo',
          passwordHash,
          displayName: 'Alice Chen',
          avatarColor: '#103D3B',
          preferredCurrency: 'GBP',
          emailVerifiedAt: now,
          isDemo: true,
        },
      });

      const james = await tx.user.upsert({
        where: { email: 'james@roamigo.demo' },
        update: { displayName: 'James Okafor', isDemo: true, emailVerifiedAt: now },
        create: {
          email: 'james@roamigo.demo',
          passwordHash,
          displayName: 'James Okafor',
          avatarColor: '#0F766E',
          preferredCurrency: 'GBP',
          emailVerifiedAt: now,
          isDemo: true,
        },
      });

      const sophie = await tx.user.upsert({
        where: { email: 'sophie@roamigo.demo' },
        update: { displayName: 'Sophie Laurent', isDemo: true, emailVerifiedAt: now },
        create: {
          email: 'sophie@roamigo.demo',
          passwordHash,
          displayName: 'Sophie Laurent',
          avatarColor: '#B45309',
          preferredCurrency: 'GBP',
          emailVerifiedAt: now,
          isDemo: true,
        },
      });

      await tx.trip.deleteMany({ where: { id: DEMO_TRIP_ID } });

      const trip = await tx.trip.create({
        data: {
          id: DEMO_TRIP_ID,
          ownerId: alice.id,
          title: 'Barcelona Long Weekend (Demo Trip)',
          destinations: ['Barcelona'],
          departureCity: 'London',
          startDate: '2026-12-04',
          endDate: '2026-12-06',
          groupSize: 3,
          currency: 'GBP',
          status: 'UPCOMING',
          wizardStep: 10,
          coverImageKey: 'barcelona',
          isDemo: true,
          version: 1,
        },
      });

      const mAlice = await tx.tripMember.create({
        data: { tripId: trip.id, userId: alice.id, role: 'OWNER' },
      });
      const mJames = await tx.tripMember.create({
        data: { tripId: trip.id, userId: james.id, role: 'EDITOR' },
      });
      const mSophie = await tx.tripMember.create({
        data: { tripId: trip.id, userId: sophie.id, role: 'MEMBER' },
      });

      await tx.travellerPreference.createMany({
        data: [
          {
            tripId: trip.id,
            memberId: mAlice.id,
            displayName: 'Alice Chen',
            budgetMinor: 24000,
            accommodationPref: 'budget-hotel',
            transportPref: 'public-transit',
            pace: 'balanced',
            interests: ['museums', 'architecture', 'coffee'],
          },
          {
            tripId: trip.id,
            memberId: mJames.id,
            displayName: 'James Okafor',
            budgetMinor: 32000,
            accommodationPref: 'mid-range',
            transportPref: 'public-transit',
            pace: 'balanced',
            interests: ['tapas', 'markets', 'nightlife'],
          },
          {
            tripId: trip.id,
            memberId: mSophie.id,
            displayName: 'Sophie Laurent',
            budgetMinor: 40000,
            accommodationPref: 'boutique',
            transportPref: 'walking',
            pace: 'packed',
            interests: ['kayaking', 'coastal walks', 'photography'],
          },
        ],
      });

      const itinerary = await tx.itinerary.create({
        data: { tripId: trip.id, chosenDestination: 'Barcelona' },
      });

      const v1 = await tx.itineraryVersion.create({
        data: {
          itineraryId: itinerary.id,
          versionNumber: 1,
          overview:
            'Three balanced winter-sun days in Barcelona blending Gaudí landmarks, neighbourhood tapas, and Mediterranean coastline.',
          compromiseSummary:
            'Keeps per-person activity spend to £121.00 est. (well inside Alice’s £240 cap) while giving Sophie coastal kayaking and James two authentic food stops.',
          source: 'AI',
          createdById: alice.id,
        },
      });

      await tx.itinerary.update({
        where: { id: itinerary.id },
        data: { activeVersionId: v1.id },
      });

      for (const daySeed of DEMO_BARCELONA_DAYS) {
        const day = await tx.itineraryDay.create({
          data: {
            versionId: v1.id,
            dayNumber: daySeed.dayNumber,
            date: daySeed.date,
            theme: daySeed.theme,
          },
        });
        for (const actSeed of daySeed.activities) {
          const act = await tx.activity.create({
            data: { ...actSeed, dayId: day.id, coordSource: 'curated' },
          });
          await tx.vote.createMany({
            data: [
              { activityId: act.id, userId: alice.id, direction: 'UP' },
              {
                activityId: act.id,
                userId: james.id,
                direction: actSeed.stableKey === 'bcn-d2-kayak' ? 'DOWN' : 'UP',
              },
              { activityId: act.id, userId: sophie.id, direction: 'UP' },
            ],
          });
        }
      }

      await tx.budget.create({
        data: {
          tripId: trip.id,
          sharedCapMinor: 90000,
          accommodationEstMinor: 36000,
          transportEstMinor: 15000,
          foodCapMinor: 24000,
          activitiesCapMinor: 25000,
        },
      });

      const hostelExp = await tx.expense.create({
        data: {
          tripId: trip.id,
          paidByUserId: sophie.id,
          category: 'ACCOMMODATION',
          title: 'El Born Boutique Apartment Deposit',
          amountMinor: 36000,
          currency: 'GBP',
          splitMode: 'EQUAL',
          incurredOn: '2026-12-04',
        },
      });

      await tx.expenseSplit.createMany({
        data: [
          { expenseId: hostelExp.id, userId: alice.id, shareMinor: 12000 },
          { expenseId: hostelExp.id, userId: james.id, shareMinor: 12000 },
          { expenseId: hostelExp.id, userId: sophie.id, shareMinor: 12000 },
        ],
      });

      await tx.settlement.createMany({
        data: [
          {
            tripId: trip.id,
            fromUserId: alice.id,
            toUserId: sophie.id,
            amountMinor: 12000,
            currency: 'GBP',
            status: 'SUGGESTED',
          },
          {
            tripId: trip.id,
            fromUserId: james.id,
            toUserId: sophie.id,
            amountMinor: 12000,
            currency: 'GBP',
            status: 'SUGGESTED',
          },
        ],
      });
    },
    { timeout: 20_000 },
  );
}

const isMain = process.argv[1]?.endsWith('seed.ts');
if (isMain) {
  const client = new PrismaClient();
  seedDatabase(client)
    .then(async () => {
      await client.$disconnect();
      console.log('Seeded Roamigo demo users and Barcelona trip successfully.');
    })
    .catch(async (err: unknown) => {
      console.error('Failed to seed database:', err);
      await client.$disconnect();
      process.exit(1);
    });
}
