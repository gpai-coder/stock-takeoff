import { getRegularSessionElapsedFraction, isRegularUsSession } from "./market-session";
import type { RelativeVolumeContext } from "./stock";
import { quoteTimestamp, type RawQuote } from "./yahoo";

export function describeQuoteSession(quotes: RawQuote[], now = new Date()) {
  const marketState = quotes.find((quote) => quote.marketState)?.marketState ?? null;
  const latestQuoteTime = quotes
    .map((quote) => quoteTimestamp(quote))
    .filter((time): time is number => time != null)
    .sort((a, b) => b - a)[0];
  const referenceTime = latestQuoteTime ? new Date(latestQuoteTime) : now;
  const relativeVolumeSessionAdjusted = isRegularUsSession(marketState);
  const relativeVolumeContext: RelativeVolumeContext = {
    sessionAdjusted: relativeVolumeSessionAdjusted,
    elapsedFraction: relativeVolumeSessionAdjusted
      ? getRegularSessionElapsedFraction(referenceTime)
      : 1,
  };

  return {
    marketState,
    asOf: latestQuoteTime ? referenceTime.toISOString() : now.toISOString(),
    relativeVolumeSessionAdjusted,
    relativeVolumeContext,
  };
}
