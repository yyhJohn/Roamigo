import { z } from 'zod';

export const AiCategorySchema = z.enum([
  'FOOD',
  'CULTURE',
  'OUTDOORS',
  'NIGHTLIFE',
  'TRANSIT',
  'LODGING',
  'SHOPPING',
  'OTHER',
]);

export const AiTimeSlotSchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING']);

export const ProposedActivitySchema = z.object({
  stableKey: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(500),
  category: AiCategorySchema.default('CULTURE'),
  timeSlot: AiTimeSlotSchema.default('MORNING'),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional()
    .default(null),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional()
    .default(null),
  estimatedCostMinor: z.number().int().min(0).max(5_000_000),
  locationName: z.string().trim().max(160).nullable().optional().default(null),
  compromiseExplanation: z.string().trim().min(1).max(400),
  matchedTravellers: z.array(z.string().trim().min(1)).default([]),
  included: z.boolean().default(true),
});

export const ProposedDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(30),
  date: z.string().trim().min(4).max(20),
  theme: z.string().trim().min(1).max(160),
  activities: z.array(ProposedActivitySchema).min(1).max(12),
});

export const AiWorkspaceItinerarySchema = z.object({
  chosenDestination: z.string().trim().min(1).max(120),
  overview: z.string().trim().min(1).max(800),
  compromiseSummary: z.string().trim().min(1).max(800),
  days: z.array(ProposedDaySchema).min(1).max(21),
});

export type AiWorkspaceItinerary = z.infer<typeof AiWorkspaceItinerarySchema>;

export const AssistPromptInputSchema = z.object({
  instruction: z
    .string()
    .trim()
    .min(4, 'Describe how you would like to adjust the itinerary.')
    .max(600, 'Keep assistant instructions under 600 characters.'),
  targetDayNumber: z.number().int().min(1).max(30).optional(),
});

export const AiRawProposalSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  reasoning: z.string().trim().min(1).max(600),
  days: z.array(ProposedDaySchema).min(1).max(21),
});

export type AiRawProposal = z.infer<typeof AiRawProposalSchema>;

export interface ProposalActivityChange {
  dayNumber: number;
  changeType: 'ADDED' | 'MODIFIED' | 'REMOVED' | 'UNCHANGED';
  stableKey: string;
  beforeTitle: string | null;
  afterTitle: string | null;
  beforeCostMinor: number | null;
  afterCostMinor: number | null;
}

export interface StagedAiProposalDto {
  summary: string;
  reasoning: string;
  days: z.infer<typeof ProposedDaySchema>[];
  changes: ProposalActivityChange[];
  budgetImpact: {
    beforePerPersonMinor: number;
    afterPerPersonMinor: number;
    deltaPerPersonMinor: number;
    exceededTravellersAfter: string[];
  };
}

export const ApplyAiProposalSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  days: z.array(ProposedDaySchema).min(1).max(21),
});
