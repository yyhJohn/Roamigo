import { z } from 'zod';

export const CurrencySchema = z.enum(['GBP', 'USD', 'EUR']);
export type Currency = z.infer<typeof CurrencySchema>;

export const TripSetupSchema = z
  .object({
    destinations: z
      .array(z.string().trim().min(1, 'Destination cannot be empty'))
      .min(1, 'Enter at least one destination'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    groupSize: z
      .number()
      .int('Group size must be a whole number')
      .min(1, 'Group size must be at least 1')
      .max(20, 'Group size cannot exceed 20'),
    currency: CurrencySchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export type TripSetup = z.infer<typeof TripSetupSchema>;

export const TravellerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Traveller name is required')
    .max(60, 'Traveller name must be 60 characters or fewer'),
  budget: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .finite('Budget must be a valid number')
    .positive('Budget must be greater than 0'),
  interests: z
    .array(z.string().trim().min(1))
    .min(1, 'Enter at least one interest'),
  preferences: z
    .string()
    .trim()
    .max(300, 'Preferences must be 300 characters or fewer'),
});

export type TravellerInput = z.infer<typeof TravellerInputSchema>;

export const TravellerSchema = TravellerInputSchema.extend({
  id: z.string().min(1),
});

export type Traveller = z.infer<typeof TravellerSchema>;

export const TimeSlotSchema = z.enum(['morning', 'afternoon', 'evening']);
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const ActivitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  timeSlot: TimeSlotSchema,
  estimatedCostPerPerson: z.number().finite().min(0),
  compromiseExplanation: z.string().min(1),
  matchedTravellers: z.array(z.string()),
  included: z.boolean().default(true),
});

export type Activity = z.infer<typeof ActivitySchema>;

export const ItineraryDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  date: z.string().min(1),
  theme: z.string().min(1),
  activities: z.array(ActivitySchema).min(1),
});

export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;

export const ItinerarySchema = z.object({
  chosenDestination: z.string().min(1),
  overview: z.string().min(1),
  compromiseSummary: z.string().min(1),
  days: z.array(ItineraryDaySchema).min(1),
  generatedAt: z.string().min(1),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;

export const GenerateItineraryRequestSchema = z.object({
  trip: TripSetupSchema,
  travellers: z
    .array(TravellerSchema)
    .min(1, 'Add at least one traveller before generating an itinerary'),
});

export type GenerateItineraryRequest = z.infer<
  typeof GenerateItineraryRequestSchema
>;

export const VoteDirectionSchema = z.enum(['up', 'down']);
export type VoteDirection = z.infer<typeof VoteDirectionSchema>;

export const VotesMapSchema = z.record(
  z.string(),
  z.record(z.string(), VoteDirectionSchema),
);
export type VotesMap = z.infer<typeof VotesMapSchema>;

export const PersistedTripStateSchema = z.object({
  trip: TripSetupSchema,
  travellers: z.array(TravellerSchema),
  itinerary: ItinerarySchema.nullable(),
  votes: VotesMapSchema,
});

export type PersistedTripState = z.infer<typeof PersistedTripStateSchema>;
