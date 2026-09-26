"use client";

import { useState } from "react";
import { useWatchlist } from "@/components/WatchlistProvider";
import { normalizeTicker } from "@/lib/symbols";

export function AddTickerForm() {
  const { add, has } = useWatchlist();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const symbol = normalizeTicker(value);
    if (!symbol) {
      setMessage("Enter a ticker like AAPL.");
      return;
    }
    if (has(symbol)) {
      setMessage(`${symbol} is already on your watchlist.`);
      setValue("");
      return;
    }
    add(symbol);
    setValue("");
    setMessage(`Added ${symbol}.`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <span className="text-muted">Add a ticker</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="AAPL"
          aria-label="Ticker to add"
          className="rounded-lg border border-panel-border bg-background px-3 py-2 uppercase"
          autoCapitalize="characters"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/20 sm:mt-6"
      >
        Add to watchlist
      </button>
      {message && <p className="text-sm text-muted sm:mt-6">{message}</p>}
    </form>
  );
}
