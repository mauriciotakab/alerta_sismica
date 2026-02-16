from fastapi import APIRouter, HTTPException, Request

from app.ingest.seedlink_client import SeedLinkRealtimeService

router = APIRouter(prefix="/api/stations", tags=["stations"])


def get_service(request: Request) -> SeedLinkRealtimeService:
    return request.app.state.realtime_service


@router.get("")
def list_stations(request: Request) -> list[dict]:
    return get_service(request).list_stations()


@router.get("/{station_id}/status")
def station_status(station_id: str, request: Request) -> dict:
    service = get_service(request)
    try:
        return service.get_status(station_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Station not found: {station_id}") from exc
