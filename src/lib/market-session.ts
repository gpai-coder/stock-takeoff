const US_MARKET_OPEN_MINUTES = 9 * 60 + 30;
const US_MARKET_CLOSE_MINUTES = 16 * 60;
const REGULAR_SESSION_MINUTES = US_MARKET_CLOSE_MINUTES - US_MARKET_OPEN_MINUTES;
const ELAPSED_MINUTES_FLOOR = 45;

function getEasternTimeParts(date: Date): {
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return { hour, minute };
}

export function isRegularUsSession(marketState: string | null | undefined): boolean {
  return marketState === "REGULAR";
}

export function getRegularSessionElapsedFraction(referenceTime: Date = new Date()): number {
  const { hour, minute } = getEasternTimeParts(referenceTime);
  const minutesSinceMidnight = hour * 60 + minute;
  const elapsedMinutes = minutesSinceMidnight - US_MARKET_OPEN_MINUTES;

  if (elapsedMinutes <= 0) {
    return ELAPSED_MINUTES_FLOOR / REGULAR_SESSION_MINUTES;
  }

  if (elapsedMinutes >= REGULAR_SESSION_MINUTES) {
    return 1;
  }

  const adjustedElapsed = Math.max(elapsedMinutes, ELAPSED_MINUTES_FLOOR);
  return adjustedElapsed / REGULAR_SESSION_MINUTES;
}

export function sessionAdjustedRelativeVolume(
  volume: number | null,
  avgVolume: number | null,
  options: {
    sessionAdjusted: boolean;
    elapsedFraction?: number;
  },
): number | null {
  if (volume == null || avgVolume == null || avgVolume <= 0) return null;

  const rawRatio = volume / avgVolume;
  if (!options.sessionAdjusted) return rawRatio;

  const elapsedFraction = options.elapsedFraction;
  if (elapsedFraction == null || elapsedFraction <= 0) return rawRatio;

  return rawRatio / elapsedFraction;
}
