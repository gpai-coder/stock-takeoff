#!/usr/bin/env python3
"""Health check for Takeoff /api/screener."""

import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_BASE = "https://stock-takeoff-gpai1.vercel.app"
REQUIRED_KEYS = ("asOf", "marketState", "universeSize", "matchedCount", "filters", "stocks")
MIN_UNIVERSE_SIZE = 400


def base_url() -> str:
    return os.environ.get("TAKEOFF_BASE_URL", DEFAULT_BASE).rstrip("/")


def fetch_screener() -> tuple[int, dict]:
    url = f"{base_url()}/api/screener"
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
    out_path = sys.argv[1] if len(sys.argv) > 1 else None

    status, data = fetch_screener()
    errors: list[str] = []

    if status != 200:
        errors.append(f"HTTP {status}, expected 200")

    if isinstance(data, dict):
        missing = [k for k in REQUIRED_KEYS if k not in data]
        if missing:
            errors.append(f"missing keys: {', '.join(missing)}")
        universe = data.get("universeSize")
        if not isinstance(universe, int) or universe < MIN_UNIVERSE_SIZE:
            errors.append(
                f"universeSize={universe!r}, expected int >= {MIN_UNIVERSE_SIZE}"
            )
    else:
        errors.append(f"expected JSON object, got {type(data).__name__}")

    report = {
        "ok": not errors,
        "baseUrl": base_url(),
        "httpStatus": status,
        "errors": errors,
        "asOf": data.get("asOf") if isinstance(data, dict) else None,
        "marketState": data.get("marketState") if isinstance(data, dict) else None,
        "universeSize": data.get("universeSize") if isinstance(data, dict) else None,
        "matchedCount": data.get("matchedCount") if isinstance(data, dict) else None,
        "relativeVolumeSessionAdjusted": (
            data.get("relativeVolumeSessionAdjusted") if isinstance(data, dict) else None
        ),
    }

    if out_path:
        os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump({**report, "response": data}, fh, indent=2)
            fh.write("\n")

    if errors:
        for err in errors:
            print(f"FAIL: {err}", file=sys.stderr)
        return 1

    print(
        f"OK: universeSize={report['universeSize']} matchedCount={report['matchedCount']} "
        f"marketState={report['marketState']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
