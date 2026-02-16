import json
import os
from pathlib import Path

from pydantic import BaseModel, Field


DEFAULT_STATIONS_CONFIG = "/app/config/stations.json"


class StationConfig(BaseModel):
    id: str
    host: str
    seedlink_port: int = 18000
    net: str
    sta: str
    loc: str = "00"
    channels: list[str] = Field(default_factory=list)
    target_hz_for_web: int = 20


class StationsConfig(BaseModel):
    stations: list[StationConfig] = Field(default_factory=list)


def get_stations_config_path() -> str:
    return os.getenv("STATIONS_CONFIG", DEFAULT_STATIONS_CONFIG)


def load_stations_config(config_path: str | None = None) -> StationsConfig:
    path = Path(config_path or get_stations_config_path())
    if not path.exists():
        raise FileNotFoundError(f"Stations config file not found: {path}")

    with path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)
    return StationsConfig.model_validate(payload)
