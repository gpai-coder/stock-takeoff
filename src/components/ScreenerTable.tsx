"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { StockScoreDetail } from "@/components/StockScoreDetail";
import { useWatchlist } from "@/components/WatchlistProvider";
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

export function ScreenerTable({
  stocks,
  relativeVolumeSessionAdjusted = false,
}: ScreenerTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { has, add, remove } = useWatchlist();

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
                      <Link
                        href={`/ticker/${stock.symbol}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-semibold text-accent underline-offset-2 hover:underline"
                      >
                        {stock.symbol}
                      </Link>
                      <div className="max-w-48 truncate text-xs text-muted">{stock.name}</div>
                      <button
                        type="button"
                        aria-label={
                          has(stock.symbol)
                            ? `Remove ${stock.symbol} from watchlist`
                            : `Add ${stock.symbol} to watchlist`
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          if (has(stock.symbol)) remove(stock.symbol);
                          else add(stock.symbol);
                        }}
                        className="mt-1 rounded border border-panel-border px-2 py-0.5 text-xs text-muted hover:border-accent hover:text-foreground"
                      >
                        {has(stock.symbol) ? "Remove" : "Watch"}
                      </button>
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
                        <div className="border-t border-panel-border bg-background/40 px-4 py-4">
                          <StockScoreDetail stock={stock} />
                        </div>
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
