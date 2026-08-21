"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { filtersToSearchParams } from "@/lib/filters";
import { parseMarketCapInput } from "@/lib/format";
import type { ScreenerFilters } from "@/lib/types";
import { DEFAULT_FILTERS, MARKET_CAP_PRESETS } from "@/lib/types";

interface FilterBarProps {
  filters: ScreenerFilters;
}

function marketCapLabel(value: number): string {
  const preset = MARKET_CAP_PRESETS.find((item) => item.value === value);
  if (preset) return preset.label;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}B+`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M+`;
  return `$${value.toLocaleString()}+`;
}

export function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters);
  const [customCap, setCustomCap] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(filters);
    const preset = MARKET_CAP_PRESETS.some((item) => item.value === filters.minMarketCap);
    if (!preset) {
      setCustomCap(String(filters.minMarketCap));
    }
  }, [filters]);

  const capSelection = useMemo(() => {
    const preset = MARKET_CAP_PRESETS.find((item) => item.value === draft.minMarketCap);
    return preset ? String(preset.value) : "custom";
  }, [draft.minMarketCap]);

  function applyFilters(next: ScreenerFilters) {
    startTransition(() => {
      const params = filtersToSearchParams(next);
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  }

  function update<K extends keyof ScreenerFilters>(key: K, value: ScreenerFilters[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    applyFilters(next);
  }

  function resetFilters() {
    setCustomCap("");
    setDraft(DEFAULT_FILTERS);
    applyFilters(DEFAULT_FILTERS);
  }

  return (
    <section className="rounded-2xl border border-panel-border bg-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
            Filters
          </h2>
          <p className="mt-1 text-sm text-muted">
            Defaults target $5B+ names within {DEFAULT_FILTERS.maxDistanceFromHigh}% of their 52-week high with elevated volume and price above the 50-day average.
          </p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-lg border border-panel-border px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
        >
          Reset defaults
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Minimum market cap</span>
          <select
            value={capSelection}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "custom") return;
              update("minMarketCap", Number(value));
            }}
            className="rounded-lg border border-panel-border bg-background px-3 py-2"
          >
            {MARKET_CAP_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {capSelection === "custom" && (
            <input
              value={customCap}
              onChange={(event) => setCustomCap(event.target.value)}
              onBlur={() => {
                const parsed = parseMarketCapInput(customCap);
                if (parsed) update("minMarketCap", parsed);
              }}
              placeholder="e.g. 7B or 2500000000"
              className="rounded-lg border border-panel-border bg-background px-3 py-2"
            />
          )}
          <span className="text-xs text-muted">Active: {marketCapLabel(draft.minMarketCap)}</span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Min price ($)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.minPrice || ""}
            onChange={(event) =>
              update("minPrice", Number(event.target.value) || 0)
            }
            className="rounded-lg border border-panel-border bg-background px-3 py-2"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Min avg volume (3 mo)</span>
          <input
            type="number"
            min={0}
            step={100000}
            value={draft.minAvgVolume || ""}
            onChange={(event) =>
              update("minAvgVolume", Number(event.target.value) || 0)
            }
            className="rounded-lg border border-panel-border bg-background px-3 py-2"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Max distance from 52w high (%)</span>
          <input
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={draft.maxDistanceFromHigh}
            onChange={(event) =>
              update("maxDistanceFromHigh", Number(event.target.value) || 0)
            }
            className="rounded-lg border border-panel-border bg-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Min relative volume</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={draft.minRelativeVolume}
            onChange={(event) =>
              update("minRelativeVolume", Number(event.target.value) || 0)
            }
            className="rounded-lg border border-panel-border bg-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Exchange</span>
          <select
            value={draft.exchange}
            onChange={(event) =>
              update("exchange", event.target.value as ScreenerFilters["exchange"])
            }
            className="rounded-lg border border-panel-border bg-background px-3 py-2"
          >
            <option value="all">All US exchanges</option>
            <option value="NYSE">NYSE</option>
            <option value="NASDAQ">NASDAQ</option>
          </select>
        </label>

        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={draft.requireAboveMa}
            onChange={(event) => update("requireAboveMa", event.target.checked)}
            className="size-4 rounded border-panel-border bg-background accent-accent"
          />
          <span>Require price above 50-day MA</span>
        </label>
      </div>

      {isPending && (
        <p className="mt-3 text-sm text-accent">Updating results…</p>
      )}
    </section>
  );
}
