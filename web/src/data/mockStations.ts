import { Station, BuildingStatus, SeismicEvent, WaveformData, calculateSemaphore, getSemaphoreRecommendation } from '@/types/seismic';

// Mock stations simulating Raspberry Shake 4D installations
export const mockStations: Station[] = [
  {
    id: 'RS-001',
    name: 'Shake Torre Norte',
    building: 'Torre Norte',
    location: { lat: 19.4326, lon: -99.1332 },
    status: 'online',
    lastPing: new Date(),
    metrics: {
      seedlinkActive: true,
      diskUsagePercent: 42,
      temperature: 38,
      ntpSynced: true,
      wireguardConnected: true
    },
    lastEvent: {
      timestamp: new Date(Date.now() - 3600000),
      pga: 2.3,
      pgv: 0.8
    }
  },
  {
    id: 'RS-002',
    name: 'Shake Torre Sur',
    building: 'Torre Sur',
    location: { lat: 19.4316, lon: -99.1342 },
    status: 'online',
    lastPing: new Date(),
    metrics: {
      seedlinkActive: true,
      diskUsagePercent: 67,
      temperature: 41,
      ntpSynced: true,
      wireguardConnected: true
    },
    lastEvent: {
      timestamp: new Date(Date.now() - 3600000),
      pga: 2.1,
      pgv: 0.7
    }
  },
  {
    id: 'RS-003',
    name: 'Shake Edificio Central',
    building: 'Edificio Central',
    location: { lat: 19.4336, lon: -99.1322 },
    status: 'warning',
    lastPing: new Date(Date.now() - 120000),
    metrics: {
      seedlinkActive: true,
      diskUsagePercent: 89,
      temperature: 52,
      ntpSynced: true,
      wireguardConnected: true
    },
    lastEvent: {
      timestamp: new Date(Date.now() - 3600000),
      pga: 2.5,
      pgv: 0.9
    }
  },
  {
    id: 'RS-004',
    name: 'Shake Planta Baja',
    building: 'Planta Industrial',
    location: { lat: 19.4306, lon: -99.1352 },
    status: 'offline',
    lastPing: new Date(Date.now() - 600000),
    metrics: {
      seedlinkActive: false,
      diskUsagePercent: 45,
      temperature: 0,
      ntpSynced: false,
      wireguardConnected: false
    }
  },
  {
    id: 'RS-005',
    name: 'Shake Almacén',
    building: 'Almacén Principal',
    location: { lat: 19.4346, lon: -99.1312 },
    status: 'online',
    lastPing: new Date(),
    metrics: {
      seedlinkActive: true,
      diskUsagePercent: 33,
      temperature: 36,
      ntpSynced: true,
      wireguardConnected: true
    },
    lastEvent: {
      timestamp: new Date(Date.now() - 3600000),
      pga: 1.8,
      pgv: 0.6
    }
  }
];

// Generate building status from stations
export const mockBuildingStatus: BuildingStatus[] = mockStations
  .filter(s => s.lastEvent)
  .map(station => {
    const pga = station.lastEvent!.pga;
    const semaphore = calculateSemaphore(pga);
    return {
      id: `BLD-${station.id}`,
      name: station.building,
      stationId: station.id,
      semaphore,
      lastPga: pga,
      lastEvaluation: station.lastEvent!.timestamp,
      recommendation: getSemaphoreRecommendation(semaphore)
    };
  });

// Mock recent seismic events
export const mockRecentEvents: SeismicEvent[] = [
  {
    id: 'SSN-2024-001',
    timestamp: new Date(Date.now() - 3600000),
    magnitude: 4.2,
    depth: 15,
    location: { lat: 17.0732, lon: -100.3181, description: '45 km al SUROESTE de ACAPULCO, GRO' },
    source: 'SSN',
    reported: true
  },
  {
    id: 'SSN-2024-002',
    timestamp: new Date(Date.now() - 86400000),
    magnitude: 3.8,
    depth: 22,
    location: { lat: 16.87, lon: -99.88, description: '30 km al SUR de OMETEPEC, GRO' },
    source: 'SSN',
    reported: true
  },
  {
    id: 'SSN-2024-003',
    timestamp: new Date(Date.now() - 172800000),
    magnitude: 5.1,
    depth: 10,
    location: { lat: 15.92, lon: -93.45, description: '85 km al SUROESTE de TONALÁ, CHIS' },
    source: 'SSN',
    reported: true
  },
  {
    id: 'LOCAL-2024-001',
    timestamp: new Date(Date.now() - 259200000),
    magnitude: 2.5,
    depth: 5,
    location: { lat: 19.43, lon: -99.13, description: 'Zona Metropolitana CDMX (local)' },
    source: 'LOCAL',
    reported: false
  }
];

export const mockLastEvent: SeismicEvent = mockRecentEvents[0];

// Generate mock waveform data
export function generateMockWaveform(stationId: string, seconds: number = 30): WaveformData {
  const sampleRate = 100; // 100 Hz
  const samples: number[] = [];
  const totalSamples = seconds * sampleRate;
  
  for (let i = 0; i < totalSamples; i++) {
    // Simulate seismic noise with occasional spikes
    const noise = (Math.random() - 0.5) * 100;
    const wave = Math.sin(i * 0.05) * 50;
    const spike = Math.random() > 0.995 ? (Math.random() - 0.5) * 500 : 0;
    samples.push(noise + wave + spike);
  }
  
  return {
    stationId,
    channel: 'EHZ',
    samples,
    startTime: new Date(Date.now() - seconds * 1000),
    sampleRate
  };
}

// Stats summary
export function getStationStats() {
  const total = mockStations.length;
  const online = mockStations.filter(s => s.status === 'online').length;
  const warning = mockStations.filter(s => s.status === 'warning').length;
  const offline = mockStations.filter(s => s.status === 'offline').length;
  
  return { total, online, warning, offline };
}
