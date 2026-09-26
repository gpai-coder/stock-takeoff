import { PriceChart } from "@/components/PriceChart";
import { SiteNav } from "@/components/SiteNav";
import { StockScoreDetail } from "@/components/StockScoreDetail";
import { getTickerAnalysis } from "@/lib/analyze";
import { formatCurrency, formatMarketState, formatMultiple, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface TickerPageProps {
  params: Promise<{ symbol: string }>;
}

function changeClass(value: number | null): string {
  if (value == null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

export async function generateMetadata({ params }: TickerPageProps) {
  const { symbol } = await params;
  return {
    title: `${decodeURIComponent(symbol).toUpperCase()} — Takeoff`,
    description: "Price, trend, and takeoff score for one ticker.",
  };
}

export default async function TickerPage({ params }: TickerPageProps) {
  const { symbol: rawSymbol } = await params;
  const analysis = await getTickerAnalysis(decodeURIComponent(rawSymbol));
  const stock = analysis.stock;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(61,214,198,0.12),_transparent_35%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SiteNav />

        {!stock ? (
          <section className="rounded-2xl border border-negative/40 bg-negative/10 p-8">
            <h1 className="text-2xl font-semibold">No quote for {analysis.symbol}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {analysis.error ?? "Yahoo did not return a quote for that symbol."} Nothing on this
              page was filled in.
            </p>
          </section>
        ) : (
          <>
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                {stock.exchange}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{stock.symbol}</h1>
              <p className="text-base text-muted">{stock.name}</p>
              <div className="flex flex-wrap items-end gap-4">
                <p className="font-mono text-4xl">{formatCurrency(stock.price)}</p>
                <p className={`pb-1 font-mono text-lg ${changeClass(stock.changePct)}`}>
                  {formatPercent(stock.changePct)}
                </p>
                <p className="pb-1 text-sm text-muted">
                  {formatMarketState(analysis.marketState)}
                </p>
              </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="50-day MA" value={formatCurrency(stock.fiftyDayAverage)} />
              <Stat
                label="200-day MA"
                value={
                  stock.twoHundredDayAverage == null
                    ? "Unavailable"
                    : formatCurrency(stock.twoHundredDayAverage)
                }
              />
              <Stat label="52-week high" value={formatCurrency(stock.fiftyTwoWeekHigh)} />
              <Stat label="52-week low" value={formatCurrency(stock.fiftyTwoWeekLow)} />
              <Stat label="Relative volume" value={formatMultiple(stock.relativeVolume)} />
              <Stat
                label="Distance from 52w high"
                value={
                  stock.distanceFromHighPct == null
                    ? "—"
                    : `${stock.distanceFromHighPct.toFixed(2)}%`
                }
              />
              <Stat label="Takeoff score" value={stock.score.toFixed(1)} accent />
            </section>

            <section className="rounded-2xl border border-panel-border bg-panel p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Recent closes
              </h2>
              <PriceChart points={analysis.chart} />
            </section>

            <section className="rounded-2xl border border-panel-border bg-panel p-4 sm:p-5">
              <StockScoreDetail stock={stock} />
            </section>
          </>
        )}

        <footer className="border-t border-panel-border pt-4 text-xs leading-relaxed text-muted">
          <p>
            Quotes and history come from Yahoo Finance. The takeoff score uses the same weights as
            the screener and the default 8% distance scale. If a moving average or the recent
            range is missing, that part is left out instead of guessed. This is research tooling,
            not investment advice.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-panel-border bg-panel px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-1 font-mono text-lg ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
