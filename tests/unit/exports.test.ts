import { describe, expect, it } from 'vitest';
import type { TripDetailDto } from '../../src/lib/contracts/tripDetail.types';
import {
  sanitizeCsvCell,
  serializeExpensesCsv,
  serializeItineraryIcs,
  slugifyFilename,
} from '../../src/lib/domain/exports';

describe('Milestone 9 Unit: CSV formula-injection defense & RFC 5545 ICS export', () => {
  it('neutralizes spreadsheet formula prefixes and escapes RFC 4180 characters', () => {
    expect(sanitizeCsvCell('=cmd|\'/C calc\'!A0')).toBe('\'=cmd|\'/C calc\'!A0');
    expect(sanitizeCsvCell('  +SUM(A1:A5)')).toBe('\'  +SUM(A1:A5)');
    expect(sanitizeCsvCell('-10+20')).toBe('\'-10+20');
    expect(sanitizeCsvCell('@IMPORTXML("http://evil")')).toBe(
      '"\'@IMPORTXML(""http://evil"")"',
    );
    expect(sanitizeCsvCell('\t=1+1')).toBe('\'\t=1+1');
    expect(sanitizeCsvCell('Tapas, Wine & "Olives"')).toBe(
      '"Tapas, Wine & ""Olives"""',
    );
    expect(slugifyFilename('Barcelona Spring Escape! 2026')).toBe(
      'barcelona-spring-escape-2026',
    );
  });

  it('serializes valid CRLF RFC 5545 VCALENDAR skipping excluded activities & redacting emails in CSV', () => {
    const detail: TripDetailDto = {
      summary: {
        id: 'trip-1',
        title: 'Lisbon Weekend',
        destinations: ['Lisbon'],
        departureCity: 'London',
        startDate: '2026-07-10',
        endDate: '2026-07-11',
        groupSize: 2,
        currency: 'EUR',
        status: 'UPCOMING',
        wizardStep: 10,
        coverImageKey: 'lisbon',
        isDemo: false,
        version: 2,
        myRole: 'MEMBER',
        memberCount: 2,
        membersPreview: [],
        estimatedPerPersonMinor: 2500,
        sharedCapMinor: 80000,
        hasItinerary: true,
      },
      isDemoReadOnly: false,
      wizardDraftJson: null,
      members: [
        {
          memberId: 'm1',
          userId: 'u1',
          displayName: 'Clara',
          email: null,
          avatarColor: '#103D3B',
          role: 'OWNER',
        },
      ],
      invitations: [],
      preferences: [],
      itinerary: {
        id: 'it-1',
        chosenDestination: 'Lisbon',
        activeVersionId: 'v-1',
        versionNumber: 1,
        overview: 'Sunny coastal tram & pastel de nata weekend.',
        compromiseSummary: 'Balanced food and views.',
        source: 'AI',
        days: [
          {
            id: 'd1',
            dayNumber: 1,
            date: '2026-07-10',
            theme: 'Alfama & Belém',
            activities: [
              {
                id: 'act-1',
                dayId: 'd1',
                stableKey: 'alfama-walk',
                sortOrder: 0,
                title: 'Alfama Miradouro Walk',
                description: 'Scenic morning walk.',
                category: 'CULTURE',
                timeSlot: 'MORNING',
                startTime: '10:00',
                endTime: '12:00',
                estimatedCostMinor: 2500,
                locationName: 'Alfama, Lisbon',
                lat: 38.7123,
                lng: -9.1301,
                coordSource: 'curated',
                compromiseExplanation: 'Great views on budget.',
                matchedTravellers: ['Clara'],
                included: true,
                decisionStatus: 'LOCKED_IN',
                votes: [],
              },
              {
                id: 'act-2',
                dayId: 'd1',
                stableKey: 'excluded-club',
                sortOrder: 1,
                title: 'Excluded Late Club',
                description: 'Skipped by group.',
                category: 'NIGHTLIFE',
                timeSlot: 'EVENING',
                startTime: null,
                endTime: null,
                estimatedCostMinor: 5000,
                locationName: null,
                lat: null,
                lng: null,
                coordSource: 'unverified',
                compromiseExplanation: '',
                matchedTravellers: [],
                included: false,
                decisionStatus: 'EXCLUDED',
                votes: [],
              },
            ],
          },
        ],
      },
      budget: null,
      expenses: [
        {
          id: 'exp-1',
          paidByUserId: 'u1',
          category: 'FOOD',
          title: '=SUM(1,2) Pastéis',
          amountMinor: 1200,
          currency: 'EUR',
          splitMode: 'EQUAL',
          incurredOn: '2026-07-10',
          notes: '',
          splits: [{ userId: 'u1', shareMinor: 1200, basisPoints: null }],
        },
      ],
      settlements: [],
    };

    const ics = serializeItineraryIcs(detail, '20260701T120000Z');
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('SUMMARY:Alfama Miradouro Walk\r\n');
    expect(ics).toContain('DTSTART:20260710T100000\r\n');
    expect(ics).toContain('GEO:38.7123;-9.1301\r\n');
    expect(ics).not.toContain('Excluded Late Club');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);

    const csv = serializeExpensesCsv(detail);
    expect(csv).toContain("'=SUM(1,2) Pastéis");
    expect(csv).toContain('Redacted');
  });
});
