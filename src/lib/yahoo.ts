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
  fiftyDayAverage?: number;
  regularMarketTime?: Date | number;
  marketState?: string;
}

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: {
    logErrors: false,
    logOptionsErrors: false,
  },
});

const BATCH_SIZE = 50;

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
      const rows = Array.isArray(result) ? result : [result];
      quotes.push(...(rows as RawQuote[]));
    } catch {
      for (const symbol of batch) {
        try {
          const single = await yahooFinance.quote(symbol);
          quotes.push(single as RawQuote);
        } catch {
          failedSymbols.push(symbol);
        }
      }
    }
  }

  return { quotes, failedSymbols };
}

export function quoteTimestamp(quote: RawQuote): number | null {
  if (!quote.regularMarketTime) return null;
  if (quote.regularMarketTime instanceof Date) {
    return quote.regularMarketTime.getTime();
  }
  const asNumber = Number(quote.regularMarketTime);
  return Number.isFinite(asNumber) ? asNumber * 1000 : null;
}
