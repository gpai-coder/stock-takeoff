import { unstable_cache } from "next/cache";
import { passesFilters, parseFilters } from "./filters";
import { buildReason, computeTakeoffScore } from "./scoring";
import type {
  ScoreInputs,
  ScreenerFilters,
  ScreenerResult,
  ScreenerSearchParams,
  StockRow,
} from "./types";
import { getSp500Universe } from "./universe";
import { fetchQuotes, quoteTimestamp, type RawQuote } from "./yahoo";

const QUOTE_CACHE_SECONDS = 300;

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function distanceFromHigh(price: number | null, high: number | null): number | null {
  if (price == null || high == null || high <= 0) return null;
  return ((high - price) / high) * 100;
}

function relativeVolume(volume: number | null, avgVolume: number | null): number | null {
  if (volume == null || avgVolume == null || avgVolume <= 0) return null;
  return volume / avgVolume;
}

function mapQuoteToStock(quote: RawQuote, fallbackName: string, filters: ScreenerFilters): StockRow {
  const missingFields: string[] = [];
  const price = nullableNumber(quote.regularMarketPrice);
  const changePct = nullableNumber(quote.regularMarketChangePercent);
  const marketCap = nullableNumber(quote.marketCap);
  const avgVolume = nullableNumber(quote.averageDailyVolume3Month);
  const volume = nullableNumber(quote.regularMarketVolume);
  const fiftyTwoWeekHigh = nullableNumber(quote.fiftyTwoWeekHigh);
  const fiftyDayAverage = nullableNumber(quote.fiftyDayAverage);

  if (price == null) missingFields.push("price");
  if (marketCap == null) missingFields.push("market cap");
  if (avgVolume == null) missingFields.push("avg volume");
  if (volume == null) missingFields.push("volume");
  if (fiftyTwoWeekHigh == null) missingFields.push("52w high");
  if (fiftyDayAverage == null) missingFields.push("50-day MA");

  const distanceFromHighPct = distanceFromHigh(price, fiftyTwoWeekHigh);
  const relVolume = relativeVolume(volume, avgVolume);
  const aboveFiftyDayMa =
    price != null && fiftyDayAverage != null ? price >= fiftyDayAverage : null;
  const priceToMaPct =
    price != null && fiftyDayAverage != null && fiftyDayAverage > 0
      ? ((price - fiftyDayAverage) / fiftyDayAverage) * 100
      : null;

  const scoreInputs: ScoreInputs = {
    distanceFromHighPct,
    relativeVolume: relVolume,
    aboveFiftyDayMa,
    priceToMaPct,
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
    distanceFromHighPct,
    fiftyDayAverage,
    aboveFiftyDayMa,
    score,
    scoreBreakdown: breakdown,
    scoreInputs,
    reason: buildReason(scoreInputs, breakdown),
    quoteTime: quoteTimestamp(quote),
    marketState: quote.marketState ?? null,
    missingFields,
  };
}

async function runScreener(filters: ScreenerFilters): Promise<ScreenerResult> {
  const universe = await getSp500Universe();
  const nameBySymbol = new Map(universe.map((entry) => [entry.symbol, entry.name]));
  const symbols = universe.map((entry) => entry.symbol);

  const { quotes, failedSymbols } = await fetchQuotes(symbols);
  const stocks = quotes.map((quote) =>
    mapQuoteToStock(quote, nameBySymbol.get(quote.symbol) ?? quote.symbol, filters),
  );

  const filtered = stocks
    .filter((stock) => passesFilters(stock, filters))
    .sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));

  const latestQuoteTime = stocks
    .map((stock) => stock.quoteTime)
    .filter((time): time is number => time != null)
    .sort((a, b) => b - a)[0];

  const marketState = stocks.find((stock) => stock.marketState)?.marketState ?? null;

  return {
    asOf: latestQuoteTime
      ? new Date(latestQuoteTime).toISOString()
      : new Date().toISOString(),
    marketState,
    universeSize: symbols.length,
    matchedCount: filtered.length,
    filters,
    stocks: filtered,
    partial: failedSymbols.length > 0,
    error:
      quotes.length === 0
        ? "Unable to load market data from Yahoo Finance right now."
        : failedSymbols.length > 0
          ? `Partial data: ${failedSymbols.length} symbols could not be quoted.`
          : undefined,
  };
}

const getCachedScreener = unstable_cache(
  async (filtersKey: string) => {
    const filters = JSON.parse(filtersKey) as ScreenerFilters;
    return runScreener(filters);
  },
  ["takeoff-screener"],
  { revalidate: QUOTE_CACHE_SECONDS },
);

export async function getScreenerResults(
  params: ScreenerSearchParams,
): Promise<ScreenerResult> {
  const filters = parseFilters(params);
  return getCachedScreener(JSON.stringify(filters));
}

export { parseFilters } from "./filters";
