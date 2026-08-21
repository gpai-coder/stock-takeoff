"use client";

import { Fragment, useState } from "react";
import {
  formatCompactNumber,
  formatCurrency,
  formatMultiple,
  formatPercent,
} from "@/lib/format";
import type { StockRow } from "@/lib/types";

interface ScreenerTableProps {
  stocks: StockRow[];
  relativeVolumeSessionAdjusted?: boolean;
}

function changeClass(value: number | null): string {
  if (value == null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-background">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function StockDetail({ stock }: { stock: StockRow }) {
  return (
    <div className="grid gap-4 border-t border-panel-border bg-background/40 px-4 py-4 sm:grid-cols-2">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Score inputs</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">52-week high</dt>
          <dd>{formatCurrency(stock.fiftyTwoWeekHigh)}</dd>
          <dt className="text-muted">Distance to high</dt>
          <dd>
            {stock.distanceFromHighPct == null
              ? "—"
              : `${stock.distanceFromHighPct.toFixed(2)}%`}
          </dd>
          <dt className="text-muted">Today&apos;s volume</dt>
          <dd>{formatCompactNumber(stock.volume)}</dd>
          <dt className="text-muted">3-mo avg volume</dt>
          <dd>{formatCompactNumber(stock.avgVolume)}</dd>
          <dt className="text-muted">50-day MA</dt>
          <dd>{formatCurrency(stock.fiftyDayAverage)}</dd>
          <dt className="text-muted">Trend check</dt>
          <dd>
            {stock.aboveFiftyDayMa == null
              ? "Unavailable"
              : stock.aboveFiftyDayMa
                ? "Above 50-day MA"
                : "Below 50-day MA"}
          </dd>
        </dl>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Score breakdown</h4>
        <div className="space-y-3">
          <ScoreBar label="Proximity to 52w high" value={stock.scoreBreakdown.proximityScore} />
          <ScoreBar label="Relative volume" value={stock.scoreBreakdown.volumeScore} />
          <ScoreBar label="Trend (50-day MA)" value={stock.scoreBreakdown.trendScore} />
        </div>
        {stock.missingFields.length > 0 && (
          <p className="text-xs text-warning">
            Missing fields: {stock.missingFields.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function ScreenerTable({
  stocks,
  relativeVolumeSessionAdjusted = false,
}: ScreenerTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (stocks.length === 0) {
    return (
      <section className="rounded-2xl border border-panel-border bg-panel p-8 text-center">
        <h3 className="text-lg font-semibold">No matches right now</h3>
        <p className="mt-2 text-sm text-muted">
          Nothing in the S&amp;P 500 met these filters with live Yahoo Finance data. Try widening the distance-to-high or volume thresholds.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-panel-border bg-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-panel-border bg-background/50 text-left text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Market cap</th>
              <th className="px-4 py-3">
                Rel vol
                {relativeVolumeSessionAdjusted && (
                  <span
                    className="ml-1 normal-case tracking-normal text-muted"
                    title="Adjusted for elapsed regular-session time; 1.0× means on pace for an average day"
                  >
                    *
                  </span>
                )}
              </th>
              <th className="px-4 py-3">To 52w high</th>
              <th className="px-4 py-3">Score</th>
              <th className="hidden px-4 py-3 lg:table-cell">Setup</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isOpen = expanded === stock.symbol;
              return (
                <Fragment key={stock.symbol}>
                  <tr
                    className="cursor-pointer border-b border-panel-border transition hover:bg-background/40"
                    onClick={() => setExpanded(isOpen ? null : stock.symbol)}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-accent">{stock.symbol}</div>
                      <div className="max-w-48 truncate text-xs text-muted">{stock.name}</div>
                    </td>
                    <td className="px-4 py-3 align-top font-mono">{formatCurrency(stock.price)}</td>
                    <td className={`px-4 py-3 align-top font-mono ${changeClass(stock.changePct)}`}>
                      {formatPercent(stock.changePct)}
                    </td>
                    <td className="px-4 py-3 align-top font-mono">
                      {stock.marketCap == null ? "Unavailable" : `$${formatCompactNumber(stock.marketCap)}`}
                    </td>
                    <td className="px-4 py-3 align-top font-mono">
                      {formatMultiple(stock.relativeVolume)}
                    </td>
                    <td className="px-4 py-3 align-top font-mono">
                      {stock.distanceFromHighPct == null
                        ? "—"
                        : `${stock.distanceFromHighPct.toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="inline-flex min-w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 px-2 py-1 font-mono font-semibold text-accent">
                        {stock.score.toFixed(1)}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 align-top text-muted lg:table-cell">
                      {stock.reason}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-panel-border">
                      <td colSpan={8} className="p-0">
                        <StockDetail stock={stock} />
                        <p className="border-t border-panel-border px-4 py-3 text-sm text-muted lg:hidden">
                          {stock.reason}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {relativeVolumeSessionAdjusted && (
        <p className="border-t border-panel-border px-4 py-2 text-xs text-muted">
          * Relative volume is session-adjusted during regular hours (today&apos;s volume vs. the
          expected share of a typical day elapsed since 9:30 ET). 1.0× means on pace for an average
          day.
        </p>
      )}
    </section>
  );
}
