import type {
  TripMemberPreviewDto,
  TripRoleValue,
  TripSummaryDto,
} from './trip.schemas.js';

export interface TripInvitationDto {
  id: string;
  email: string;
  role: TripRoleValue;
  status: string;
  expiresAt: string;
}

export interface TravellerPreferenceDto {
  id: string;
  memberId: string | null;
  displayName: string;
  budgetMinor: number;
  accommodationPref: string;
  transportPref: string;
  pace: string;
  dietaryOrAccess: string;
  notes: string;
  interests: string[];
}

export interface WorkspaceVoteDto {
  userId: string;
  direction: 'UP' | 'DOWN';
}

export interface WorkspaceActivityDto {
  id: string;
  dayId: string;
  stableKey: string;
  sortOrder: number;
  title: string;
  description: string;
  category:
    | 'FOOD'
    | 'CULTURE'
    | 'OUTDOORS'
    | 'NIGHTLIFE'
    | 'TRANSIT'
    | 'LODGING'
    | 'SHOPPING'
    | 'OTHER';
  timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  startTime: string | null;
  endTime: string | null;
  estimatedCostMinor: number;
  locationName: string | null;
  lat: number | null;
  lng: number | null;
  coordSource: string;
  compromiseExplanation: string;
  matchedTravellers: string[];
  included: boolean;
  decisionStatus: 'PROPOSED' | 'LOCKED_IN' | 'EXCLUDED';
  votes: WorkspaceVoteDto[];
}

export interface WorkspaceDayDto {
  id: string;
  dayNumber: number;
  date: string;
  theme: string;
  activities: WorkspaceActivityDto[];
}

export interface WorkspaceItineraryDto {
  id: string;
  chosenDestination: string;
  activeVersionId: string | null;
  versionNumber: number;
  overview: string;
  compromiseSummary: string;
  source: string;
  days: WorkspaceDayDto[];
}

export interface WorkspaceBudgetDto {
  sharedCapMinor: number | null;
  accommodationEstMinor: number;
  transportEstMinor: number;
  foodCapMinor: number | null;
  activitiesCapMinor: number | null;
  notes: string;
}

export interface WorkspaceExpenseDto {
  id: string;
  paidByUserId: string;
  category: string;
  title: string;
  amountMinor: number;
  currency: 'GBP' | 'USD' | 'EUR';
  splitMode: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  incurredOn: string;
  notes: string;
  splits: {
    userId: string;
    shareMinor: number;
    basisPoints: number | null;
  }[];
}

export interface WorkspaceSettlementDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: 'GBP' | 'USD' | 'EUR';
  status: 'SUGGESTED' | 'MARKED_PAID';
}

export interface TripDetailDto {
  summary: TripSummaryDto;
  isDemoReadOnly: boolean;
  wizardDraftJson: Record<string, unknown> | null;
  members: TripMemberPreviewDto[];
  invitations: TripInvitationDto[];
  preferences: TravellerPreferenceDto[];
  itinerary: WorkspaceItineraryDto | null;
  budget: WorkspaceBudgetDto | null;
  expenses: WorkspaceExpenseDto[];
  settlements: WorkspaceSettlementDto[];
}
