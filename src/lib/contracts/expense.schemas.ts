import { z } from 'zod';

export const ExpenseCategorySchema = z.enum([
  'ACCOMMODATION',
  'TRANSPORT',
  'FOOD',
  'ACTIVITIES',
  'TICKETS',
  'SHARED',
  'OTHER',
]);

export const SplitModeSchema = z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE']);

export const UpdateBudgetSchema = z.object({
  sharedCapMinor: z.number().int().min(0).max(500_000_000).nullable(),
  accommodationEstMinor: z.number().int().min(0).max(500_000_000).default(0),
  transportEstMinor: z.number().int().min(0).max(500_000_000).default(0),
  foodCapMinor: z.number().int().min(0).max(500_000_000).nullable().optional(),
  activitiesCapMinor: z
    .number()
    .int()
    .min(0)
    .max(500_000_000)
    .nullable()
    .optional(),
  notes: z.string().trim().max(500).default(''),
});

export const CreateExpenseSchema = z.object({
  paidByUserId: z.string().uuid(),
  category: ExpenseCategorySchema.default('FOOD'),
  title: z.string().trim().min(2, 'Enter an expense description.').max(140),
  amountMinor: z
    .number()
    .int()
    .min(1, 'Expense amount must be at least 1 minor unit.')
    .max(100_000_000),
  currency: z.enum(['GBP', 'USD', 'EUR']).optional(),
  splitMode: SplitModeSchema.default('EQUAL'),
  incurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.'),
  notes: z.string().trim().max(400).default(''),
  participantUserIds: z.array(z.string().uuid()).optional(),
  customSplits: z
    .array(
      z.object({
        userId: z.string().uuid(),
        shareMinor: z.number().int().min(0).max(100_000_000),
      }),
    )
    .optional(),
  percentageSplits: z
    .array(
      z.object({
        userId: z.string().uuid(),
        basisPoints: z.number().int().min(0).max(10_000),
      }),
    )
    .optional(),
});

export const UpdateSettlementStatusSchema = z.object({
  status: z.enum(['SUGGESTED', 'MARKED_PAID']),
});

export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateSettlementStatusInput = z.infer<
  typeof UpdateSettlementStatusSchema
>;
