import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';

import { useWaveStream } from '@/hooks/useWaveStream';
import { Station } from '@/types/seismic';

interface WaveformDisplayProps {
  stations: Station[];
}

interface WaveformCanvasProps {
  samples: number[];
}

function WaveformCanvas({ samples }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = Math.max(1, parent.clientWidth);
      const height = Math.max(1, parent.clientHeight);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = 'hsl(222, 47%, 6%)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'hsl(217, 33%, 20%)';
      ctx.lineWidth = 0.5;

      for (let y = 0; y <= 6; y += 1) {
        const yy = (y / 6) * height;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(width, yy);
        ctx.stroke();
      }

      for (let x = 0; x <= 10; x += 1) {
        const xx = (x / 10) * width;
        ctx.beginPath();
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, height);
        ctx.stroke();
      }

      if (!samples.length) return;

      const maxAbs = Math.max(1, ...samples.map((sample) => Math.abs(sample)));
      const visibleSamples = Math.min(samples.length, Math.max(width * 2, 200));
      const data = samples.slice(samples.length - visibleSamples);

      ctx.strokeStyle = 'hsl(199, 89%, 48%)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < data.length; i += 1) {
        const x = (i / (data.length - 1 || 1)) * width;
        const normalized = data[i] / maxAbs;
        const y = height / 2 - normalized * (height * 0.45);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
    const observer = new ResizeObserver(() => draw());
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [samples]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function getConnectionLabel(state: string, hasData: boolean): string {
  if (state === 'live') return 'EN VIVO';
  if (state === 'connecting') return 'Conectando...';
  if (state === 'reconnecting') return 'Reconectando...';
  if (!hasData) return 'Sin datos';
  return 'Sin enlace WS';
}

export function WaveformDisplay({ stations }: WaveformDisplayProps) {
  const [activeTab, setActiveTab] = useState('');
  const [activeChannel, setActiveChannel] = useState('ENZ');

  useEffect(() => {
    if (!stations.length) {
      setActiveTab('');
      return;
    }
    if (!activeTab || !stations.find((station) => station.id === activeTab)) {
      setActiveTab(stations[0].id);
    }
  }, [stations, activeTab]);

  const activeStation = useMemo(
    () => stations.find((station) => station.id === activeTab),
    [stations, activeTab]
  );

  const availableChannels = useMemo(() => {
    const fromStation = activeStation?.channels?.map((channel) => channel.toUpperCase());
    if (fromStation && fromStation.length) return fromStation;
    return ['EHZ', 'ENE', 'ENN', 'ENZ'];
  }, [activeStation]);

  useEffect(() => {
    if (!availableChannels.includes(activeChannel)) {
      setActiveChannel(availableChannels[0] ?? 'ENZ');
    }
  }, [activeChannel, availableChannels]);

  const { samples, fs, connectionState, error, isLoadingSnapshot } = useWaveStream(activeTab, activeChannel, {
    snapshotSeconds: 60,
    snapshotHz: 20,
    wsWindow: 30,
    wsHz: 20,
    ringSeconds: 60,
  });

  if (!stations.length) {
    return (
      <Card className="h-full min-h-0 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Waveform
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Sin estaciones disponibles.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-0 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Waveform
          </CardTitle>
          <div className="flex gap-1">
            {availableChannels.map((channel) => (
              <button
                key={channel}
                onClick={() => setActiveChannel(channel)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  activeChannel === channel
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0">
            {stations.map((station) => (
              <TabsTrigger key={station.id} value={station.id} className="text-xs">
                {station.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {stations.map((station) => (
            <TabsContent key={station.id} value={station.id} className="flex-1 mt-2 min-h-0 overflow-hidden">
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 bg-background rounded-lg overflow-hidden border border-border/50">
                  <WaveformCanvas samples={activeTab === station.id ? samples : []} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground flex-shrink-0">
                  <span>Canal: {activeChannel}</span>
                  <span>{fs.toFixed(1)} Hz</span>
                  <span className="text-primary font-mono">{getConnectionLabel(connectionState, samples.length > 0)}</span>
                </div>
                {isLoadingSnapshot && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex-shrink-0">Cargando snapshot...</p>
                )}
                {!isLoadingSnapshot && samples.length === 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex-shrink-0">Sin datos en el buffer.</p>
                )}
                {error && <p className="text-[11px] text-[hsl(var(--status-warning))] mt-1 flex-shrink-0">{error}</p>}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
