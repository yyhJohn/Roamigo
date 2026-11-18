import type {
  AiRawProposal,
  AiWorkspaceItinerary,
  ProposalActivityChange,
  StagedAiProposalDto,
} from '../../../src/lib/contracts/ai.schemas.js';

export function sumIncludedMinor(
  days: AiWorkspaceItinerary['days'],
): number {
  let total = 0;
  for (const day of days) {
    for (const act of day.activities) {
      if (act.included) {
        total += act.estimatedCostMinor;
      }
    }
  }
  return total;
}

export function computeProposalDiffAndImpact(
  currentDays: AiWorkspaceItinerary['days'],
  rawProposal: AiRawProposal,
  travellers: { displayName: string; budgetMinor: number }[],
): StagedAiProposalDto {
  const beforeMap = new Map<
    string,
    { dayNumber: number; title: string; cost: number }
  >();
  for (const d of currentDays) {
    for (const a of d.activities) {
      beforeMap.set(a.stableKey, {
        dayNumber: d.dayNumber,
        title: a.title,
        cost: a.estimatedCostMinor,
      });
    }
  }

  const seenAfter = new Set<string>();
  const changes: ProposalActivityChange[] = [];

  for (const d of rawProposal.days) {
    for (const a of d.activities) {
      seenAfter.add(a.stableKey);
      const prev = beforeMap.get(a.stableKey);
      if (!prev) {
        changes.push({
          dayNumber: d.dayNumber,
          changeType: 'ADDED',
          stableKey: a.stableKey,
          beforeTitle: null,
          afterTitle: a.title,
          beforeCostMinor: null,
          afterCostMinor: a.estimatedCostMinor,
        });
      } else if (
        prev.title !== a.title ||
        prev.cost !== a.estimatedCostMinor
      ) {
        changes.push({
          dayNumber: d.dayNumber,
          changeType: 'MODIFIED',
          stableKey: a.stableKey,
          beforeTitle: prev.title,
          afterTitle: a.title,
          beforeCostMinor: prev.cost,
          afterCostMinor: a.estimatedCostMinor,
        });
      }
    }
  }

  for (const [stableKey, prev] of beforeMap.entries()) {
    if (!seenAfter.has(stableKey)) {
      changes.push({
        dayNumber: prev.dayNumber,
        changeType: 'REMOVED',
        stableKey,
        beforeTitle: prev.title,
        afterTitle: null,
        beforeCostMinor: prev.cost,
        afterCostMinor: null,
      });
    }
  }

  const beforePerPersonMinor = sumIncludedMinor(currentDays);
  const afterPerPersonMinor = sumIncludedMinor(rawProposal.days);
  const deltaPerPersonMinor = afterPerPersonMinor - beforePerPersonMinor;
  const exceededTravellersAfter = travellers
    .filter((t) => afterPerPersonMinor > t.budgetMinor)
    .map((t) => t.displayName);

  return {
    summary: rawProposal.summary,
    reasoning: rawProposal.reasoning,
    days: rawProposal.days,
    changes,
    budgetImpact: {
      beforePerPersonMinor,
      afterPerPersonMinor,
      deltaPerPersonMinor,
      exceededTravellersAfter,
    },
  };
}
