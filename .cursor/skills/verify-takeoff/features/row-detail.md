# Row detail

Each table row expands on click to show the raw inputs behind the Takeoff score and a visual score breakdown—mirroring the transparent scoring described in the footer.

## Sub-features

- Expandable row (click ticker row to toggle)
- **Score inputs** panel: 52-week high, distance to high, today's volume, 3-mo avg volume, 50-day MA, trend check
- **Score breakdown** bars: Proximity to 52w high (40%), Relative volume (35%), Trend / 50-day MA (25%)
- Missing-field warning when Yahoo data is incomplete

## How to get to it (user POV)

Load the screener with at least one match. Click any row in the results table. A detail panel opens below the row with Score inputs on the left and Score breakdown on the right. Click the same row again to collapse.

## Driving it with verify-takeoff scripts

API verification covers the same data the UI shows in the expanded panel:

```bash
python3 .cursor/skills/verify-takeoff/scripts/drive_api.py \
  --out .cursor/skills/verify-takeoff/artifacts/default.json
```

Inspect `stocks[0]` for `scoreBreakdown` (`proximityScore`, `volumeScore`, `trendScore`), `scoreInputs`, `fiftyTwoWeekHigh`, `volume`, `avgVolume`, `fiftyDayAverage`, and `missingFields`. UI proof: expand the top-ranked row and compare values.

## Gotchas

- Row expansion is client-side only; no additional API call on click.
- `score` is 0–100 composite; breakdown bars show individual 0–100 component scores.
- Stocks with missing quote fields may still appear if filters pass on available data; check `missingFields`.
