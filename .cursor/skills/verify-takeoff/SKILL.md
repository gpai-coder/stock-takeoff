---
name: verify-takeoff
description: Drive the Takeoff breakout stock screener (Next.js web UI + /api/screener) the way a user does and capture proof. Use when verifying Takeoff / stock-takeoff behavior, filters, session-adjusted relative volume, or the live Vercel deploy.
---

# verify-takeoff

End-to-end verification for the Takeoff S&P 500 breakout screener. This skill drives the same paths a user hits—default screener load, filter changes, row expansion—and captures JSON evidence from the live API or a local dev server.

## Launch

**Prefer the live deploy** for proof runs unless you are changing app code:

```bash
export TAKEOFF_BASE_URL="https://stock-takeoff-gpai1.vercel.app"   # default if unset
```

**Local dev** (only when testing unreleased changes):

```bash
npm install
npm run dev   # listens on http://localhost:3000
export TAKEOFF_BASE_URL="http://localhost:3000"
```

The app is a public Next.js 15 App Router project. Quotes come from Yahoo Finance via `yahoo-finance2`; no API keys are required. All verification is **GET-only**—never POST, PUT, or DELETE.

## Doctor

Run the health check before deeper verification:

```bash
python3 .cursor/skills/verify-takeoff/scripts/doctor.py \
  .cursor/skills/verify-takeoff/artifacts/doctor.json
```

Doctor GETs `/api/screener` with default filters and asserts:

- HTTP 200
- Top-level keys: `asOf`, `marketState`, `universeSize`, `matchedCount`, `filters`, `stocks`
- `universeSize >= 400` (S&P 500 universe loaded)

Exit code 0 means the screener API is healthy. Non-zero means stop and fix connectivity or the deploy before driving features.

## Drive

Use `drive_api.py` to exercise the screener API with optional query overrides:

```bash
# Default filters (same as landing page)
python3 .cursor/skills/verify-takeoff/scripts/drive_api.py \
  --out .cursor/skills/verify-takeoff/artifacts/default.json

# Custom query string (no leading ?)
python3 .cursor/skills/verify-takeoff/scripts/drive_api.py \
  --query "minRelativeVolume=1.5&maxDistanceFromHigh=5" \
  --out .cursor/skills/verify-takeoff/artifacts/tight-filters.json
```

The script prints `matchedCount` and the top symbols to stdout and writes the full JSON response to `--out`.

**API reference** — `GET /api/screener` query params:

| Param | Default | Notes |
|-------|---------|-------|
| `minMarketCap` | `5000000000` | Dollars |
| `minPrice` | `0` | |
| `minAvgVolume` | `0` | 3-month average |
| `maxDistanceFromHigh` | `8` | Percent below 52w high |
| `minRelativeVolume` | `1.0` | |
| `exchange` | `all` | `NYSE`, `NASDAQ`, or `all` |
| `requireAboveMa` | `true` | Price above 50-day MA |

**Defaults in practice:** $5B+ market cap, within 8% of 52-week high, relative volume ≥ 1.0×, above 50-day MA, S&P 500 universe.

**Session-adjusted relative volume:** When `marketState` is `REGULAR`, the response includes `relativeVolumeSessionAdjusted: true` and rel-vol values are paced to elapsed regular-session time. After hours, `relativeVolumeSessionAdjusted` is `false` and rel vol is raw volume / 3-month average.

For UI-level checks (Filters panel, table row expand, `*` on Rel vol column), open `TAKEOFF_BASE_URL` in a browser and follow the feature map in `features/`.

## Evidence

Store all proof artifacts under:

```
.cursor/skills/verify-takeoff/artifacts/
```

This directory **must survive cleanup**—do not delete it when tearing down local servers. Commit reasonably sized JSON (< 200 KB each) to the PR as proof. If a full response is too large, write a truncated `*.summary.json` (top 5 stocks) alongside `doctor.json`.

Typical artifacts:

- `doctor.json` — health check snapshot
- `default.json` or `default.summary.json` — default screener results
- Feature-specific captures named after the scenario (e.g. `tight-filters.json`)

## Cleanup

- **Local dev server:** kill by PID only (`kill <pid>`), never `pkill node` or broad process kills.
- **Do not remove** `.cursor/skills/verify-takeoff/artifacts/` or its contents during cleanup.
- No teardown needed for live-deploy verification (GET-only, stateless).

## Helpers

| Script | Purpose |
|--------|---------|
| `scripts/doctor.py [out.json]` | Health check; writes JSON, exits non-zero on failure |
| `scripts/drive_api.py --out path [--query Q]` | Drive `/api/screener`; prints matchedCount + top symbols |

Both scripts read `TAKEOFF_BASE_URL` (default `https://stock-takeoff-gpai1.vercel.app`).

## Feature map

| Feature | File |
|---------|------|
| Index | [features/README.md](features/README.md) |
| Default screener load | [features/default-screener.md](features/default-screener.md) |
| Filter controls | [features/filter-controls.md](features/filter-controls.md) |
| Row detail / score breakdown | [features/row-detail.md](features/row-detail.md) |
| Session-adjusted relative volume | [features/session-rel-vol.md](features/session-rel-vol.md) |
