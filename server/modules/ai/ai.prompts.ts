import type {
  CanonicalAssistInput,
  CanonicalItineraryInput,
} from './ai.types.js';

export function buildWorkspaceGenerationPrompt(
  input: CanonicalItineraryInput,
): string {
  const profiles = input.travellers
    .map(
      (t) =>
        `- ${t.displayName}: personal cap ${(t.budgetMinor / 100).toFixed(2)} ${input.currency} (${t.budgetMinor} minor units), pace=${t.pace}, stay=${t.accommodationPref}, transit=${t.transportPref}, interests=[${t.interests.join(', ')}], dietary/access="${t.dietaryOrAccess || 'none'}"`,
    )
    .join('\n');

  return [
    'You are the Roamigo consensus travel planner. Return ONLY valid JSON matching the requested schema.',
    `Candidate destinations: ${input.destinations.join(' | ')}`,
    `Departure city: ${input.departureCity || 'not specified'}`,
    `Dates: ${input.startDate} to ${input.endDate} (group size ${input.groupSize})`,
    `Currency: ${input.currency}. IMPORTANT: estimatedCostMinor MUST be an integer in minor units (pence/cents), e.g. 1850 for 18.50 ${input.currency}.`,
    'Traveller profiles (no emails or private identifiers included):',
    profiles,
    'Required JSON object keys:',
    '{ "chosenDestination": string, "overview": string, "compromiseSummary": string, "days": [ { "dayNumber": int, "date": "YYYY-MM-DD", "theme": string, "activities": [ { "stableKey": "d1-a1", "title": string, "description": string, "category": "FOOD"|"CULTURE"|"OUTDOORS"|"NIGHTLIFE"|"TRANSIT"|"LODGING"|"SHOPPING"|"OTHER", "timeSlot": "MORNING"|"AFTERNOON"|"EVENING", "startTime": "HH:MM", "endTime": "HH:MM", "estimatedCostMinor": int, "locationName": string, "compromiseExplanation": string, "matchedTravellers": string[], "included": true } ] } ] }',
  ].join('\n');
}

export function buildAssistProposalPrompt(input: CanonicalAssistInput): string {
  const profiles = input.travellers
    .map(
      (t) =>
        `- ${t.displayName}: cap ${t.budgetMinor} minor ${input.currency}, interests=[${t.interests.join(', ')}], dietary/access="${t.dietaryOrAccess || 'none'}"`,
    )
    .join('\n');

  return [
    'You are the Roamigo collaborative itinerary assistant. Propose a targeted modification without discarding unrelated activities.',
    `Destination: ${input.chosenDestination} (${input.currency}, integer minor units for estimatedCostMinor).`,
    input.targetDayNumber
      ? `Focus primarily on Day ${input.targetDayNumber}, keeping other days unchanged with identical stableKey values.`
      : 'Preserve existing stableKey values for activities that remain unchanged so group votes carry forward.',
    `User request: ${input.instruction}`,
    'Travellers:',
    profiles,
    `Current itinerary days JSON: ${JSON.stringify(input.currentDays)}`,
    'Return ONLY valid JSON with shape: { "summary": string, "reasoning": string, "days": [ ...updated full days array... ] }.',
  ].join('\n');
}
