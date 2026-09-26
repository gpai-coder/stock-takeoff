const TICKER = /^[A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,2})?$/;

export function normalizeTicker(value: string): string | null {
  const symbol = value.trim().toUpperCase().replace(/\./g, "-");
  if (!TICKER.test(symbol)) return null;
  return symbol;
}

export function parseTickerList(value: string, limit = 40): string[] {
  const symbols: string[] = [];
  for (const part of value.split(/[\s,]+/)) {
    const symbol = normalizeTicker(part);
    if (!symbol || symbols.includes(symbol)) continue;
    symbols.push(symbol);
    if (symbols.length >= limit) break;
  }
  return symbols;
}
