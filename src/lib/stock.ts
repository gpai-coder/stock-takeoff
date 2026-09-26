import type { SetupMetrics } from "./history";
import { EMPTY_SETUP_METRICS } from "./history";
import { sessionAdjustedRelativeVolume } from "./market-session";
import { buildReason, buildSetupNarrative, computeTakeoffScore } from "./scoring";
import type { ScoreInputs, ScreenerFilters, StockRow } from "./types";
import { quoteTimestamp, type RawQuote } from "./yahoo";

export interface RelativeVolumeContext {
  sessionAdjusted: boolean;
  elapsedFraction: number;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function distanceFromHigh(price: number | null, high: number | null): number | null {
  if (price == null || high == null || high <= 0) return null;
  return ((high - price) / high) * 100;
}

function percentFromLevel(price: number | null, level: number | null): number | null {
  if (price == null || level == null || level <= 0) return null;
  return ((price - level) / level) * 100;
}

export function closeLocationRatio(
  price: number | null,
  dayHigh: number | null,
  dayLow: number | null,
): number | null {
  if (price == null || dayHigh == null || dayLow == null) return null;
  if (!(dayHigh > dayLow)) return null;
  const ratio = (price - dayLow) / (dayHigh - dayLow);
  if (!Number.isFinite(ratio)) return null;
  return Math.min(1, Math.max(0, ratio));
}

export function buildStockRow(
  quote: RawQuote,
  fallbackName: string,
  filters: ScreenerFilters,
  relativeVolumeContext: RelativeVolumeContext,
  metrics: SetupMetrics = EMPTY_SETUP_METRICS,
): StockRow {
  const missingFields: string[] = [];
  const price = nullableNumber(quote.regularMarketPrice);
  const changePct = nullableNumber(quote.regularMarketChangePercent);
  const marketCap = nullableNumber(quote.marketCap);
  const avgVolume = nullableNumber(quote.averageDailyVolume3Month);
  const volume = nullableNumber(quote.regularMarketVolume);
  const fiftyTwoWeekHigh = nullableNumber(quote.fiftyTwoWeekHigh);
  const fiftyTwoWeekLow = nullableNumber(quote.fiftyTwoWeekLow);
  const fiftyDayAverage = nullableNumber(quote.fiftyDayAverage);
  const quotedTwoHundred = nullableNumber(quote.twoHundredDayAverage);
  const twoHundredDayAverage =
    quotedTwoHundred ?? metrics.computedTwoHundredDayAverage ?? null;
  const dayHigh = nullableNumber(quote.regularMarketDayHigh);
  const dayLow = nullableNumber(quote.regularMarketDayLow);

  if (price == null) missingFields.push("price");
  if (marketCap == null) missingFields.push("market cap");
  if (avgVolume == null) missingFields.push("avg volume");
  if (volume == null) missingFields.push("volume");
  if (fiftyTwoWeekHigh == null) missingFields.push("52w high");
  if (fiftyDayAverage == null) missingFields.push("50-day MA");
  if (twoHundredDayAverage == null) missingFields.push("200-day MA");
  if (dayHigh == null || dayLow == null || !(dayHigh > dayLow)) {
    missingFields.push("session range");
  }

  const distanceFromHighPct = distanceFromHigh(price, fiftyTwoWeekHigh);
  const relVolume = sessionAdjustedRelativeVolume(volume, avgVolume, {
    sessionAdjusted: relativeVolumeContext.sessionAdjusted,
    elapsedFraction: relativeVolumeContext.elapsedFraction,
  });
  const aboveFiftyDayMa =
    price != null && fiftyDayAverage != null ? price >= fiftyDayAverage : null;
  const priceToMaPct = percentFromLevel(price, fiftyDayAverage);
  const aboveTwoHundredDayMa =
    price != null && twoHundredDayAverage != null
      ? price >= twoHundredDayAverage
      : null;
  const priceToTwoHundredMaPct = percentFromLevel(price, twoHundredDayAverage);

  const scoreInputs: ScoreInputs = {
    distanceFromHighPct,
    relativeVolume: relVolume,
    aboveFiftyDayMa,
    priceToMaPct,
    fiftyDayRising: metrics.fiftyDayRising,
    aboveTwoHundredDayMa,
    priceToTwoHundredMaPct,
    recentRangePct: metrics.recentRangePct,
    recentReturnPct: metrics.recentReturnPct,
    closeLocation: closeLocationRatio(price, dayHigh, dayLow),
  };

  const { score, breakdown } = computeTakeoffScore(
    scoreInputs,
    filters.maxDistanceFromHigh,
  );

  return {
    symbol: quote.symbol,
    name: quote.longName ?? quote.shortName ?? fallbackName,
    exchange: quote.fullExchangeName ?? "Unknown",
    price,
    changePct,
    marketCap,
    avgVolume,
    volume,
    relativeVolume: relVolume,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    distanceFromHighPct,
    fiftyDayAverage,
    twoHundredDayAverage,
    aboveFiftyDayMa,
    aboveTwoHundredDayMa,
    dayHigh,
    dayLow,
    score,
    scoreBreakdown: breakdown,
    scoreInputs,
    reason: buildReason(scoreInputs, breakdown),
    setupRead: buildSetupNarrative(scoreInputs, breakdown),
    quoteTime: quoteTimestamp(quote),
    marketState: quote.marketState ?? null,
    missingFields,
  };
}
