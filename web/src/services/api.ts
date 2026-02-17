import type { StationConfig, StationStatus, WaveChunk } from '@/types/seismic';

const API_BASE = '/api';

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API ${response.status} ${response.statusText}: ${message}`);
  }

  return (await response.json()) as T;
}

export function getStations(): Promise<StationConfig[]> {
  return requestJson<StationConfig[]>('/stations');
}

export function getStationStatus(stationId: string): Promise<StationStatus> {
  return requestJson<StationStatus>(`/stations/${encodeURIComponent(stationId)}/status`);
}

export function getWaveSnapshot(
  stationId: string,
  channel: string,
  seconds: number,
  hz: number
): Promise<WaveChunk> {
  const params = new URLSearchParams({
    channel: channel.toUpperCase(),
    seconds: String(seconds),
    hz: String(hz),
  });
  return requestJson<WaveChunk>(`/stations/${encodeURIComponent(stationId)}/wave/snapshot?${params.toString()}`);
}
