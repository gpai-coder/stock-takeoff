import { NextResponse } from "next/server";
import { getScreenerResults } from "@/lib/screener";
import type { ScreenerSearchParams } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 300;
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries()) as ScreenerSearchParams;

  try {
    const result = await getScreenerResults(params);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load screener data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
