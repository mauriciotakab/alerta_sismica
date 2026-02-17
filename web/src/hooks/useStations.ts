import { useCallback, useEffect, useMemo, useState } from 'react';

import { getStationStatus, getStations } from '@/services/api';
import type { Station, StationConfig, StationStatus } from '@/types/seismic';

const STATUS_POLL_MS = 5000;

function statusToUiState(status?: StationStatus): Station['status'] {
  if (!status) return 'offline';
  return status.online ? 'online' : 'offline';
}

function toUiStation(config: StationConfig, status?: StationStatus): Station {
  const hasLastSample = Boolean(status?.last_sample_utc);
  const lastPing = hasLastSample && status?.last_sample_utc ? new Date(status.last_sample_utc) : new Date();

  return {
    id: config.id,
    name: `${config.net}.${config.sta}`,
    building: `Estacion ${config.sta}`,
    location: { lat: 0, lon: 0 },
    status: statusToUiState(status),
    lastPing,
    metrics: {
      seedlinkActive: Boolean(status?.online),
      diskUsagePercent: 0,
      temperature: 0,
      ntpSynced: Boolean(status?.online),
      wireguardConnected: Boolean(status?.online),
    },
    channels: config.channels,
    net: config.net,
    sta: config.sta,
    loc: config.loc,
    host: config.host,
    seedlinkPort: config.seedlink_port,
    targetHzForWeb: config.target_hz_for_web,
    statusData: status,
  };
}

export function useStations() {
  const [configs, setConfigs] = useState<StationConfig[]>([]);
  const [statusByStation, setStatusByStation] = useState<Record<string, StationStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stations = await getStations();
      setConfigs(stations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar estaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStatuses = useCallback(async (stations: StationConfig[]) => {
    if (!stations.length) {
      setStatusByStation({});
      return;
    }

    const results = await Promise.all(
      stations.map(async (station) => {
        try {
          const status = await getStationStatus(station.id);
          return [station.id, status] as const;
        } catch {
          return [station.id, undefined] as const;
        }
      })
    );

    const next: Record<string, StationStatus> = {};
    for (const [stationId, status] of results) {
      if (status) next[stationId] = status;
    }
    setStatusByStation(next);
  }, []);

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  useEffect(() => {
    if (!configs.length) return;
    void refreshStatuses(configs);

    const intervalId = window.setInterval(() => {
      void refreshStatuses(configs);
    }, STATUS_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [configs, refreshStatuses]);

  const stations = useMemo(
    () => configs.map((config) => toUiStation(config, statusByStation[config.id])),
    [configs, statusByStation]
  );

  const stats = useMemo(() => {
    const total = stations.length;
    const online = stations.filter((station) => station.status === 'online').length;
    const warning = stations.filter((station) => station.status === 'warning').length;
    const offline = stations.filter((station) => station.status === 'offline').length;
    return { total, online, warning, offline };
  }, [stations]);

  return {
    stations,
    statusByStation,
    stats,
    isLoading,
    error,
    refreshStations: loadStations,
  };
}
