from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass
class WaveChunk:
    seq: int
    t0: datetime
    fs_original: float
    fs_web: float
    samples: list[float]

    @property
    def duration_seconds(self) -> float:
        if self.fs_web <= 0:
            return 0.0
        return len(self.samples) / self.fs_web

    @property
    def endtime(self) -> datetime:
        return self.t0 + timedelta(seconds=self.duration_seconds)


class ChannelRingBuffer:
    def __init__(self, retention_seconds: int = 120) -> None:
        self.retention_seconds = retention_seconds
        self._chunks: deque[WaveChunk] = deque()
        self._seq = 0
        self._lock = Lock()

    def append(self, t0: datetime, fs_original: float, fs_web: float, samples: list[float]) -> WaveChunk:
        with self._lock:
            self._seq += 1
            chunk = WaveChunk(
                seq=self._seq,
                t0=t0.astimezone(timezone.utc),
                fs_original=float(fs_original),
                fs_web=float(fs_web),
                samples=samples,
            )
            self._chunks.append(chunk)
            self._purge_locked()
            return chunk

    def latest_seq(self) -> int:
        with self._lock:
            return self._seq

    def latest_chunk(self) -> WaveChunk | None:
        with self._lock:
            return self._chunks[-1] if self._chunks else None

    def chunks_since(self, seq: int) -> list[WaveChunk]:
        with self._lock:
            return [chunk for chunk in self._chunks if chunk.seq > seq]

    def chunks_for_window(self, seconds: int) -> list[WaveChunk]:
        cutoff = utc_now() - timedelta(seconds=max(1, seconds))
        with self._lock:
            return [chunk for chunk in self._chunks if chunk.endtime >= cutoff]

    def _purge_locked(self) -> None:
        cutoff = utc_now() - timedelta(seconds=self.retention_seconds)
        while self._chunks and self._chunks[0].endtime < cutoff:
            self._chunks.popleft()
