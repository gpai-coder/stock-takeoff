import { NextResponse } from "next/server";
import { getTickerAnalysis } from "@/lib/analyze";

export const dynamic = "force-dynamic";
export const revalidate = 300;
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ symbol: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { symbol } = await context.params;

  try {
    const result = await getTickerAnalysis(symbol);
    return NextResponse.json(result, {
      status: result.stock ? 200 : 404,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ticker";
    return NextResponse.json(
      { symbol, stock: null, chart: [], error: message },
      { status: 502 },
    );
  }
}
