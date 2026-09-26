# Takeoff score

The score ranks a **fresh, confirmed takeoff**. Being near a 52-week high with ordinary volume and a price above the 50-day average is not enough for a high score.

## Weights

Nominal weights sum to 1. If Yahoo does not provide a component, that component is omitted and the rest are rescaled. Missing history is never filled in.

| Component | Weight | What earns a high score |
|-----------|--------|-------------------------|
| Proximity to 52w high | 28% | Close to the high. Full credit only when price is not extended more than 8% above the 50-day MA; the score fades toward 25% of proximity credit by 25% above that average. |
| Relative volume | 24% | Real expansion. About 1.0× scores 15, 1.5× scores 40, 2.0× scores 70, 3.0× scores 100. |
| Trend stack | 22% | 45 points for price above the 50-day MA, plus 30 if that average is rising, plus 25 if price is above the 200-day MA. Missing slope or 200-day data is not awarded and is called out. Below the 50-day MA scores 0. |
| Tight range | 16% | Last 10 sessions are a coil (about 3% range scores 100; 14% or wider scores 0). A 10-day run of 12% or more is treated as already vertical and marked extended. Omitted when daily history is missing. |
| Close in range | 10% | Close near the high of the session range. Omitted when the session high and low are missing or equal. |

The plain-language read calls a name a fresh takeoff only when it is near the high, volume is expanding (at least 1.5×), the trend stack is intact, and the recent range is still tight. Stretched or vertical names are called extended. Price under the 50-day MA is called weak.

## How to see it

Open the screener, click a row, and read **Score breakdown**. The five bars show the weights above. The read above the inputs says whether the setup looks fresh, extended, weak, or only partial. The footer states the same weights.

API: `scoreBreakdown` keeps `proximityScore`, `volumeScore`, and `trendScore`, and adds `coilScore`, `closeLocationScore` (`null` when omitted), and `unavailable`.

```bash
python3 .cursor/skills/verify-takeoff/scripts/drive_api.py \
  --out .cursor/skills/verify-takeoff/artifacts/score-default.json
```

On a closed session, `relativeVolumeSessionAdjusted` is false.
