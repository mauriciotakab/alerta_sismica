import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI

from app.api.routes.stations import router as stations_router
from app.api.routes.waves import router as waves_router
from app.config import get_stations_config_path, load_stations_config
from app.ingest.seedlink_client import SeedLinkRealtimeService

APP_NAME = "Alertamiento S\u00edsmico TAKAB"
APP_VERSION = "0.1.0"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    stations_config_path = get_stations_config_path()
    stations_config = load_stations_config(stations_config_path)
    logger.info(
        "Loaded stations config from %s with %d station(s)",
        stations_config_path,
        len(stations_config.stations),
    )
    realtime_service = SeedLinkRealtimeService(stations_config.stations, retention_seconds=120)
    realtime_service.start()
    logger.info("SeedLink realtime service started")
    app.state.realtime_service = realtime_service
    app.state.stations_config = stations_config
    yield
    realtime_service.stop()
    logger.info("SeedLink realtime service stopped")


app = FastAPI(title=APP_NAME, version=APP_VERSION, lifespan=lifespan)
app.include_router(stations_router)
app.include_router(waves_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return {
        "status": "ok",
        "time_utc": now_utc,
        "version": APP_VERSION,
        "name": APP_NAME,
    }
