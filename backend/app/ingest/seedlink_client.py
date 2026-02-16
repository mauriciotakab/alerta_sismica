from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from threading import Event, RLock, Thread

import numpy as np
from obspy.clients.seedlink.easyseedlink import EasySeedLinkClient

from app.config import StationConfig
from app.ingest.ring_buffer import ChannelRingBuffer, WaveChunk, to_iso_utc, utc_now

logger = logging.getLogger(__name__)


def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def downsample_samples(samples: list[float], src_fs: float, target_fs: int) -> tuple[list[float], float]:
    if not samples or src_fs <= 0:
        return samples, src_fs

    target = float(target_fs)
    if target <= 0 or src_fs <= target:
        return samples, src_fs

    step = max(1, int(round(src_fs / target)))
    return samples[::step], src_fs / step


@dataclass
class StationRuntimeState:
    connected: bool = False
    last_sample_utc: datetime | None = None
    last_latency_ms: float | None = None
    channel_sample_rate: dict[str, float] = field(default_factory=dict)
    channel_last_seq: dict[str, int] = field(default_factory=dict)


class SeedLinkRealtimeService:
    def __init__(self, stations: list[StationConfig], retention_seconds: int = 120) -> None:
        self._stations = stations
        self._station_map = {station.id: station for station in stations}
        self._station_channels = {station.id: {channel.upper() for channel in station.channels} for station in stations}
        self._retention_seconds = retention_seconds
        self._buffers: dict[tuple[str, str], ChannelRingBuffer] = {}
        self._runtime: dict[str, StationRuntimeState] = {}
        self._workers: list[_StationSeedLinkWorker] = []
        self._lock = RLock()

        for station in stations:
            runtime = StationRuntimeState(
                channel_sample_rate={channel.upper(): 0.0 for channel in station.channels},
                channel_last_seq={channel.upper(): 0 for channel in station.channels},
            )
            self._runtime[station.id] = runtime
            for channel in station.channels:
                self._buffers[(station.id, channel.upper())] = ChannelRingBuffer(retention_seconds=retention_seconds)

    def start(self) -> None:
        if self._workers:
            return

        for station in self._stations:
            worker = _StationSeedLinkWorker(service=self, station=station)
            worker.start()
            self._workers.append(worker)
            logger.info("Started SeedLink worker for station %s", station.id)

    def stop(self) -> None:
        for worker in self._workers:
            worker.stop()
        for worker in self._workers:
            worker.join(timeout=5)
        self._workers = []

    def list_stations(self) -> list[dict]:
        return [station.model_dump() for station in self._stations]

    def has_station_channel(self, station_id: str, channel: str) -> bool:
        normalized_channel = channel.upper()
        return (station_id, normalized_channel) in self._buffers

    def set_connection_state(self, station_id: str, connected: bool) -> None:
        with self._lock:
            runtime = self._runtime.get(station_id)
            if runtime:
                runtime.connected = connected

    def handle_trace(self, station_id: str, trace) -> None:
        station = self._station_map.get(station_id)
        if station is None:
            return

        channel = str(getattr(trace.stats, "channel", "")).upper()
        if channel not in self._station_channels.get(station_id, set()):
            return

        location = str(getattr(trace.stats, "location", "") or "").strip()
        if location and location != station.loc:
            return

        data = np.asarray(trace.data, dtype=float)
        if data.size == 0:
            return

        fs_original = float(getattr(trace.stats, "sampling_rate", 0.0) or 0.0)
        web_target_hz = int(station.target_hz_for_web)
        samples_decimated, fs_web = downsample_samples(data.tolist(), fs_original, web_target_hz)

        t0 = ensure_utc(trace.stats.starttime.datetime)
        endtime = ensure_utc(trace.stats.endtime.datetime)
        buffer = self._buffers[(station_id, channel)]
        chunk = buffer.append(t0=t0, fs_original=fs_original, fs_web=fs_web, samples=samples_decimated)

        latency_ms = max((utc_now() - endtime).total_seconds() * 1000.0, 0.0)
        with self._lock:
            runtime = self._runtime[station_id]
            runtime.connected = True
            runtime.last_sample_utc = endtime
            runtime.last_latency_ms = latency_ms
            runtime.channel_sample_rate[channel] = fs_original
            runtime.channel_last_seq[channel] = chunk.seq

    def get_status(self, station_id: str) -> dict:
        station = self._station_map.get(station_id)
        if station is None:
            raise KeyError(station_id)

        with self._lock:
            runtime = self._runtime[station_id]
            last_sample_utc = runtime.last_sample_utc
            last_latency_ms = runtime.last_latency_ms
            connected = runtime.connected
            channel_sample_rate = dict(runtime.channel_sample_rate)
            channel_last_seq = dict(runtime.channel_last_seq)

        now = utc_now()
        if last_sample_utc is None:
            last_seen_seconds = None
            online = False
            last_sample_iso = None
        else:
            last_seen_seconds = max((now - last_sample_utc).total_seconds(), 0.0)
            online = connected and last_seen_seconds <= 15
            last_sample_iso = to_iso_utc(last_sample_utc)

        channels: dict[str, dict] = {}
        for channel in station.channels:
            name = channel.upper()
            channels[name] = {
                "sample_rate": channel_sample_rate.get(name, 0.0),
                "last_seq": channel_last_seq.get(name, 0),
            }

        return {
            "station_id": station_id,
            "online": online,
            "last_seen_seconds": last_seen_seconds,
            "last_sample_utc": last_sample_iso,
            "latency_ms": last_latency_ms,
            "channels": channels,
        }

    def build_snapshot(self, station_id: str, channel: str, seconds: int, hz: int) -> dict:
        normalized_channel = channel.upper()
        buffer = self._buffers[(station_id, normalized_channel)]
        chunks = buffer.chunks_for_window(seconds)
        chunks.sort(key=lambda item: item.seq)

        if not chunks:
            return {
                "type": "wave_chunk",
                "station_id": station_id,
                "channel": normalized_channel,
                "t0": to_iso_utc(utc_now()),
                "fs": float(hz),
                "samples": [],
                "unit": "counts",
                "seq": buffer.latest_seq(),
            }

        merged_samples: list[float] = []
        source_fs = chunks[0].fs_web
        t0 = chunks[0].t0
        for chunk in chunks:
            merged_samples.extend(chunk.samples)

        if source_fs > 0:
            cutoff = utc_now() - timedelta(seconds=max(1, seconds))
            if t0 < cutoff and merged_samples:
                offset = int((cutoff - t0).total_seconds() * source_fs)
                if offset >= len(merged_samples):
                    merged_samples = []
                    t0 = cutoff
                elif offset > 0:
                    merged_samples = merged_samples[offset:]
                    t0 = t0 + timedelta(seconds=offset / source_fs)

        output_samples, output_fs = downsample_samples(merged_samples, source_fs, hz)
        return {
            "type": "wave_chunk",
            "station_id": station_id,
            "channel": normalized_channel,
            "t0": to_iso_utc(t0),
            "fs": output_fs,
            "samples": output_samples,
            "unit": "counts",
            "seq": chunks[-1].seq,
        }

    def stream_chunks_since(self, station_id: str, channel: str, seq: int, hz: int) -> list[dict]:
        normalized_channel = channel.upper()
        buffer = self._buffers[(station_id, normalized_channel)]
        chunks: list[WaveChunk] = buffer.chunks_since(seq)
        if not chunks:
            return []

        output: list[dict] = []
        for chunk in chunks:
            samples, fs_out = downsample_samples(chunk.samples, chunk.fs_web, hz)
            output.append(
                {
                    "type": "wave_chunk",
                    "station_id": station_id,
                    "channel": normalized_channel,
                    "t0": to_iso_utc(chunk.t0),
                    "fs": fs_out,
                    "samples": samples,
                    "unit": "counts",
                    "seq": chunk.seq,
                }
            )
        return output


