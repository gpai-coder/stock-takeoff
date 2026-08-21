import type { ExchangeFilter, ScreenerFilters, ScreenerSearchParams } from "./types";
import { DEFAULT_FILTERS } from "./types";

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseExchange(value: string | undefined): ExchangeFilter {
  if (value === "NYSE" || value === "NASDAQ" || value === "all") return value;
  return DEFAULT_FILTERS.exchange;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function parseFilters(params: ScreenerSearchParams): ScreenerFilters {
  return {
    minMarketCap: parseNumber(params.minMarketCap, DEFAULT_FILTERS.minMarketCap),
    minPrice: parseNumber(params.minPrice, DEFAULT_FILTERS.minPrice),
    minAvgVolume: parseNumber(params.minAvgVolume, DEFAULT_FILTERS.minAvgVolume),
    maxDistanceFromHigh: parseNumber(
      params.maxDistanceFromHigh,
      DEFAULT_FILTERS.maxDistanceFromHigh,
    ),
    minRelativeVolume: parseNumber(
      params.minRelativeVolume,
      DEFAULT_FILTERS.minRelativeVolume,
    ),
    exchange: parseExchange(params.exchange),
    requireAboveMa: parseBoolean(params.requireAboveMa, DEFAULT_FILTERS.requireAboveMa),
  };
}

export function filtersToSearchParams(filters: ScreenerFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("minMarketCap", String(filters.minMarketCap));
  if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
  if (filters.minAvgVolume > 0) params.set("minAvgVolume", String(filters.minAvgVolume));
  params.set("maxDistanceFromHigh", String(filters.maxDistanceFromHigh));
  params.set("minRelativeVolume", String(filters.minRelativeVolume));
  if (filters.exchange !== "all") params.set("exchange", filters.exchange);
  if (!filters.requireAboveMa) params.set("requireAboveMa", "false");
  return params;
}

export function classifyExchange(fullExchangeName: string | undefined): "NYSE" | "NASDAQ" | "OTHER" {
  if (!fullExchangeName) return "OTHER";
  const name = fullExchangeName.toLowerCase();
  if (name.includes("nasdaq")) return "NASDAQ";
  if (name.includes("nyse") || name.includes("new york")) return "NYSE";
  return "OTHER";
}

export function passesFilters(
  stock: {
    price: number | null;
    marketCap: number | null;
    avgVolume: number | null;
    relativeVolume: number | null;
    distanceFromHighPct: number | null;
    aboveFiftyDayMa: boolean | null;
    exchange: string;
  },
  filters: ScreenerFilters,
): boolean {
  if (filters.minMarketCap > 0) {
    if (stock.marketCap == null || stock.marketCap < filters.minMarketCap) return false;
  }
  if (filters.minPrice > 0) {
    if (stock.price == null || stock.price < filters.minPrice) return false;
  }
  if (filters.minAvgVolume > 0) {
    if (stock.avgVolume == null || stock.avgVolume < filters.minAvgVolume) return false;
  }
  if (filters.maxDistanceFromHigh >= 0 && stock.distanceFromHighPct != null) {
    if (stock.distanceFromHighPct > filters.maxDistanceFromHigh) return false;
  }
  if (filters.minRelativeVolume > 0) {
    if (stock.relativeVolume == null || stock.relativeVolume < filters.minRelativeVolume) {
      return false;
    }
  }
  if (filters.requireAboveMa && stock.aboveFiftyDayMa === false) return false;
  if (filters.exchange !== "all") {
    const bucket = classifyExchange(stock.exchange);
    if (bucket !== filters.exchange) return false;
  }
  return true;
}
