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
  fiftyDayRising: boolean | null;
  aboveTwoHundredDayMa: boolean | null;
  priceToTwoHundredMaPct: number | null;
  recentRangePct: number | null;
  recentReturnPct: number | null;
  closeLocation: number | null;
}

export interface ScoreBreakdown {
  proximityScore: number;
  volumeScore: number;
  trendScore: number;
  coilScore: number | null;
  closeLocationScore: number | null;
  /** Components omitted from the composite. Remaining weights are rescaled to 1. */
  unavailable: string[];
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
  fiftyTwoWeekLow: number | null;
  distanceFromHighPct: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  aboveFiftyDayMa: boolean | null;
  aboveTwoHundredDayMa: boolean | null;
  dayHigh: number | null;
  dayLow: number | null;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  scoreInputs: ScoreInputs;
  reason: string;
  setupRead: string;
  quoteTime: number | null;
  marketState: string | null;
  missingFields: string[];
}

export interface PricePoint {
  date: string;
  close: number;
}

export interface ScreenerResult {
  asOf: string;
  marketState: string | null;
  relativeVolumeSessionAdjusted: boolean;
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
