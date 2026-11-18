import { Users } from 'lucide-react';
import type { TravellerPreferenceDto } from '../../lib/contracts/tripDetail.types';
import { formatMinorCurrency } from '../../lib/domain/money';
import type { Currency } from '../../lib/schemas';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function TravellerProfilesCard({
  preferences,
  currency,
}: {
  preferences: TravellerPreferenceDto[];
  currency: Currency;
}) {
  return (
    <Card className="space-y-2.5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Traveller Profiles
        </h3>
        <Badge variant="outline">
          <Users className="mr-1 h-3 w-3" />
          {preferences.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {preferences.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5 text-xs"
          >
            <div className="flex items-center justify-between font-semibold">
              <span>{p.displayName}</span>
              <span>{formatMinorCurrency(p.budgetMinor, currency)} cap</span>
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              {p.pace} · {p.interests.slice(0, 3).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
