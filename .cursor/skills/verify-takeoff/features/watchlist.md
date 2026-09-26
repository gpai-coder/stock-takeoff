# Watchlist

Symbols you want to keep an eye on, stored only in this browser.

## Sub-features

- Storage key `takeoff-watchlist` (a JSON array of tickers). No account.
- **Watch** / **Remove** on each screener row. The row still expands when you click elsewhere on it.
- **Add a ticker** on the screener and on `/watchlist`.
- `/watchlist` shows price, takeoff score, relative volume, and distance from the 52-week high for every saved symbol, including names the current screener filters hide.
- Empty state when nothing is saved. Refresh keeps the list.
- An unknown ticker shows Unavailable, not a made-up quote.

## How to get to it (user POV)

On the screener, click **Watch** on a row or type a ticker and choose **Add to watchlist**. Open **Watchlist** in the nav. Remove a symbol from either place. Refresh the watchlist page; the same symbols come back.

## Driving it

The list itself is browser storage. Quotes are a GET:

```bash
python3 - << 'PY'
import json, os, urllib.request
base = os.environ.get("TAKEOFF_BASE_URL", "http://localhost:3000").rstrip("/")
url = f"{base}/api/watchlist?symbols=AAPL,NOTAREALTICKER"
with urllib.request.urlopen(url, timeout=120) as resp:
    json.dump(json.load(resp), open(".cursor/skills/verify-takeoff/artifacts/watchlist.json", "w"), indent=2)
PY
```

`AAPL` should have a price. `NOTAREALTICKER` is not a legal ticker and is ignored; a plausible but unknown symbol such as `ZZZZ` is listed under `missing` with no fabricated price.