class _TAKABSeedLinkClient(EasySeedLinkClient):
    def __init__(self, server_url: str, service: SeedLinkRealtimeService, station: StationConfig) -> None:
        super().__init__(server_url=server_url)
        self._service = service
        self._station = station

    def on_data(self, trace) -> None:
        self._service.handle_trace(self._station.id, trace)

    def on_seedlink_error(self) -> None:
        logger.warning("SeedLink error for station %s", self._station.id)

    def on_terminate(self) -> None:
        logger.warning("SeedLink terminated for station %s", self._station.id)


class _StationSeedLinkWorker(Thread):
    def __init__(self, service: SeedLinkRealtimeService, station: StationConfig) -> None:
        super().__init__(daemon=True)
        self._service = service
        self._station = station
        self._stop_event = Event()
        self._client: _TAKABSeedLinkClient | None = None

    def run(self) -> None:
        backoff_seconds = 1
        while not self._stop_event.is_set():
            seedlink_url = f"{self._station.host}:{self._station.seedlink_port}"
            try:
                self._client = _TAKABSeedLinkClient(seedlink_url, self._service, self._station)
                self._subscribe_streams(self._client)
                self._service.set_connection_state(self._station.id, True)
                backoff_seconds = 1
                logger.info("Connected to SeedLink %s for %s", seedlink_url, self._station.id)
                self._client.run()
            except Exception:
                logger.exception("SeedLink worker error for station %s", self._station.id)
            finally:
                self._service.set_connection_state(self._station.id, False)
                self._client = None

            if self._stop_event.wait(timeout=backoff_seconds):
                break
            backoff_seconds = min(backoff_seconds * 2, 30)

    def stop(self) -> None:
        self._stop_event.set()
        client = self._client
        if client is not None:
            try:
                client.close()
            except Exception:
                logger.exception("Error closing SeedLink client for %s", self._station.id)

    def _subscribe_streams(self, client: _TAKABSeedLinkClient) -> None:
        for channel in self._station.channels:
            subscribed = False
            for selector_call in (
                lambda: client.select_stream(self._station.net, self._station.sta, channel),
                lambda: client.select_stream(self._station.net, self._station.sta, selector=channel),
            ):
                if subscribed:
                    break
                try:
                    selector_call()
                    subscribed = True
                except TypeError:
                    continue

            if not subscribed:
                raise RuntimeError(
                    f"Could not subscribe station={self._station.id} channel={channel}: unsupported select_stream signature"
                )
