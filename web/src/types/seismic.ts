// Types for Seismic Monitoring Dashboard

export interface Station {
  id: string;
  name: string;
  building: string;
  location: {
    lat: number;
    lon: number;
  };
  status: 'online' | 'offline' | 'warning';
  lastPing: Date;
  metrics: {
    seedlinkActive: boolean;
    diskUsagePercent: number;
    temperature: number;
    ntpSynced: boolean;
    wireguardConnected: boolean;
  };
  lastEvent?: {
    timestamp: Date;
    pga: number; // Peak Ground Acceleration in gal (cm/s²)
    pgv: number; // Peak Ground Velocity in cm/s
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
  channel: 'EHZ' | 'EHN' | 'EHE' | 'ENZ';
  samples: number[];
  startTime: Date;
  sampleRate: number;
}

// Thresholds for semaphore (based on PGA in gal)
export const PGA_THRESHOLDS = {
  green: 5,    // < 5 gal = safe for reentry
  yellow: 15,  // 5-15 gal = inspection recommended
  red: 15      // > 15 gal = no reentry until inspection
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
      return 'Reingreso autorizado - Estructura sin daño aparente';
    case 'yellow':
      return 'Reingreso con precaución - Se recomienda inspección visual';
    case 'red':
      return 'REINGRESO NO AUTORIZADO - Requiere inspección estructural';
  }
}
