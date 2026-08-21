import type { ScoreBreakdown, ScoreInputs } from "./types";

const WEIGHTS = {
  proximity: 0.4,
  volume: 0.35,
  trend: 0.25,
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function scoreProximity(distanceFromHighPct: number | null, maxDistance: number): number {
  if (distanceFromHighPct == null) return 0;
  if (distanceFromHighPct < 0) {
    return 100;
  }
  if (distanceFromHighPct > maxDistance) return 0;
  return clamp(100 * (1 - distanceFromHighPct / maxDistance));
}

function scoreRelativeVolume(relativeVolume: number | null): number {
  if (relativeVolume == null) return 0;
  if (relativeVolume >= 2.5) return 100;
  if (relativeVolume >= 1) return clamp(40 + (relativeVolume - 1) * 40);
  return clamp(relativeVolume * 40);
}

function scoreTrend(
  aboveFiftyDayMa: boolean | null,
  priceToMaPct: number | null,
): number {
  if (aboveFiftyDayMa == null || priceToMaPct == null) return 0;
  if (!aboveFiftyDayMa) return 0;
  return clamp(60 + priceToMaPct * 8, 60, 100);
}

export function computeTakeoffScore(
  inputs: ScoreInputs,
  maxDistance: number,
): { score: number; breakdown: ScoreBreakdown } {
  const proximityScore = scoreProximity(inputs.distanceFromHighPct, maxDistance);
  const volumeScore = scoreRelativeVolume(inputs.relativeVolume);
  const trendScore = scoreTrend(inputs.aboveFiftyDayMa, inputs.priceToMaPct);

  const score =
    proximityScore * WEIGHTS.proximity +
    volumeScore * WEIGHTS.volume +
    trendScore * WEIGHTS.trend;

  return {
    score: Math.round(score * 10) / 10,
    breakdown: {
      proximityScore: Math.round(proximityScore),
      volumeScore: Math.round(volumeScore),
      trendScore: Math.round(trendScore),
    },
  };
}

export function buildReason(
  inputs: ScoreInputs,
  breakdown: ScoreBreakdown,
): string {
  const parts: string[] = [];

  if (inputs.distanceFromHighPct != null) {
    if (inputs.distanceFromHighPct <= 0) {
      parts.push("at or above 52-week high");
    } else {
      parts.push(`${inputs.distanceFromHighPct.toFixed(1)}% below 52w high`);
    }
  }

  if (inputs.relativeVolume != null) {
    parts.push(`${inputs.relativeVolume.toFixed(2)}× avg volume`);
  }

  if (inputs.aboveFiftyDayMa === true) {
    parts.push("above 50-day MA");
  } else if (inputs.aboveFiftyDayMa === false) {
    parts.push("below 50-day MA");
  }

  if (parts.length === 0) {
    return "Insufficient data for setup summary";
  }

  const lead =
    breakdown.proximityScore >= 70
      ? "Tight breakout setup"
      : breakdown.volumeScore >= 70
        ? "Volume expansion"
        : "Trend-supported setup";

  return `${lead}: ${parts.join(", ")}`;
}
