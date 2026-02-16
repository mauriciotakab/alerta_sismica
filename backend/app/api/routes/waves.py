import asyncio

from fastapi import APIRouter, HTTPException, Query, Request, WebSocket, WebSocketDisconnect

from app.ingest.seedlink_client import SeedLinkRealtimeService

router = APIRouter(tags=["waves"])


def get_service(request: Request) -> SeedLinkRealtimeService:
    return request.app.state.realtime_service


@router.get("/api/stations/{station_id}/wave/snapshot")
def wave_snapshot(
    request: Request,
    station_id: str,
    channel: str = Query(..., description="Channel, for example ENZ"),
    seconds: int = Query(60, ge=1, le=120),
    hz: int = Query(20, ge=1, le=100),
) -> dict:
    service = get_service(request)
    normalized_channel = channel.upper()
    if not service.has_station_channel(station_id, normalized_channel):
        raise HTTPException(status_code=404, detail=f"Station/channel not found: {station_id}/{normalized_channel}")
    return service.build_snapshot(station_id, normalized_channel, seconds, hz)


@router.websocket("/ws/wave/{station_id}/{channel}")
async def wave_ws(
    websocket: WebSocket,
    station_id: str,
    channel: str,
    window: int = Query(30, ge=1, le=120),
    hz: int = Query(20, ge=1, le=100),
) -> None:
    service: SeedLinkRealtimeService = websocket.app.state.realtime_service
    normalized_channel = channel.upper()

    if not service.has_station_channel(station_id, normalized_channel):
        await websocket.accept()
        await websocket.send_json({"error": f"Station/channel not found: {station_id}/{normalized_channel}"})
        await websocket.close(code=1008)
        return

    await websocket.accept()
    snapshot = service.build_snapshot(station_id, normalized_channel, window, hz)
    await websocket.send_json(snapshot)
    latest_seq = int(snapshot.get("seq", 0))

    try:
        while True:
            new_chunks = service.stream_chunks_since(station_id, normalized_channel, latest_seq, hz)
            for chunk in new_chunks:
                latest_seq = int(chunk["seq"])
                await websocket.send_json(chunk)
            await asyncio.sleep(0.15)
    except WebSocketDisconnect:
        return
