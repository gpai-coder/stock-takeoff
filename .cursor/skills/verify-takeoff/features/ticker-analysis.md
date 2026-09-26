# Ticker analysis

A single-name page at `/ticker/[symbol]` with the live quote, trend levels, takeoff score, and a recent-close chart.

## Sub-features

- Open it from a screener or watchlist symbol, or type a ticker into **Symbol search** and choose **Open**.
- Price, 50-day MA, 200-day MA when Yahoo has it, 52-week high and low, relative volume, distance from the high, and the takeoff score.
- The same score breakdown as the screener, plus a short read of whether the setup looks like a fresh takeoff, an extended chase, or a weak setup.
- Inline SVG of recent closes. No chart library.
- An invalid or unknown symbol shows an error and does not invent prices.

## How to get to it (user POV)

On the screener, click a ticker such as MET. Or type `AAPL` in the symbol search and press Open. For a miss, open `/ticker/ZZZZ`.

## Driving it

```bash
curl -sS "$TAKEOFF_BASE_URL/api/ticker/AAPL" \
  -o .cursor/skills/verify-takeoff/artifacts/ticker-aapl.json
curl -sS -o /dev/null -w "%{http_code}\n" "$TAKEOFF_BASE_URL/api/ticker/ZZZZ"
```

A real symbol returns `stock` plus `chart` closes. An unknown symbol returns HTTP 404 with `stock: null` and an error string.
