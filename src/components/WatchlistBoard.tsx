"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddTickerForm } from "@/components/AddTickerForm";
import { useWatchlist } from "@/components/WatchlistProvider";
import {
  formatCurrency,
  formatMultiple,
  formatPercent,
} from "@/lib/format";
import type { StockRow } from "@/lib/types";

interface WatchlistResponse {
  stocks?: StockRow[];
  missing?: string[];
  error?: string;
  relativeVolumeSessionAdjusted?: boolean;
}

function changeClass(value: number | null): string {
  if (value == null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

export function WatchlistBoard() {
  const { symbols, ready, remove } = useWatchlist();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionAdjusted, setSessionAdjusted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (symbols.length === 0) {
      setStocks([]);
      setMissing([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const query = encodeURIComponent(symbols.join(","));
    fetch(`/api/watchlist?symbols=${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as WatchlistResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load watchlist quotes.");
        }
        setStocks(payload.stocks ?? []);
        setMissing(payload.missing ?? []);
        setError(payload.error ?? null);
        setSessionAdjusted(payload.relativeVolumeSessionAdjusted === true);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setStocks([]);
        setMissing([]);
        setError(
          fetchError instanceof Error ? fetchError.message : "Unable to load watchlist quotes.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [ready, symbols]);

  const bySymbol = new Map(stocks.map((stock) => [stock.symbol.toUpperCase(), stock]));

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Saved in this browser
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Watchlist</h1>
        <p className="max-w-3xl text-base text-muted">
          Symbols stay on this device after a refresh. Quotes, takeoff score, relative volume, and
          distance from the 52-week high load even when a name is filtered out of the screener.
        </p>
      </header>

      <section className="rounded-2xl border border-panel-border bg-panel p-4 sm:p-5">
        <AddTickerForm />
      </section>

      {!ready || loading ? (
        <p className="text-sm text-accent">Loading watchlist…</p>
      ) : symbols.length === 0 ? (
        <section className="rounded-2xl border border-panel-border bg-panel p-8 text-center">
          <h2 className="text-lg font-semibold">No symbols saved yet</h2>
          <p className="mt-2 text-sm text-muted">
            Add a ticker above, or choose Watch on a screener row. The list is stored in this
            browser and is still here after you refresh.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-panel-border bg-panel">
          {error && (
            <p className="border-b border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
              {error}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-panel-border bg-background/50 text-left text-xs uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">
                    Rel vol
                    {sessionAdjusted && (
                      <span className="ml-1 normal-case tracking-normal" title="Session-adjusted">
                        *
                      </span>
                    )}
                  </th>
                  <th className="px-4 py-3">To 52w high</th>
                  <th className="px-4 py-3"> </th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((symbol) => {
                  const stock = bySymbol.get(symbol);
                  if (!stock) {
                    const unavailable = missing.includes(symbol) || !loading;
                    return (
                      <tr key={symbol} className="border-b border-panel-border">
                        <td className="px-4 py-3 font-semibold text-accent">{symbol}</td>
                        <td className="px-4 py-3 text-muted" colSpan={4}>
                          {unavailable ? "Unavailable — no quote for this symbol." : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => remove(symbol)}
                            className="rounded-lg border border-panel-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={symbol} className="border-b border-panel-border">
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/ticker/${stock.symbol}`}
                          className="font-semibold text-accent underline-offset-2 hover:underline"
                        >
                          {stock.symbol}
                        </Link>
                        <div className="max-w-48 truncate text-xs text-muted">{stock.name}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono">{formatCurrency(stock.price)}</div>
                        <div className={`font-mono text-xs ${changeClass(stock.changePct)}`}>
                          {formatPercent(stock.changePct)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="inline-flex min-w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 px-2 py-1 font-mono font-semibold text-accent">
                          {stock.score.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-mono">
                        {formatMultiple(stock.relativeVolume)}
                      </td>
                      <td className="px-4 py-3 align-top font-mono">
                        {stock.distanceFromHighPct == null
                          ? "—"
                          : `${stock.distanceFromHighPct.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          type="button"
                          onClick={() => remove(symbol)}
                          className="rounded-lg border border-panel-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
