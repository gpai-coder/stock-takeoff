# Default screener

The landing page loads the S&P 500 universe with default breakout filters ($5B+ market cap, within 8% of the 52-week high, relative volume ≥ 1.0×, price above the 50-day MA) and renders a ranked table sorted by Takeoff score.

## Sub-features

- Page heading **Takeoff** with universe size, match count, as-of time (ET), and market state badges
- `GET /api/screener` with implicit defaults (no query params)
- `ScreenerTable` columns: Ticker, Price, Change, Market cap, Rel vol, To 52w high, Score, Setup
- Footer disclaimer and score weight explanation

## How to get to it (user POV)

Open `TAKEOFF_BASE_URL` (or `http://localhost:3000` locally) with no query string. The page title area shows **Takeoff**, the Filters panel shows default values, and the table lists matching stocks or a "No matches right now" empty state.

## Driving it with verify-takeoff scripts

```bash
python3 .cursor/skills/verify-takeoff/scripts/doctor.py \
  .cursor/skills/verify-takeoff/artifacts/doctor.json

python3 .cursor/skills/verify-takeoff/scripts/drive_api.py \
  --out .cursor/skills/verify-takeoff/artifacts/default.json
```

Confirm `matchedCount` matches the header badge, `universeSize` is ~500, and `filters` reflect defaults (`minMarketCap: 5000000000`, `maxDistanceFromHigh: 8`, `minRelativeVolume: 1.0`, `requireAboveMa: true`).

## Gotchas

- First request against a cold Vercel deploy can take up to 60 seconds (`maxDuration`); scripts use a 120s timeout.
- Yahoo Finance data may be partial outside market hours; `error` / `partial` fields can appear without failing HTTP 200.
- Match count varies with live market data—assert structure and filter echo, not an exact number.
