import { z } from 'zod';
import { AiCategorySchema, AiTimeSlotSchema } from './ai.schemas.js';

const TimeHhMm = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Use HH:MM format (e.g. 09:30).')
  .nullable()
  .optional();

export const CreateManualDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.'),
  theme: z.string().trim().min(2, 'Enter a short day theme.').max(120),
});

export const CreateActivitySchema = z.object({
  dayId: z.string().uuid(),
  title: z.string().trim().min(2, 'Enter an activity title.').max(140),
  description: z
    .string()
    .trim()
    .min(3, 'Enter a brief description.')
    .max(600),
  category: AiCategorySchema.default('CULTURE'),
  timeSlot: AiTimeSlotSchema.default('MORNING'),
  startTime: TimeHhMm,
  endTime: TimeHhMm,
  estimatedCostMinor: z.number().int().min(0).max(50_000_000).default(0),
  locationName: z.string().trim().max(160).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  coordSource: z
    .enum(['curated', 'nominatim', 'manual', 'unverified'])
    .optional(),
  included: z.boolean().default(true),
});

export const UpdateActivitySchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().min(3).max(600).optional(),
  category: AiCategorySchema.optional(),
  timeSlot: AiTimeSlotSchema.optional(),
  startTime: TimeHhMm,
  endTime: TimeHhMm,
  estimatedCostMinor: z.number().int().min(0).max(50_000_000).optional(),
  locationName: z.string().trim().max(160).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  coordSource: z
    .enum(['curated', 'nominatim', 'manual', 'unverified'])
    .optional(),
  included: z.boolean().optional(),
});

export const ReorderActivitySchema = z.object({
  activityId: z.string().uuid(),
  targetDayId: z.string().uuid().optional(),
  direction: z.enum(['UP', 'DOWN']).optional(),
  targetIndex: z.number().int().min(0).max(100).optional(),
});

export type CreateManualDayInput = z.infer<typeof CreateManualDaySchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
export type ReorderActivityInput = z.infer<typeof ReorderActivitySchema>;

export interface PlaceCandidateDto {
  name: string;
  city: string;
  lat: number;
  lng: number;
  coordSource: 'curated' | 'nominatim';
}
