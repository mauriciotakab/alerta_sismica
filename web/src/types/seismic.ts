export type StationState = 'online' | 'offline' | 'warning';

export interface StationConfig {
  id: string;
  host: string;
  seedlink_port: number;
  net: string;
  sta: string;
  loc: string;
  channels: string[];
  target_hz_for_web: number;
}

export interface StationChannelStatus {
  sample_rate: number;
  last_seq: number;
}

export interface StationStatus {
  station_id: string;
  online: boolean;
  last_seen_seconds: number | null;
  last_sample_utc: string | null;
  latency_ms: number | null;
  channels: Record<string, StationChannelStatus>;
}

export interface WaveChunk {
  type: 'wave_chunk';
  station_id: string;
  channel: string;
  t0: string;
  fs: number;
  samples: number[];
  unit: string;
  seq: number;
}

export interface Station {
  id: string;
  name: string;
  building: string;
  location: {
    lat: number;
    lon: number;
  };
  status: StationState;
  lastPing: Date;
  metrics: {
    seedlinkActive: boolean;
    diskUsagePercent: number;
    temperature: number;
    ntpSynced: boolean;
    wireguardConnected: boolean;
  };
  channels?: string[];
  net?: string;
  sta?: string;
  loc?: string;
  host?: string;
  seedlinkPort?: number;
  targetHzForWeb?: number;
  statusData?: StationStatus;
  lastEvent?: {
    timestamp: Date;
    pga: number;
    pgv: number;
  };
}

export interface SeismicEvent {
  id: string;
  timestamp: Date;
  magnitude: number;
  depth: number;
  location: {
    lat: number;
    lon: number;
    description: string;
  };
  source: 'SSN' | 'LOCAL' | 'SASMEX';
  reported: boolean;
}

export interface BuildingStatus {
  id: string;
  name: string;
  stationId: string;
  semaphore: 'green' | 'yellow' | 'red';
  lastPga: number;
  lastEvaluation: Date;
  recommendation: string;
}

export interface WaveformData {
  stationId: string;
  channel: string;
  samples: number[];
  startTime: Date;
  sampleRate: number;
}

export const PGA_THRESHOLDS = {
  green: 5,
  yellow: 15,
  red: 15,
} as const;

export type SemaphoreColor = 'green' | 'yellow' | 'red';

export function calculateSemaphore(pga: number): SemaphoreColor {
  if (pga < PGA_THRESHOLDS.green) return 'green';
  if (pga < PGA_THRESHOLDS.yellow) return 'yellow';
  return 'red';
}

export function getSemaphoreRecommendation(color: SemaphoreColor): string {
  switch (color) {
    case 'green':
      return 'Reingreso autorizado - Estructura sin dano aparente';
    case 'yellow':
      return 'Reingreso con precaucion - Se recomienda inspeccion visual';
    case 'red':
      return 'REINGRESO NO AUTORIZADO - Requiere inspeccion estructural';
  }
}
