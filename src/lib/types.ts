export type ExchangeFilter = "all" | "NYSE" | "NASDAQ";

export interface ScreenerFilters {
  minMarketCap: number;
  minPrice: number;
  minAvgVolume: number;
  maxDistanceFromHigh: number;
  minRelativeVolume: number;
  exchange: ExchangeFilter;
  requireAboveMa: boolean;
}

export const DEFAULT_FILTERS: ScreenerFilters = {
  minMarketCap: 5_000_000_000,
  minPrice: 0,
  minAvgVolume: 0,
  maxDistanceFromHigh: 8,
  minRelativeVolume: 1.0,
  exchange: "all",
  requireAboveMa: true,
};

export const MARKET_CAP_PRESETS = [
  { label: "$1B+", value: 1_000_000_000 },
  { label: "$5B+", value: 5_000_000_000 },
  { label: "$10B+", value: 10_000_000_000 },
  { label: "$50B+", value: 50_000_000_000 },
] as const;

export interface ScoreInputs {
  distanceFromHighPct: number | null;
  relativeVolume: number | null;
  aboveFiftyDayMa: boolean | null;
  priceToMaPct: number | null;
}

export interface ScoreBreakdown {
  proximityScore: number;
  volumeScore: number;
  trendScore: number;
}

export interface StockRow {
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  avgVolume: number | null;
  volume: number | null;
  relativeVolume: number | null;
  fiftyTwoWeekHigh: number | null;
  distanceFromHighPct: number | null;
  fiftyDayAverage: number | null;
  aboveFiftyDayMa: boolean | null;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  scoreInputs: ScoreInputs;
  reason: string;
  quoteTime: number | null;
  marketState: string | null;
  missingFields: string[];
}

export interface ScreenerResult {
  asOf: string;
  marketState: string | null;
  universeSize: number;
  matchedCount: number;
  filters: ScreenerFilters;
  stocks: StockRow[];
  error?: string;
  partial?: boolean;
}

export interface ScreenerSearchParams {
  minMarketCap?: string;
  minPrice?: string;
  minAvgVolume?: string;
  maxDistanceFromHigh?: string;
  minRelativeVolume?: string;
  exchange?: string;
  requireAboveMa?: string;
}
