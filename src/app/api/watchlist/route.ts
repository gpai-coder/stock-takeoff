import { NextResponse } from "next/server";
import { analyzeSymbols } from "@/lib/analyze";

export const dynamic = "force-dynamic";
export const revalidate = 300;
export const maxDuration = 60;

export async function GET(request: Request) {
  const symbols = new URL(request.url).searchParams.get("symbols") ?? "";

  try {
    const result = await analyzeSymbols(symbols.split(/[\s,]+/));
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watchlist quotes";
    return NextResponse.json({ error: message, stocks: [], missing: [] }, { status: 502 });
  }
}
