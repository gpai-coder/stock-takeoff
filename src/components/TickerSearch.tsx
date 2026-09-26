"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeTicker } from "@/lib/symbols";

export function TickerSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const symbol = normalizeTicker(value);
    if (!symbol) {
      setMessage("Enter a ticker like AAPL.");
      return;
    }
    setMessage(null);
    setValue("");
    router.push(`/ticker/${symbol}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input
        id="symbol-search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Look up ticker"
        aria-label="Symbol search"
        className="w-36 rounded-lg border border-panel-border bg-background px-3 py-1.5 text-sm uppercase"
      />
      <button
        type="submit"
        className="rounded-lg border border-panel-border px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
      >
        Open
      </button>
      {message && <span className="text-xs text-warning">{message}</span>}
    </form>
  );
}
