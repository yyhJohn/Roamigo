import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import {
  formatMinorCurrency,
  fromMinorUnits,
  toMinorUnits,
} from '../../lib/domain/money';
import { Card } from '../ui/Card';

export function BudgetAnalyticsCharts({ detail }: { detail: TripDetailDto }) {
  const currency = detail.summary.currency;
  const memberCount = Math.max(1, detail.members.length);

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const exp of detail.expenses) {
      totals.set(exp.category, (totals.get(exp.category) ?? 0) + exp.amountMinor);
    }
    return Array.from(totals.entries()).map(([category, minor]) => ({
      category: category.slice(0, 10),
      major: fromMinorUnits(minor),
      minor,
    }));
  }, [detail.expenses]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; plannedMinor: number; actualMinor: number }>();
    for (const day of detail.itinerary?.days ?? []) {
      const perPersonEst = day.activities
        .filter((a) => a.included)
        .reduce((acc, a) => acc + a.estimatedCostMinor, 0);
      map.set(day.date, {
        date: day.date.slice(5),
        plannedMinor: perPersonEst * memberCount,
        actualMinor: 0,
      });
    }
    for (const exp of detail.expenses) {
      const existing = map.get(exp.incurredOn) ?? {
        date: exp.incurredOn.slice(5),
        plannedMinor: 0,
        actualMinor: 0,
      };
      existing.actualMinor += exp.amountMinor;
      map.set(exp.incurredOn, existing);
    }
    return Array.from(map.values()).map((row) => ({
      date: row.date,
      plannedMajor: fromMinorUnits(row.plannedMinor),
      actualMajor: fromMinorUnits(row.actualMinor),
    }));
  }, [detail.itinerary, detail.expenses, memberCount]);

  return (
    <div
      className="grid gap-4 lg:grid-cols-2"
      data-testid="budget-analytics-charts"
    >
      <Card className="space-y-2 p-4">
        <h3 className="font-display text-sm font-bold">
          Logged Spend by Category
        </h3>
        {categoryData.length === 0 ? (
          <p className="py-10 text-center text-xs text-[var(--text-secondary)]">
            Log an expense to view category breakdown.
          </p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) =>
                    formatMinorCurrency(
                      toMinorUnits(typeof val === 'number' ? val : Number(val ?? 0)),
                      currency,
                    )
                  }
                />
                <Bar dataKey="major" name="Actual Spend" fill="#103D3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <h3 className="font-display text-sm font-bold">
          Daily Planned (est.) vs. Actual Group Spend
        </h3>
        {dailyData.length === 0 ? (
          <p className="py-10 text-center text-xs text-[var(--text-secondary)]">
            Add itinerary days or expenses to compare daily spend.
          </p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) =>
                    formatMinorCurrency(
                      toMinorUnits(typeof val === 'number' ? val : Number(val ?? 0)),
                      currency,
                    )
                  }
                />
                <Bar dataKey="plannedMajor" name="Planned Est." fill="#A7F3CF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actualMajor" name="Actual Logged" fill="#103D3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
