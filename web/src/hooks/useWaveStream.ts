import { useEffect, useRef, useState } from 'react';

import { getWaveSnapshot } from '@/services/api';
import { buildWaveWsUrl } from '@/services/ws';
import type { WaveChunk } from '@/types/seismic';

type ConnectionState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'error';

interface UseWaveStreamOptions {
  snapshotSeconds?: number;
  snapshotHz?: number;
  wsWindow?: number;
  wsHz?: number;
  ringSeconds?: number;
}

function trimSamples(samples: number[], fs: number, ringSeconds: number): number[] {
  const maxSamples = Math.max(1, Math.floor(Math.max(fs, 1) * ringSeconds));
  if (samples.length <= maxSamples) return samples;
  return samples.slice(samples.length - maxSamples);
}

export function useWaveStream(stationId: string, channel: string, options: UseWaveStreamOptions = {}) {
  const snapshotSeconds = options.snapshotSeconds ?? 60;
  const snapshotHz = options.snapshotHz ?? 20;
  const wsWindow = options.wsWindow ?? 30;
  const wsHz = options.wsHz ?? 20;
  const ringSeconds = options.ringSeconds ?? 60;

  const [samples, setSamples] = useState<number[]>([]);
  const [fs, setFs] = useState<number>(snapshotHz);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastSeqRef = useRef(0);
  const receivedWsInitialRef = useRef(false);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    setSamples([]);
    setError(null);
    setConnectionState('connecting');
    reconnectAttemptRef.current = 0;
    lastSeqRef.current = 0;
    receivedWsInitialRef.current = false;

    if (!stationId || !channel) {
      setConnectionState('idle');
      return () => {
        disposedRef.current = true;
      };
    }

    const cleanupSocket = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    const appendChunk = (chunk: WaveChunk) => {
      lastSeqRef.current = Math.max(lastSeqRef.current, chunk.seq);
      setFs(chunk.fs || wsHz);
      setSamples((prev) => trimSamples([...prev, ...chunk.samples], chunk.fs || wsHz, ringSeconds));
    };

    const scheduleReconnect = () => {
      if (disposedRef.current) return;
      const attempt = reconnectAttemptRef.current;
      const delayMs = Math.min(10000, 500 * Math.pow(2, attempt));
      reconnectAttemptRef.current = attempt + 1;
      setConnectionState('reconnecting');
      reconnectTimerRef.current = window.setTimeout(() => {
        connectWs();
      }, delayMs);
    };

    const connectWs = () => {
      if (disposedRef.current) return;
      cleanupSocket();
      setConnectionState(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');
      receivedWsInitialRef.current = false;

      const wsUrl = buildWaveWsUrl(stationId, channel, wsWindow, wsHz);
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (disposedRef.current) return;
        reconnectAttemptRef.current = 0;
        setConnectionState('live');
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as WaveChunk | { error: string };
          if ('error' in payload) {
            setError(payload.error);
            return;
          }
          if (payload.type === 'wave_chunk') {
            if (!receivedWsInitialRef.current) {
              receivedWsInitialRef.current = true;

              // Si ya cargamos snapshot REST, NO lo pisamos con el snapshot inicial del WS.
              // Solo avanzamos el seq para que el streaming continúe limpio.
              if (lastSeqRef.current > 0) {
                lastSeqRef.current = Math.max(lastSeqRef.current, payload.seq);
                return;
              }

              // Si NO hay snapshot REST (por error o primera carga), usamos el WS como fallback.
              setFs(payload.fs || wsHz);
              setSamples(trimSamples(payload.samples, payload.fs || wsHz, ringSeconds));
              lastSeqRef.current = payload.seq;
              return;
            }

            if (payload.seq <= lastSeqRef.current) {
              return;
            }
            appendChunk(payload);
          }
        } catch {
          setError('Mensaje WS invalido');
        }
      };

      socket.onerror = () => {
        if (disposedRef.current) return;
        setConnectionState('error');
        setError('Error de conexion WS');
      };

      socket.onclose = () => {
        if (disposedRef.current) return;
        scheduleReconnect();
      };
    };

    const initialize = async () => {
      setIsLoadingSnapshot(true);
      try {
        const snapshot = await getWaveSnapshot(stationId, channel, snapshotSeconds, snapshotHz);
        setFs(snapshot.fs || snapshotHz);
        lastSeqRef.current = snapshot.seq;
        setSamples(trimSamples(snapshot.samples, snapshot.fs || snapshotHz, ringSeconds));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar snapshot');
      } finally {
        setIsLoadingSnapshot(false);
        connectWs();
      }
    };

    void initialize();

    return () => {
      disposedRef.current = true;
      cleanupSocket();
    };
  }, [channel, ringSeconds, snapshotHz, snapshotSeconds, stationId, wsHz, wsWindow]);

  return {
    samples,
    fs,
    connectionState,
    error,
    isLoadingSnapshot,
  };
}
