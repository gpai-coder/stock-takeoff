import { unstable_cache } from "next/cache";
import { passesFilters, parseFilters } from "./filters";
import {
  deriveSetupMetrics,
  loadDailyHistory,
  mapPool,
} from "./history";
import {
  getRegularSessionElapsedFraction,
  isRegularUsSession,
} from "./market-session";
import { buildStockRow, type RelativeVolumeContext } from "./stock";
import type { ScreenerFilters, ScreenerResult, ScreenerSearchParams, StockRow } from "./types";
import { getSp500Universe } from "./universe";
import { fetchQuotes, quoteTimestamp, type RawQuote } from "./yahoo";

const QUOTE_CACHE_SECONDS = 300;
const HISTORY_CONCURRENCY = 8;

async function enrichMatches(
  matches: StockRow[],
  quotesBySymbol: Map<string, RawQuote>,
  nameBySymbol: Map<string, string>,
  filters: ScreenerFilters,
  relativeVolumeContext: RelativeVolumeContext,
): Promise<StockRow[]> {
  return mapPool(matches, HISTORY_CONCURRENCY, async (stock) => {
    const quote = quotesBySymbol.get(stock.symbol);
    if (!quote) return stock;
    try {
      const bars = await loadDailyHistory(stock.symbol);
      const metrics = deriveSetupMetrics(bars);
      return buildStockRow(
        quote,
        nameBySymbol.get(quote.symbol) ?? stock.name,
        filters,
        relativeVolumeContext,
        metrics,
      );
    } catch {
      return stock;
    }
  });
}

async function runScreener(filters: ScreenerFilters): Promise<ScreenerResult> {
  const universe = await getSp500Universe();
  const nameBySymbol = new Map(universe.map((entry) => [entry.symbol, entry.name]));
  const symbols = universe.map((entry) => entry.symbol);

  const { quotes, failedSymbols } = await fetchQuotes(symbols);

  const marketState = quotes.find((quote) => quote.marketState)?.marketState ?? null;
  const latestQuoteTime = quotes
    .map((quote) => quoteTimestamp(quote))
    .filter((time): time is number => time != null)
    .sort((a, b) => b - a)[0];
  const referenceTime = latestQuoteTime ? new Date(latestQuoteTime) : new Date();
  const relativeVolumeSessionAdjusted = isRegularUsSession(marketState);
  const relativeVolumeContext: RelativeVolumeContext = {
    sessionAdjusted: relativeVolumeSessionAdjusted,
    elapsedFraction: relativeVolumeSessionAdjusted
      ? getRegularSessionElapsedFraction(referenceTime)
      : 1,
  };

  const quotesBySymbol = new Map<string, RawQuote>();
  for (const quote of quotes) {
    quotesBySymbol.set(quote.symbol, quote);
  }

  const stocks = quotes.map((quote) =>
    buildStockRow(
      quote,
      nameBySymbol.get(quote.symbol) ?? quote.symbol,
      filters,
      relativeVolumeContext,
    ),
  );

  const filtered = stocks.filter((stock) => passesFilters(stock, filters));
  const enriched = await enrichMatches(
    filtered,
    quotesBySymbol,
    nameBySymbol,
    filters,
    relativeVolumeContext,
  );
  enriched.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));

  return {
    asOf: latestQuoteTime ? referenceTime.toISOString() : new Date().toISOString(),
    marketState,
    relativeVolumeSessionAdjusted,
    universeSize: symbols.length,
    matchedCount: enriched.length,
    filters,
    stocks: enriched,
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
  ["takeoff-screener-v2"],
  { revalidate: QUOTE_CACHE_SECONDS },
);

export async function getScreenerResults(
  params: ScreenerSearchParams,
): Promise<ScreenerResult> {
  const filters = parseFilters(params);
  return getCachedScreener(JSON.stringify(filters));
}

export { parseFilters } from "./filters";
