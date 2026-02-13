from datetime import datetime, timezone

from fastapi import FastAPI

APP_NAME = "Alertamiento S\u00edsmico TAKAB"
APP_VERSION = "0.1.0"

app = FastAPI(title=APP_NAME, version=APP_VERSION)


@app.get("/api/health")
def health() -> dict[str, str]:
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return {
        "status": "ok",
        "time_utc": now_utc,
        "version": APP_VERSION,
        "name": APP_NAME,
    }
