# Takeoff

Takeoff is a production-ready Next.js screener for US large-cap stocks showing a transparent "breakout / expansion" setup using live Yahoo Finance data.

## What it does

On first load, Takeoff screens the **S&P 500** for names that:

- Meet your **minimum market cap** filter (default **$5B+**)
- Trade within **8%** of their 52-week high (adjustable)
- Show **relative volume ≥ 1.0×** the 3-month average (adjustable)
- Hold **above the 50-day moving average** (toggleable)

Each match gets a **Takeoff score (0–100)** with visible inputs:

| Component | Weight | Inputs |
|-----------|--------|--------|
| Proximity to 52w high | 28% | Distance below the 52-week high, reduced when price is extended above the 50-day MA |
| Relative volume | 24% | Today’s volume vs. 3-month average; ~1.0× is a low score, real expansion scores high |
| Trend stack | 22% | Price above a rising 50-day MA, and above the 200-day MA when Yahoo has it |
| Tight range | 16% | Last 10 sessions coiled, not already vertical. Omitted if history is missing |
| Close in range | 10% | Close in the upper part of the session range. Omitted if the range is missing |

Weights sum to 1. A missing component is left out and the rest are rescaled. Nothing is invented when Yahoo has no history.

Results sort by score descending. Click a row to expand raw inputs and score breakdown. Use **Watch** on a row, or type a ticker, to save a watchlist in this browser (`takeoff-watchlist`). Open **Watchlist** to see price, score, relative volume, and distance from the 52-week high even when that symbol is filtered out of the screener.

Click a ticker — or use symbol search — to open `/ticker/[symbol]` for the 50-day and 200-day averages, the 52-week range, the score breakdown, a plain-language read, and a recent-close chart.

## Filters

All filters are applied **on the server** before the page renders:

- Minimum market cap presets ($1B / $5B / $10B / $50B) plus custom values like `7B`
- Minimum price
- Minimum 3-month average volume
- Maximum distance from 52-week high (%)
- Minimum relative volume
- Exchange (NYSE / NASDAQ / all)
- Require price above 50-day MA

Changing a filter updates the URL query string and refreshes results without a full manual search step.

## Data source

- **Universe:** S&P 500 constituents CSV from [datasets/s-and-p-500-companies](https://github.com/datasets/s-and-p-500-companies) (refreshed daily)
- **Quotes:** [Yahoo Finance](https://finance.yahoo.com/) through the open-source [`yahoo-finance2`](https://github.com/gadicc/yahoo-finance2) library in a Route Handler / server component
- **Caching:** 5-minute revalidation via Next.js `unstable_cache`
- **No API keys** required

If Yahoo returns partial data, the UI shows a warning and marks unavailable fields as **Unavailable** or **—** — nothing is fabricated.

The header shows quote **as-of time (ET)** and market state (open, closed, pre/post-market).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Deploy on Vercel

Push to GitHub and import the repo in Vercel. No environment variables or extra config are required.

Optional JSON API: `GET /api/screener?minMarketCap=5000000000`

## Disclaimer

Takeoff is a research tool, not investment advice. Market data may be delayed and incomplete.
