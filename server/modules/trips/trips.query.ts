import type { Prisma } from '@prisma/client';

export const TRIP_DETAIL_INCLUDE = {
  members: {
    include: { user: true },
    orderBy: { joinedAt: 'asc' as const },
  },
  invitations: {
    where: { status: 'PENDING' as const },
    orderBy: { createdAt: 'desc' as const },
  },
  preferences: { orderBy: { createdAt: 'asc' as const } },
  budget: true,
  expenses: {
    include: { splits: true },
    orderBy: { incurredOn: 'desc' as const },
  },
  settlements: { orderBy: { createdAt: 'asc' as const } },
  itinerary: {
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' as const },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' as const },
            include: {
              activities: {
                orderBy: { sortOrder: 'asc' as const },
                include: { votes: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.TripInclude;

export type LoadedTripDetail = Prisma.TripGetPayload<{
  include: typeof TRIP_DETAIL_INCLUDE;
}>;
