#!/usr/bin/env python3
"""Drive Takeoff /api/screener with optional query params."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_BASE = "https://stock-takeoff-gpai1.vercel.app"


def base_url() -> str:
    return os.environ.get("TAKEOFF_BASE_URL", DEFAULT_BASE).rstrip("/")


def fetch_screener(query: str | None) -> tuple[int, dict]:
    path = "/api/screener"
    if query:
        q = query.lstrip("?")
        path = f"{path}?{q}"
    url = f"{base_url()}{path}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = {"error": body}
        return exc.code, payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Drive Takeoff /api/screener")
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument("--query", default=None, help="Optional query string (no leading ?)")
    args = parser.parse_args()

    status, data = fetch_screener(args.query)

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")

    if status != 200 or not isinstance(data, dict):
        print(f"FAIL: HTTP {status}", file=sys.stderr)
        return 1

    matched = data.get("matchedCount", 0)
    stocks = data.get("stocks") or []
    symbols = [s.get("symbol", "?") for s in stocks[:10]]
    print(f"matchedCount={matched}")
    print(f"top symbols: {', '.join(symbols) if symbols else '(none)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
