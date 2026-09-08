# Filter controls

The Filters panel lets users tighten or loosen screener criteria. Changes apply immediately via URL query params and a server-side re-render—there is no separate Search button.

## Sub-features

- Minimum market cap presets ($1B / $5B / $10B / $50B) plus custom input (`7B`, raw dollars)
- Min price, min avg volume (3 mo), max distance from 52w high (%), min relative volume
- Exchange selector (All US / NYSE / NASDAQ)
- Require price above 50-day MA checkbox
- Reset defaults button

## How to get to it (user POV)

On the Takeoff home page, scroll to the **Filters** section below the header. Change any control; the URL updates (e.g. `?minRelativeVolume=1.5`) and the table refreshes with an "Updating results…" indicator.

## Driving it with verify-takeoff scripts

Pass filter params as `--query`:

```bash
python3 .cursor/skills/verify-takeoff/scripts/drive_api.py \
  --query "minMarketCap=10000000000&minRelativeVolume=1.5&maxDistanceFromHigh=5" \
  --out .cursor/skills/verify-takeoff/artifacts/tight-filters.json
```

Verify the response `filters` object echoes the requested values and `matchedCount` is ≤ the default run. Reset by omitting params or using defaults explicitly.

## Gotchas

- Filter changes are GET-only URL updates; bookmarking a URL reproduces the same screen.
- Custom market cap requires blur/submit on the text field in the UI; the API accepts raw numeric `minMarketCap` directly.
- `requireAboveMa=false` must be passed as the string `false` in the query string.
