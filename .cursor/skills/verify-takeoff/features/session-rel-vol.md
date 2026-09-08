# Session-adjusted relative volume

During regular US market hours, Takeoff adjusts relative volume for elapsed session time so 1.0× means "on pace for an average full day," not "already at full-day volume by mid-morning."

## Sub-features

- `relativeVolumeSessionAdjusted: true` in API response when `marketState` is `REGULAR`
- `*` asterisk on the **Rel vol** column header and footnote in the table
- `sessionAdjustedRelativeVolume` divides raw volume ratio by elapsed regular-session fraction (45-minute floor before open, capped at full session)
- After hours / pre-market: `relativeVolumeSessionAdjusted: false`, raw volume / 3-mo average

## How to get to it (user POV)

During regular trading hours (9:30–16:00 ET, market open), load Takeoff. The Rel vol column header shows a `*` with a tooltip. A footnote below the table explains session adjustment. After the close, the `*` disappears and rel vol reflects full-day ratios.

## Driving it with verify-takeoff scripts

```bash
python3 .cursor/skills/verify-takeoff/scripts/doctor.py \
  .cursor/skills/verify-takeoff/artifacts/doctor.json
```

Check `marketState` and `relativeVolumeSessionAdjusted` in the output. When `marketState` is `REGULAR`, expect `relativeVolumeSessionAdjusted: true` and rel-vol values that differ from a simple `volume / avgVolume` ratio. Re-run after the close to confirm the flag flips to `false`.

## Gotchas

- Session adjustment depends on Yahoo's `marketState` field, not just wall-clock ET time.
- The 45-minute elapsed floor prevents extreme ratios in the first minutes after the open.
- Filtering uses the same adjusted rel-vol values shown in the table during REGULAR hours.
