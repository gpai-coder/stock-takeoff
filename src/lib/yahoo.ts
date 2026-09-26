import YahooFinance from "yahoo-finance2";

export interface RawQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  fullExchangeName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketTime?: Date | number;
  marketState?: string;
}

export interface DailyBar {
  date: string;
  high: number | null;
  low: number | null;
  close: number | null;
}

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: {
    logErrors: false,
    logOptionsErrors: false,
  },
});

const BATCH_SIZE = 50;

function asQuotes(values: unknown[]): RawQuote[] {
  return values.filter(isQuote);
}

function isQuote(value: unknown): value is RawQuote {
  return (
    value != null &&
    typeof value === "object" &&
    "symbol" in value &&
    typeof (value as { symbol?: unknown }).symbol === "string" &&
    (value as { symbol: string }).symbol.length > 0
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function fetchQuotes(symbols: string[]): Promise<{
  quotes: RawQuote[];
  failedSymbols: string[];
}> {
  const batches = chunk(symbols, BATCH_SIZE);
  const quotes: RawQuote[] = [];
  const failedSymbols: string[] = [];

  for (const batch of batches) {
    try {
      const result = await yahooFinance.quote(batch);
      quotes.push(...asQuotes(Array.isArray(result) ? result : [result]));
    } catch {
      for (const symbol of batch) {
        try {
          const single = await yahooFinance.quote(symbol);
          if (isQuote(single)) quotes.push(single);
          else failedSymbols.push(symbol);
        } catch {
          failedSymbols.push(symbol);
        }
      }
    }
  }

  return { quotes, failedSymbols };
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function barDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(millis).toISOString();
  }
  return null;
}

export async function fetchDailyHistory(symbol: string): Promise<DailyBar[]> {
  const period1 = new Date(Date.now() - 420 * 24 * 60 * 60 * 1000);
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1,
      interval: "1d",
    });
    const quotes = chart.quotes ?? [];
    const bars: DailyBar[] = [];
    for (const row of quotes) {
      const date = barDate(row.date);
      if (!date) continue;
      bars.push({
        date,
        high: finiteOrNull(row.high),
        low: finiteOrNull(row.low),
        close: finiteOrNull(row.close),
      });
    }
    return bars.slice(-260);
  } catch {
    return [];
  }
}

export function quoteTimestamp(quote: RawQuote): number | null {
  if (!quote.regularMarketTime) return null;
  if (quote.regularMarketTime instanceof Date) {
    return quote.regularMarketTime.getTime();
  }
  const asNumber = Number(quote.regularMarketTime);
  return Number.isFinite(asNumber) ? asNumber * 1000 : null;
}
