import { unstable_cache } from "next/cache";
import { deriveSetupMetrics, loadDailyHistory, mapPool } from "./history";
import { describeQuoteSession } from "./quote-session";
import { parseTickerList } from "./symbols";
import { buildStockRow } from "./stock";
import { DEFAULT_FILTERS, type PricePoint, type StockRow } from "./types";
import { fetchQuotes, type DailyBar, type RawQuote } from "./yahoo";

const ANALYSIS_CACHE_SECONDS = 300;
const HISTORY_CONCURRENCY = 8;
const MAX_SYMBOLS = 40;

export interface SymbolAnalysis {
  asOf: string;
  marketState: string | null;
  relativeVolumeSessionAdjusted: boolean;
  stocks: StockRow[];
  missing: string[];
  error?: string;
}

async function scoreQuotes(quotes: RawQuote[]): Promise<StockRow[]> {
  const session = describeQuoteSession(quotes);
  return mapPool(quotes, HISTORY_CONCURRENCY, async (quote) => {
    try {
      const bars = await loadDailyHistory(quote.symbol);
      const metrics = deriveSetupMetrics(bars);
      return buildStockRow(quote, quote.symbol, DEFAULT_FILTERS, session.relativeVolumeContext, metrics);
    } catch {
      return buildStockRow(quote, quote.symbol, DEFAULT_FILTERS, session.relativeVolumeContext);
    }
  });
}

async function analyzeSymbolList(symbols: string[]): Promise<SymbolAnalysis> {
  if (symbols.length === 0) {
    return {
      asOf: new Date().toISOString(),
      marketState: null,
      relativeVolumeSessionAdjusted: false,
      stocks: [],
      missing: [],
    };
  }

  const { quotes, failedSymbols } = await fetchQuotes(symbols);
  const returned = new Set(quotes.map((quote) => quote.symbol.toUpperCase()));
  const missing = [
    ...symbols.filter((symbol) => !returned.has(symbol.toUpperCase())),
    ...failedSymbols.map((symbol) => symbol.toUpperCase()),
  ].filter((symbol, index, all) => all.indexOf(symbol) === index);

  if (quotes.length === 0) {
    return {
      asOf: new Date().toISOString(),
      marketState: null,
      relativeVolumeSessionAdjusted: false,
      stocks: [],
      missing: symbols,
      error: `No quote for ${symbols.join(", ")}.`,
    };
  }

  const session = describeQuoteSession(quotes);
  const scored = await scoreQuotes(quotes);
  const bySymbol = new Map(scored.map((stock) => [stock.symbol.toUpperCase(), stock]));
  const stocks = symbols
    .map((symbol) => bySymbol.get(symbol.toUpperCase()))
    .filter((stock): stock is StockRow => stock != null);

  return {
    asOf: session.asOf,
    marketState: session.marketState,
    relativeVolumeSessionAdjusted: session.relativeVolumeSessionAdjusted,
    stocks,
    missing,
    error:
      missing.length > 0
        ? `No quote for ${missing.join(", ")}.`
        : undefined,
  };
}

const getCachedAnalysis = unstable_cache(
  async (symbolKey: string) => analyzeSymbolList(symbolKey.split(",").filter(Boolean)),
  ["takeoff-symbol-analysis"],
  { revalidate: ANALYSIS_CACHE_SECONDS },
);

export interface TickerAnalysis {
  symbol: string;
  asOf: string;
  marketState: string | null;
  relativeVolumeSessionAdjusted: boolean;
  stock: StockRow | null;
  chart: PricePoint[];
  error?: string;
}

function chartPoints(bars: DailyBar[]): PricePoint[] {
  const points: PricePoint[] = [];
  for (const bar of bars) {
    if (bar.close == null || !Number.isFinite(bar.close)) continue;
    points.push({ date: bar.date, close: bar.close });
  }
  return points.slice(-120);
}

export async function getTickerAnalysis(raw: string): Promise<TickerAnalysis> {
  const symbol = parseTickerList(raw, 1)[0];
  if (!symbol) {
    return {
      symbol: raw.trim().toUpperCase() || raw,
      asOf: new Date().toISOString(),
      marketState: null,
      relativeVolumeSessionAdjusted: false,
      stock: null,
      chart: [],
      error: "That is not a valid ticker.",
    };
  }

  const analysis = await analyzeSymbols([symbol]);
  const stock = analysis.stocks.find((row) => row.symbol.toUpperCase() === symbol) ?? null;
  const chart = stock ? chartPoints(await loadDailyHistory(symbol)) : [];

  return {
    symbol,
    asOf: analysis.asOf,
    marketState: analysis.marketState,
    relativeVolumeSessionAdjusted: analysis.relativeVolumeSessionAdjusted,
    stock,
    chart,
    error: stock ? undefined : analysis.error ?? `No quote for ${symbol}.`,
  };
}

export async function analyzeSymbols(raw: string[]): Promise<SymbolAnalysis> {
  const symbols = parseTickerList(raw.join(","), MAX_SYMBOLS);
  if (symbols.length === 0) {
    return analyzeSymbolList([]);
  }
  return getCachedAnalysis(symbols.join(","));
}
