import { unstable_cache } from "next/cache";
import { fetchDailyHistory, type DailyBar } from "./yahoo";

const HISTORY_CACHE_SECONDS = 300;
const COIL_SESSIONS = 10;
const SLOPE_LOOKBACK = 15;
const SMA_50 = 50;
const SMA_200 = 200;
const RISING_MIN_CHANGE = 0.0005;

export interface SetupMetrics {
  fiftyDayRising: boolean | null;
  computedTwoHundredDayAverage: number | null;
  recentRangePct: number | null;
  recentReturnPct: number | null;
}

export const EMPTY_SETUP_METRICS: SetupMetrics = {
  fiftyDayRising: null,
  computedTwoHundredDayAverage: null,
  recentRangePct: null,
  recentReturnPct: null,
};

interface PricedBar {
  high: number;
  low: number;
  close: number;
}

function usableBars(bars: DailyBar[]): PricedBar[] {
  const priced: PricedBar[] = [];
  for (const bar of bars) {
    if (
      bar.high == null ||
      bar.low == null ||
      bar.close == null ||
      !Number.isFinite(bar.high) ||
      !Number.isFinite(bar.low) ||
      !Number.isFinite(bar.close) ||
      bar.high <= 0 ||
      bar.low <= 0 ||
      bar.close <= 0 ||
      bar.high < bar.low
    ) {
      continue;
    }
    priced.push({ high: bar.high, low: bar.low, close: bar.close });
  }
  return priced;
}

function sma(closes: number[], end: number, period: number): number | null {
  const start = end - period + 1;
  if (start < 0 || end >= closes.length) return null;
  let sum = 0;
  for (let index = start; index <= end; index += 1) {
    sum += closes[index];
  }
  return sum / period;
}

export function deriveSetupMetrics(bars: DailyBar[]): SetupMetrics {
  const priced = usableBars(bars);
  if (priced.length === 0) return { ...EMPTY_SETUP_METRICS };

  const closes = priced.map((bar) => bar.close);
  const last = closes.length - 1;
  const currentMa = sma(closes, last, SMA_50);
  const priorMa = sma(closes, last - SLOPE_LOOKBACK, SMA_50);
  let fiftyDayRising: boolean | null = null;
  if (currentMa != null && priorMa != null && priorMa > 0) {
    fiftyDayRising = (currentMa - priorMa) / priorMa > RISING_MIN_CHANGE;
  }

  const computedTwoHundredDayAverage = sma(closes, last, SMA_200);

  let recentRangePct: number | null = null;
  let recentReturnPct: number | null = null;
  if (priced.length >= COIL_SESSIONS + 1) {
    const window = priced.slice(-COIL_SESSIONS);
    const startClose = priced[priced.length - COIL_SESSIONS - 1].close;
    const lastClose = window[window.length - 1].close;
    const maxHigh = Math.max(...window.map((bar) => bar.high));
    const minLow = Math.min(...window.map((bar) => bar.low));
    if (lastClose > 0 && startClose > 0) {
      recentRangePct = ((maxHigh - minLow) / lastClose) * 100;
      recentReturnPct = ((lastClose - startClose) / startClose) * 100;
    }
  }

  return {
    fiftyDayRising,
    computedTwoHundredDayAverage,
    recentRangePct,
    recentReturnPct,
  };
}

const getCachedDailyHistory = unstable_cache(
  async (symbol: string) => fetchDailyHistory(symbol),
  ["takeoff-daily-history"],
  { revalidate: HISTORY_CACHE_SECONDS },
);

export async function loadDailyHistory(symbol: string): Promise<DailyBar[]> {
  return getCachedDailyHistory(symbol);
}

export async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
