import type { ZodError } from 'zod';
import { TravellerInputSchema } from './schemas';

export function extractFieldErrors(error: ZodError): Record<string, string> {
  const nextErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!nextErrors[key]) {
      nextErrors[key] = issue.message;
    }
  }
  return nextErrors;
}

export type BudgetParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseBudgetInput(raw: string): BudgetParseResult {
  const parsed = raw.trim() === '' ? NaN : Number(raw);
  const check = TravellerInputSchema.shape.budget.safeParse(parsed);
  if (!check.success) {
    return {
      ok: false,
      error: check.error.issues[0]?.message ?? 'Budget must be greater than 0',
    };
  }
  return { ok: true, value: check.data };
}
