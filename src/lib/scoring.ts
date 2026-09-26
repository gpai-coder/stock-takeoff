import type { ScoreBreakdown, ScoreInputs } from "./types";

/**
 * Fresh-takeoff score. Nominal weights sum to 1.
 * A missing component is omitted and the remaining weights are rescaled.
 * Proximity is reduced when price is extended above the 50-day average.
 */
export const SCORE_WEIGHTS = {
  proximity: 0.28,
  volume: 0.24,
  trend: 0.22,
  coil: 0.16,
  closeLocation: 0.1,
} as const;

export const MISSING_PROXIMITY = "52-week high distance";
export const MISSING_VOLUME = "relative volume";
export const MISSING_TREND = "50-day trend";
export const MISSING_COIL = "recent range";
export const MISSING_CLOSE = "session range";

const EXTENSION_FREE_PCT = 8;
const EXTENSION_FULL_PENALTY_PCT = 25;
const EXTENSION_FLOOR = 0.25;

const TREND_ABOVE_50 = 45;
const TREND_RISING = 30;
const TREND_ABOVE_200 = 25;

export function formatWeightShare(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function extensionMultiplier(priceToMaPct: number | null): number {
  if (priceToMaPct == null || !Number.isFinite(priceToMaPct)) return 1;
  if (priceToMaPct <= EXTENSION_FREE_PCT) return 1;
  if (priceToMaPct >= EXTENSION_FULL_PENALTY_PCT) return EXTENSION_FLOOR;
  const t =
    (priceToMaPct - EXTENSION_FREE_PCT) /
    (EXTENSION_FULL_PENALTY_PCT - EXTENSION_FREE_PCT);
  return 1 - t * (1 - EXTENSION_FLOOR);
}

function scoreProximity(
  distanceFromHighPct: number | null,
  maxDistance: number,
  priceToMaPct: number | null,
): number {
  if (distanceFromHighPct == null || !Number.isFinite(distanceFromHighPct)) return 0;

  let base: number;
  if (maxDistance <= 0) {
    base = distanceFromHighPct <= 0 ? 100 : 0;
  } else if (distanceFromHighPct < 0) {
    base = 100;
  } else if (distanceFromHighPct > maxDistance) {
    base = 0;
  } else {
    base = 100 * (1 - distanceFromHighPct / maxDistance);
  }

  return clamp(base * extensionMultiplier(priceToMaPct));
}

function scoreRelativeVolume(relativeVolume: number | null): number {
  if (relativeVolume == null || !Number.isFinite(relativeVolume) || relativeVolume < 0) {
    return 0;
  }
  if (relativeVolume >= 3) return 100;
  if (relativeVolume >= 2) return 70 + (relativeVolume - 2) * 30;
  if (relativeVolume >= 1.5) return 40 + ((relativeVolume - 1.5) / 0.5) * 30;
  if (relativeVolume >= 1) return 15 + ((relativeVolume - 1) / 0.5) * 25;
  return clamp(relativeVolume * 15);
}

function scoreTrend(inputs: ScoreInputs): number {
  if (inputs.aboveFiftyDayMa == null) return 0;
  if (!inputs.aboveFiftyDayMa) return 0;

  let score = TREND_ABOVE_50;
  if (inputs.fiftyDayRising === true) score += TREND_RISING;
  if (inputs.aboveTwoHundredDayMa === true) score += TREND_ABOVE_200;
  return score;
}

function scoreCoil(rangePct: number | null, returnPct: number | null): number | null {
  if (
    rangePct == null ||
    returnPct == null ||
    !Number.isFinite(rangePct) ||
    !Number.isFinite(returnPct)
  ) {
    return null;
  }

  let tightness: number;
  if (rangePct <= 3) tightness = 100;
  else if (rangePct >= 14) tightness = 0;
  else tightness = 100 * (1 - (rangePct - 3) / 11);

  let verticalFactor: number;
  if (returnPct <= 6) verticalFactor = 1;
  else if (returnPct >= 16) verticalFactor = 0.15;
  else verticalFactor = 1 - ((returnPct - 6) / 10) * 0.85;

  return clamp(tightness * verticalFactor);
}

function scoreCloseLocation(closeLocation: number | null): number | null {
  if (closeLocation == null || !Number.isFinite(closeLocation)) return null;
  return clamp(closeLocation * 100);
}

function combine(parts: { score: number; weight: number; include: boolean }[]): number {
  const active = parts.filter((part) => part.include);
  const weightSum = active.reduce((sum, part) => sum + part.weight, 0);
  if (weightSum <= 0) return 0;
  const raw = active.reduce((sum, part) => sum + part.score * part.weight, 0) / weightSum;
  return Math.round(raw * 10) / 10;
}

export function computeTakeoffScore(
  inputs: ScoreInputs,
  maxDistance: number,
): { score: number; breakdown: ScoreBreakdown } {
  const proximityKnown = inputs.distanceFromHighPct != null;
  const volumeKnown = inputs.relativeVolume != null;
  const trendKnown = inputs.aboveFiftyDayMa != null;
  const coilScore = scoreCoil(inputs.recentRangePct, inputs.recentReturnPct);
  const closeLocationScore = scoreCloseLocation(inputs.closeLocation);

  const proximityScore = scoreProximity(
    inputs.distanceFromHighPct,
    maxDistance,
    inputs.priceToMaPct,
  );
  const volumeScore = scoreRelativeVolume(inputs.relativeVolume);
  const trendScore = scoreTrend(inputs);

  const unavailable: string[] = [];
  if (!proximityKnown) unavailable.push(MISSING_PROXIMITY);
  if (!volumeKnown) unavailable.push(MISSING_VOLUME);
  if (!trendKnown) unavailable.push(MISSING_TREND);
  if (coilScore == null) unavailable.push(MISSING_COIL);
  if (closeLocationScore == null) unavailable.push(MISSING_CLOSE);

  const score = combine([
    { score: proximityScore, weight: SCORE_WEIGHTS.proximity, include: proximityKnown },
    { score: volumeScore, weight: SCORE_WEIGHTS.volume, include: volumeKnown },
    { score: trendScore, weight: SCORE_WEIGHTS.trend, include: trendKnown },
    {
      score: coilScore ?? 0,
      weight: SCORE_WEIGHTS.coil,
      include: coilScore != null,
    },
    {
      score: closeLocationScore ?? 0,
      weight: SCORE_WEIGHTS.closeLocation,
      include: closeLocationScore != null,
    },
  ]);

  return {
    score,
    breakdown: {
      proximityScore: Math.round(proximityScore),
      volumeScore: Math.round(volumeScore),
      trendScore: Math.round(trendScore),
      coilScore: coilScore == null ? null : Math.round(coilScore),
      closeLocationScore:
        closeLocationScore == null ? null : Math.round(closeLocationScore),
      unavailable,
    },
  };
}

function isExtended(inputs: ScoreInputs): boolean {
  return (
    (inputs.priceToMaPct != null && inputs.priceToMaPct >= 12) ||
    (inputs.recentReturnPct != null && inputs.recentReturnPct >= 12)
  );
}

export function buildReason(inputs: ScoreInputs, breakdown: ScoreBreakdown): string {
  const extended = isExtended(inputs);
  const fresh =
    !extended &&
    breakdown.proximityScore >= 60 &&
    breakdown.volumeScore >= 55 &&
    breakdown.trendScore >= 75 &&
    breakdown.coilScore != null &&
    breakdown.coilScore >= 60;

  let lead = "Developing setup";
  if (inputs.aboveFiftyDayMa === false) lead = "Weak setup";
  else if (extended) lead = "Extended setup";
  else if (fresh) lead = "Fresh takeoff";
  else if (breakdown.volumeScore >= 70) lead = "Volume expansion";
  else if (breakdown.proximityScore >= 70 && breakdown.volumeScore < 40) {
    lead = "Near highs, light volume";
  }

  const parts: string[] = [];

  if (inputs.distanceFromHighPct != null) {
    if (inputs.distanceFromHighPct <= 0) parts.push("at or above 52-week high");
    else parts.push(`${inputs.distanceFromHighPct.toFixed(1)}% below 52w high`);
  }

  if (inputs.relativeVolume != null) {
    parts.push(`${inputs.relativeVolume.toFixed(2)}× avg volume`);
  }

  if (inputs.aboveFiftyDayMa === true) parts.push("above 50-day MA");
  else if (inputs.aboveFiftyDayMa === false) parts.push("below 50-day MA");

  if (inputs.fiftyDayRising === true) parts.push("50-day MA rising");
  else if (inputs.fiftyDayRising === false) parts.push("50-day MA not rising");

  if (inputs.aboveTwoHundredDayMa === true) parts.push("above 200-day MA");
  else if (inputs.aboveTwoHundredDayMa === false) parts.push("below 200-day MA");

  if (inputs.priceToMaPct != null && inputs.priceToMaPct > EXTENSION_FREE_PCT) {
    parts.push(`${inputs.priceToMaPct.toFixed(1)}% extended above 50-day`);
  }

  if (inputs.recentRangePct != null) {
    parts.push(`${inputs.recentRangePct.toFixed(1)}% 10-day range`);
  }

  if (parts.length === 0) return "Insufficient data for setup summary";
  return `${lead}: ${parts.join(", ")}`;
}

export function buildSetupNarrative(inputs: ScoreInputs, breakdown: ScoreBreakdown): string {
  if (
    inputs.distanceFromHighPct == null &&
    inputs.relativeVolume == null &&
    inputs.aboveFiftyDayMa == null
  ) {
    return "Not enough quote data to judge whether this is a takeoff.";
  }

  const omitted = breakdown.unavailable.filter(
    (item) => item === MISSING_COIL || item === MISSING_CLOSE,
  );
  const trendHoles: string[] = [];
  if (inputs.aboveFiftyDayMa === true && inputs.fiftyDayRising == null) {
    trendHoles.push("whether the 50-day average is rising");
  }
  if (inputs.aboveFiftyDayMa === true && inputs.aboveTwoHundredDayMa == null) {
    trendHoles.push("the 200-day average");
  }

  const notes: string[] = [];
  if (omitted.length > 0) {
    const label = omitted.join(" and ");
    notes.push(
      `${label.charAt(0).toUpperCase()}${label.slice(1)} ${omitted.length === 1 ? "was" : "were"} left out and the other weights were rescaled.`,
    );
  }
  if (trendHoles.length > 0) {
    const label = trendHoles.join(" and ");
    notes.push(
      `${label.charAt(0).toUpperCase()}${label.slice(1)} ${trendHoles.length === 1 ? "is" : "are"} unavailable, so those trend points were not awarded.`,
    );
  }
  const suffix = notes.length > 0 ? ` ${notes.join(" ")}` : "";

  if (inputs.aboveFiftyDayMa === false) {
    return `This looks weak rather than a fresh takeoff. Price is below the 50-day moving average, so the trend is not confirming a break.${suffix}`;
  }

  if (isExtended(inputs)) {
    return `This looks extended rather than a fresh takeoff. Price is already stretched above the 50-day average or the last 10 sessions have run steeply, which is a chase more than a new break.${suffix}`;
  }

  const nearHigh =
    inputs.distanceFromHighPct != null && inputs.distanceFromHighPct <= 3;
  const volumeOn = inputs.relativeVolume != null && inputs.relativeVolume >= 1.5;
  const trendOn =
    inputs.aboveFiftyDayMa === true &&
    inputs.fiftyDayRising === true &&
    inputs.aboveTwoHundredDayMa === true;
  const trendWithout200 =
    inputs.aboveFiftyDayMa === true &&
    inputs.fiftyDayRising === true &&
    inputs.aboveTwoHundredDayMa == null;
  const coiled = breakdown.coilScore != null && breakdown.coilScore >= 60;
  const closeSoft =
    inputs.closeLocation != null && inputs.closeLocation < 0.35;

  if (nearHigh && volumeOn && trendWithout200 && coiled) {
    const closeNote = closeSoft
      ? " The last session still closed in the lower part of its range."
      : "";
    const extra = notes
      .filter((note) => !note.startsWith("The 200-day average"))
      .join(" ");
    return `This looks like a fresh takeoff on the data Yahoo provided. Price is close to the 52-week high, volume is expanding, and the 50-day average is rising, but the 200-day average was unavailable so those trend points were not awarded.${closeNote}${extra ? ` ${extra}` : ""}`;
  }

  if (nearHigh && volumeOn && trendOn && coiled) {
    const closeNote = closeSoft
      ? " The last session still closed in the lower part of its range."
      : "";
    return `This looks like a fresh takeoff. Price is close to the 52-week high without being stretched far above the 50-day average, volume is expanding, the trend stack is intact, and the recent range is still tight.${closeNote}${suffix}`;
  }

  if (nearHigh && !volumeOn) {
    return `Price is near the 52-week high, but volume is not expanded enough to confirm a takeoff. An average day near the high is not a high-score setup.${suffix}`;
  }

  return `This is only a partial setup. Proximity, expanding volume, the trend stack, and a tight recent range do not all agree yet, so it is not a confirmed fresh takeoff.${suffix}`;
}
