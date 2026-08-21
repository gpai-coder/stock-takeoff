import { unstable_cache } from "next/cache";

const SP500_CSV_URL =
  "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv";

function normalizeSymbol(symbol: string): string {
  return symbol.trim().replace(/\./g, "-");
}

async function fetchSp500Symbols(): Promise<string[]> {
  const response = await fetch(SP500_CSV_URL, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load S&P 500 universe (${response.status})`);
  }

  const csv = await response.text();
  const lines = csv.trim().split("\n").slice(1);

  return lines
    .map((line) => line.split(",")[0]?.trim())
    .filter(Boolean)
    .map(normalizeSymbol);
}

export const getSp500Symbols = unstable_cache(
  fetchSp500Symbols,
  ["sp500-symbols"],
  { revalidate: 60 * 60 * 24 },
);

export interface UniverseEntry {
  symbol: string;
  name: string;
}

async function fetchSp500Universe(): Promise<UniverseEntry[]> {
  const response = await fetch(SP500_CSV_URL, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load S&P 500 universe (${response.status})`);
  }

  const csv = await response.text();
  const lines = csv.trim().split("\n").slice(1);

  return lines
    .map((line) => {
      const [symbolRaw, nameRaw] = line.split(",");
      if (!symbolRaw) return null;
      return {
        symbol: normalizeSymbol(symbolRaw),
        name: nameRaw?.replace(/^"|"$/g, "") ?? symbolRaw,
      };
    })
    .filter((entry): entry is UniverseEntry => entry != null);
}

export const getSp500Universe = unstable_cache(
  fetchSp500Universe,
  ["sp500-universe"],
  { revalidate: 60 * 60 * 24 },
);
