"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWatchlist } from "@/components/WatchlistProvider";

export function SiteNav() {
  const pathname = usePathname();
  const { symbols, ready } = useWatchlist();
  const count = ready ? symbols.length : null;

  const linkClass = (href: string) =>
    `rounded-full border px-3 py-1 transition ${
      pathname === href
        ? "border-accent text-foreground"
        : "border-panel-border text-muted hover:border-accent hover:text-foreground"
    }`;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      <Link href="/" className={linkClass("/")}>
        Screener
      </Link>
      <Link href="/watchlist" className={linkClass("/watchlist")}>
        Watchlist{count == null ? "" : ` (${count})`}
      </Link>
    </nav>
  );
}
