import { SiteNav } from "@/components/SiteNav";
import { WatchlistBoard } from "@/components/WatchlistBoard";

export const metadata = {
  title: "Watchlist — Takeoff",
  description: "Symbols you saved in this browser, with live takeoff scores.",
};

export default function WatchlistPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(61,214,198,0.12),_transparent_35%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SiteNav />
        <WatchlistBoard />
        <footer className="border-t border-panel-border pt-4 text-xs leading-relaxed text-muted">
          <p>
            Watchlist quotes come from Yahoo Finance. Scores use the same fresh-takeoff model as
            the screener and the default 8% distance scale, including names that the current
            screener filters hide. This is research tooling, not investment advice.
          </p>
        </footer>
      </div>
    </main>
  );
}
