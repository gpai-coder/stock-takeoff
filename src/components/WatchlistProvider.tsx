"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { normalizeTicker } from "@/lib/symbols";

export const WATCHLIST_STORAGE_KEY = "takeoff-watchlist";

interface WatchlistContextValue {
  symbols: string[];
  ready: boolean;
  has: (symbol: string) => boolean;
  add: (symbol: string) => string | null;
  remove: (symbol: string) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function readStoredSymbols(): string[] {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const symbols: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const symbol = normalizeTicker(item);
      if (!symbol || symbols.includes(symbol)) continue;
      symbols.push(symbol);
    }
    return symbols;
  } catch {
    return [];
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSymbols(readStoredSymbols());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(symbols));
  }, [ready, symbols]);

  const add = useCallback((value: string) => {
    const symbol = normalizeTicker(value);
    if (!symbol) return null;
    setSymbols((current) => (current.includes(symbol) ? current : [...current, symbol]));
    return symbol;
  }, []);

  const remove = useCallback((value: string) => {
    const symbol = normalizeTicker(value);
    if (!symbol) return;
    setSymbols((current) => current.filter((item) => item !== symbol));
  }, []);

  const has = useCallback(
    (value: string) => {
      const symbol = normalizeTicker(value);
      return symbol != null && symbols.includes(symbol);
    },
    [symbols],
  );

  const value = useMemo(
    () => ({ symbols, ready, has, add, remove }),
    [symbols, ready, has, add, remove],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const value = useContext(WatchlistContext);
  if (!value) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return value;
}
