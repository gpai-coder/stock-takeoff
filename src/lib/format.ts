export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 2 : 3,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatMultiple(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}×`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

export function formatMarketState(state: string | null | undefined): string {
  if (!state) return "Unknown";
  switch (state) {
    case "REGULAR":
      return "Market open";
    case "PRE":
      return "Pre-market";
    case "POST":
      return "After hours";
    case "POSTPOST":
    case "CLOSED":
      return "Market closed";
    default:
      return state.replace(/_/g, " ").toLowerCase();
  }
}

export function parseMarketCapInput(value: string): number | null {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)(B|M)?$/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const suffix = match[2];
  if (suffix === "B") return amount * 1_000_000_000;
  if (suffix === "M") return amount * 1_000_000;
  return amount;
}
