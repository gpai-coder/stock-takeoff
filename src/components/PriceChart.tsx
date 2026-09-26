import type { PricePoint } from "@/lib/types";

function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}

export function PriceChart({ points }: { points: PricePoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted">Recent prices are unavailable.</p>
    );
  }

  const width = 640;
  const height = 220;
  const pad = 12;
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const coords = points
    .map((point, index) => {
      const x = pad + (index / (points.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (point.close - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Recent closing prices"
        className="h-56 w-full text-accent"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={coords}
        />
      </svg>
      <figcaption className="flex justify-between text-xs text-muted">
        <span>{formatDay(points[0].date)}</span>
        <span>
          {formatDay(points[points.length - 1].date)} · {points.length} closes
        </span>
      </figcaption>
    </figure>
  );
}
