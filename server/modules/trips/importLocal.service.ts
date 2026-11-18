import type { PrismaClient, TimeSlot, User } from '@prisma/client';
import { toMinorUnits } from '../../../src/lib/domain/money.js';
import { PersistedTripStateSchema } from '../../../src/lib/schemas.js';
import { serviceUnavailable } from '../../lib/errors.js';

function mapLegacyTimeSlot(slot: 'morning' | 'afternoon' | 'evening'): TimeSlot {
  if (slot === 'afternoon') return 'AFTERNOON';
  if (slot === 'evening') return 'EVENING';
  return 'MORNING';
}

export async function importLocalTripToAccount(
  prisma: PrismaClient | undefined,
  user: User,
  rawPayload: unknown,
): Promise<string> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const parsed = PersistedTripStateSchema.parse(rawPayload);
  const primaryDest = parsed.trip.destinations[0] ?? 'Trip';

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        ownerId: user.id,
        title: `${primaryDest} Group Trip (Imported)`,
        destinations: parsed.trip.destinations,
        startDate: parsed.trip.startDate,
        endDate: parsed.trip.endDate,
        groupSize: parsed.trip.groupSize,
        currency: parsed.trip.currency,
        status: 'UPCOMING',
        wizardStep: 10,
        coverImageKey: primaryDest.toLowerCase().includes('lisbon')
          ? 'lisbon'
          : 'barcelona',
      },
    });

    const ownerMember = await tx.tripMember.create({
      data: { tripId: trip.id, userId: user.id, role: 'OWNER' },
    });

    if (parsed.travellers.length === 0) {
      await tx.travellerPreference.create({
        data: {
          tripId: trip.id,
          memberId: ownerMember.id,
          displayName: user.displayName,
          budgetMinor: 30000,
          interests: ['culture', 'food'],
        },
      });
    } else {
      for (const [idx, trav] of parsed.travellers.entries()) {
        await tx.travellerPreference.create({
          data: {
            tripId: trip.id,
            memberId: idx === 0 ? ownerMember.id : null,
            displayName: trav.name,
            budgetMinor: toMinorUnits(trav.budget),
            notes: trav.preferences,
            interests: trav.interests,
          },
        });
      }
    }

    await tx.budget.create({ data: { tripId: trip.id } });

    if (parsed.itinerary) {
      const itin = await tx.itinerary.create({
        data: {
          tripId: trip.id,
          chosenDestination: parsed.itinerary.chosenDestination,
        },
      });
      const ver = await tx.itineraryVersion.create({
        data: {
          itineraryId: itin.id,
          versionNumber: 1,
          overview: parsed.itinerary.overview,
          compromiseSummary: parsed.itinerary.compromiseSummary,
          source: 'IMPORT',
          createdById: user.id,
        },
      });
      await tx.itinerary.update({
        where: { id: itin.id },
        data: { activeVersionId: ver.id },
      });

      for (const day of parsed.itinerary.days) {
        const dbDay = await tx.itineraryDay.create({
          data: {
            versionId: ver.id,
            dayNumber: day.dayNumber,
            date: day.date,
            theme: day.theme,
          },
        });
        for (const [idx, act] of day.activities.entries()) {
          const dbAct = await tx.activity.create({
            data: {
              dayId: dbDay.id,
              stableKey: act.id,
              sortOrder: idx,
              title: act.title,
              description: act.description,
              timeSlot: mapLegacyTimeSlot(act.timeSlot),
              estimatedCostMinor: toMinorUnits(act.estimatedCostPerPerson),
              compromiseExplanation: act.compromiseExplanation,
              matchedTravellers: act.matchedTravellers,
              included: act.included,
            },
          });
          const legacyVotes = parsed.votes[act.id];
          const firstVoterDir = legacyVotes
            ? Object.values(legacyVotes)[0]
            : undefined;
          if (firstVoterDir) {
            await tx.vote.create({
              data: {
                activityId: dbAct.id,
                userId: user.id,
                direction: firstVoterDir === 'up' ? 'UP' : 'DOWN',
              },
            });
          }
        }
      }
    }

    return trip.id;
  });
}
