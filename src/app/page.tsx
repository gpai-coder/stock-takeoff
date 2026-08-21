import { FilterBar } from "@/components/FilterBar";
import { ScreenerTable } from "@/components/ScreenerTable";
import { formatDateTime, formatMarketState } from "@/lib/format";
import { getScreenerResults } from "@/lib/screener";
import type { ScreenerSearchParams } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface HomePageProps {
  searchParams: Promise<ScreenerSearchParams>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const result = await getScreenerResults(params);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(61,214,198,0.12),_transparent_35%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            US equities screener
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Takeoff</h1>
          <p className="max-w-3xl text-base text-muted sm:text-lg">
            Spot S&amp;P 500 names setting up for a breakout: trading near their 52-week high on
            elevated relative volume while holding above the 50-day moving average.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span className="rounded-full border border-panel-border px-3 py-1">
              Universe: S&amp;P 500 ({result.universeSize} symbols)
            </span>
            <span className="rounded-full border border-panel-border px-3 py-1">
              Matches: {result.matchedCount}
            </span>
            <span className="rounded-full border border-panel-border px-3 py-1">
              As of {formatDateTime(result.asOf)} ET
            </span>
            <span className="rounded-full border border-panel-border px-3 py-1">
              {formatMarketState(result.marketState)}
            </span>
          </div>
        </header>

        <FilterBar filters={result.filters} />

        {result.error && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              result.partial
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-negative/40 bg-negative/10 text-negative"
            }`}
          >
            {result.error}
          </div>
        )}

        <ScreenerTable stocks={result.stocks} />

        <footer className="border-t border-panel-border pt-4 text-xs leading-relaxed text-muted">
          <p>
            Quotes and fundamentals come from Yahoo Finance via an unofficial API wrapper. Values
            can be delayed outside market hours. Takeoff score weights proximity to the 52-week high
            (40%), relative volume (35%), and trend vs. the 50-day MA (25%). This is research
            tooling, not investment advice.
          </p>
        </footer>
      </div>
    </main>
  );
}
