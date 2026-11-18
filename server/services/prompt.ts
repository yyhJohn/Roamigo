import { Type, type Schema } from '@google/genai';
import type { GenerateItineraryRequest } from '../../src/lib/schemas.js';

export const ITINERARY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    chosenDestination: { type: Type.STRING },
    overview: { type: Type.STRING },
    compromiseSummary: { type: Type.STRING },
    generatedAt: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER },
          date: { type: Type.STRING },
          theme: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                timeSlot: {
                  type: Type.STRING,
                  enum: ['morning', 'afternoon', 'evening'],
                },
                estimatedCostPerPerson: { type: Type.NUMBER },
                compromiseExplanation: { type: Type.STRING },
                matchedTravellers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                included: { type: Type.BOOLEAN },
              },
              required: [
                'id',
                'title',
                'description',
                'timeSlot',
                'estimatedCostPerPerson',
                'compromiseExplanation',
                'matchedTravellers',
                'included',
              ],
            },
          },
        },
        required: ['dayNumber', 'date', 'theme', 'activities'],
      },
    },
  },
  required: [
    'chosenDestination',
    'overview',
    'compromiseSummary',
    'generatedAt',
    'days',
  ],
};

export function buildItineraryPrompt(input: GenerateItineraryRequest): string {
  const travellerLines = input.travellers
    .map(
      (t) =>
        `- ${t.name}: budget ${t.budget} ${input.trip.currency}, interests: ${t.interests.join(', ')}, preferences: ${t.preferences || 'none specified'}`,
    )
    .join('\n');

  return [
    'Create a realistic, balanced group travel itinerary as JSON.',
    `Candidate destinations: ${input.trip.destinations.join(' | ')}`,
    `Travel dates: ${input.trip.startDate} to ${input.trip.endDate}`,
    `Group size: ${input.trip.groupSize}`,
    `Currency for ALL estimatedCostPerPerson values: ${input.trip.currency}`,
    'Travellers:',
    travellerLines,
    'Rules:',
    '- Pick the best destination from the candidate list and explain how conflicting budgets and interests are balanced.',
    '- Include 2 to 3 activities per day with unique ids (e.g. "day1-act1") and realistic estimatedCostPerPerson >= 0.',
    '- Consider every traveller’s interests and budget across the itinerary.',
    '- Set included to true for every activity by default.',
    '- Set generatedAt to the current ISO-8601 timestamp.',
  ].join('\n');
}
