import { z } from 'zod';

export const CastVoteSchema = z.object({
  direction: z.enum(['UP', 'DOWN']),
});

export const ActivityDecisionSchema = z.object({
  decisionStatus: z.enum(['PROPOSED', 'LOCKED_IN', 'EXCLUDED']),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;
export type ActivityDecisionInput = z.infer<typeof ActivityDecisionSchema>;
