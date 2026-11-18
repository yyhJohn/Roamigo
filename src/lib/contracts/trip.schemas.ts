import { z } from 'zod';
import { CurrencySchema } from '../schemas.js';

export const TripRoleSchema = z.enum(['OWNER', 'EDITOR', 'MEMBER', 'VIEWER']);
export type TripRoleValue = z.infer<typeof TripRoleSchema>;

export const TripStatusSchema = z.enum([
  'DRAFT',
  'UPCOMING',
  'ACTIVE',
  'PAST',
  'ARCHIVED',
]);
export type TripStatusValue = z.infer<typeof TripStatusSchema>;

export const AccommodationPrefSchema = z.enum([
  'hostel',
  'budget-hotel',
  'mid-range',
  'boutique',
  'apartment',
]);

export const TransportPrefSchema = z.enum([
  'public-transit',
  'walking',
  'rail',
  'rental-car',
  'mixed',
]);

export const PacePrefSchema = z.enum(['relaxed', 'balanced', 'packed']);

export const WizardTripPayloadSchema = z
  .object({
    title: z.string().trim().min(2, 'Trip title must be at least 2 characters.').max(100),
    destinations: z
      .array(z.string().trim().min(1))
      .min(1, 'Select or enter at least one destination.')
      .max(8),
    departureCity: z.string().trim().max(80).default(''),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
    groupSize: z.number().int().min(1).max(20),
    currency: CurrencySchema,
    personalBudgetMinor: z.number().int().min(100, 'Personal budget must be > 0.'),
    sharedCapMinor: z.number().int().min(0).nullable().optional(),
    accommodationPref: AccommodationPrefSchema.default('mid-range'),
    transportPref: TransportPrefSchema.default('public-transit'),
    interests: z.array(z.string().trim().min(1)).max(15).default([]),
    pace: PacePrefSchema.default('balanced'),
    dietaryOrAccess: z.string().trim().max(240).default(''),
    notes: z.string().trim().max(300).default(''),
    wizardStep: z.number().int().min(1).max(10).default(1),
    finalize: z.boolean().default(false),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'Return date must be on or after departure date.',
    path: ['endDate'],
  })
  .refine((d) => !d.finalize || d.interests.length >= 1, {
    message: 'Choose at least one travel interest before finishing.',
    path: ['interests'],
  });

export type WizardTripPayload = z.infer<typeof WizardTripPayloadSchema>;

export const UpdateTripMetaSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  destinations: z.array(z.string().trim().min(1)).min(1).max(8).optional(),
  departureCity: z.string().trim().max(80).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: TripStatusSchema.optional(),
});

export const UpsertPreferenceSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  budgetMinor: z.number().int().min(100),
  accommodationPref: AccommodationPrefSchema.default('mid-range'),
  transportPref: TransportPrefSchema.default('public-transit'),
  pace: PacePrefSchema.default('balanced'),
  dietaryOrAccess: z.string().trim().max(240).default(''),
  notes: z.string().trim().max(300).default(''),
  interests: z.array(z.string().trim().min(1)).min(1).max(15),
});

export const CreateInvitationSchema = z.object({
  email: z.string().trim().email('Enter a valid invitee email.').max(160),
  role: z.enum(['EDITOR', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export const UpdateMemberRoleSchema = z.object({
  role: TripRoleSchema,
});

export interface TripMemberPreviewDto {
  memberId: string;
  userId: string;
  displayName: string;
  email: string | null;
  avatarColor: string;
  role: TripRoleValue;
}

export interface TripSummaryDto {
  id: string;
  title: string;
  destinations: string[];
  departureCity: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  currency: 'GBP' | 'USD' | 'EUR';
  status: TripStatusValue;
  wizardStep: number;
  coverImageKey: string;
  isDemo: boolean;
  version: number;
  myRole: TripRoleValue;
  memberCount: number;
  membersPreview: TripMemberPreviewDto[];
  estimatedPerPersonMinor: number;
  sharedCapMinor: number | null;
  hasItinerary: boolean;
}
