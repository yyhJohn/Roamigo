import type { TripDetailDto } from '../contracts/tripDetail.types.js';
import { formatMinorCurrency, fromMinorUnits } from './money.js';

const DANGEROUS_CSV_PREFIX = /^[\s]*[=+\-@]|^[\t\r]/;

export function slugifyFilename(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || 'roamigo-trip';
}

export function sanitizeCsvCell(raw: string): string {
  const neutralized = DANGEROUS_CSV_PREFIX.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function serializeExpensesCsv(detail: TripDetailDto): string {
  const memberById = new Map(detail.members.map((m) => [m.userId, m]));
  const headers = [
    'Date',
    'Category',
    'Title',
    'PaidByName',
    'PaidByEmail',
    'Currency',
    'AmountMinor',
    'AmountMajor',
    'SplitMode',
    'ParticipantShares',
    'Notes',
  ];

  const rows: string[] = [headers.join(',')];
  for (const exp of detail.expenses) {
    const payer = memberById.get(exp.paidByUserId);
    const sharesDesc = exp.splits
      .map((s) => {
        const member = memberById.get(s.userId);
        const name = member?.displayName ?? 'Member';
        return `${name}: ${formatMinorCurrency(s.shareMinor, exp.currency)}`;
      })
      .join(' | ');

    const cols = [
      sanitizeCsvCell(exp.incurredOn),
      sanitizeCsvCell(exp.category),
      sanitizeCsvCell(exp.title),
      sanitizeCsvCell(payer?.displayName ?? 'Member'),
      sanitizeCsvCell(payer?.email ?? 'Redacted'),
      sanitizeCsvCell(exp.currency),
      String(exp.amountMinor),
      fromMinorUnits(exp.amountMinor).toFixed(2),
      sanitizeCsvCell(exp.splitMode),
      sanitizeCsvCell(sharesDesc),
      sanitizeCsvCell(exp.notes),
    ];
    rows.push(cols.join(','));
  }

  return `${rows.join('\r\n')}\r\n`;
}

function escapeIcsText(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function resolveSlotTimes(
  timeSlot: string,
  startTime: string | null,
  endTime: string | null,
): { startHhMmSs: string; endHhMmSs: string } {
  const cleanClock = (v: string | null): string | null => {
    if (!v || !/^\d{2}:\d{2}$/.test(v)) return null;
    return `${v.replace(':', '')}00`;
  };
  const customStart = cleanClock(startTime);
  const customEnd = cleanClock(endTime);
  if (customStart && customEnd) {
    return { startHhMmSs: customStart, endHhMmSs: customEnd };
  }
  if (timeSlot === 'AFTERNOON') {
    return { startHhMmSs: '133000', endHhMmSs: '170000' };
  }
  if (timeSlot === 'EVENING') {
    return { startHhMmSs: '190000', endHhMmSs: '213000' };
  }
  return { startHhMmSs: '093000', endHhMmSs: '120000' };
}

export function serializeItineraryIcs(
  detail: TripDetailDto,
  dtStamp = '20260101T000000Z',
): string {
  const { summary, itinerary } = detail;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Roamigo//Collaborative Group Travel//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(summary.title)}`,
  ];

  for (const day of itinerary?.days ?? []) {
    const compactDate = day.date.replace(/-/g, '');
    if (!/^\d{8}$/.test(compactDate)) continue;

    for (const act of day.activities) {
      if (!act.included || act.decisionStatus === 'EXCLUDED') continue;
      const { startHhMmSs, endHhMmSs } = resolveSlotTimes(
        act.timeSlot,
        act.startTime,
        act.endTime,
      );
      const costText = formatMinorCurrency(
        act.estimatedCostMinor,
        summary.currency,
        { est: true },
      );
      const descParts = [
        act.description,
        `Estimated cost: ${costText}`,
        act.compromiseExplanation ? `Group fit: ${act.compromiseExplanation}` : '',
      ].filter(Boolean);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:roamigo-${summary.id}-${act.id}@roamigo.app`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${compactDate}T${startHhMmSs}`);
      lines.push(`DTEND:${compactDate}T${endHhMmSs}`);
      lines.push(`SUMMARY:${escapeIcsText(act.title)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`);
      if (act.locationName) {
        lines.push(`LOCATION:${escapeIcsText(act.locationName)}`);
      }
      if (act.lat !== null && act.lng !== null) {
        lines.push(`GEO:${act.lat};${act.lng}`);
      }
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
