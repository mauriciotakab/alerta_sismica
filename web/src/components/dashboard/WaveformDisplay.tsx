import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';
import { Station } from '@/types/seismic';
import { generateMockWaveform } from '@/data/mockStations';

interface WaveformDisplayProps {
  stations: Station[];
}

function WaveformCanvas({ stationId, isActive }: { stationId: string; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dataRef = useRef<number[]>([]);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;
    
    // Initialize with mock waveform data
    const waveform = generateMockWaveform(stationId, 60);
    dataRef.current = waveform.samples;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      const data = dataRef.current;
      
      // Clear canvas
      ctx.fillStyle = 'hsl(222, 47%, 6%)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'hsl(217, 33%, 20%)';
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines
      for (let y = 0; y < height; y += height / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let x = 0; x < width; x += width / 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw waveform
      ctx.strokeStyle = 'hsl(199, 89%, 48%)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const visibleSamples = Math.min(width * 2, data.length);
      const startIdx = Math.floor(offsetRef.current) % data.length;
      
      for (let i = 0; i < visibleSamples; i++) {
        const dataIdx = (startIdx + i) % data.length;
        const x = (i / visibleSamples) * width;
        const y = height / 2 + (data[dataIdx] / 500) * (height / 2);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Advance offset for animation
      offsetRef.current += 2;
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stationId, isActive]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * 2; // 2x for retina
        canvas.height = height * 2;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(2, 2);
        }
      }
    });
    
    resizeObserver.observe(canvas.parentElement!);
    
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  );
}

export function WaveformDisplay({ stations }: WaveformDisplayProps) {
  const onlineStations = stations.filter(s => s.status !== 'offline');
  const [activeTab, setActiveTab] = useState(onlineStations[0]?.id || '');
  const [activeChannel, setActiveChannel] = useState('EHZ');
  const channels = ['EHZ', 'ENE', 'ENN', 'ENZ'];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Waveform Clipboard
          </CardTitle>
          <div className="flex gap-1">
            {channels.map(ch => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  activeChannel === ch
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0">
            {onlineStations.map(station => (
              <TabsTrigger 
                key={station.id} 
                value={station.id}
                className="text-xs"
              >
                {station.name.replace('Shake ', '')}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {onlineStations.map(station => (
            <TabsContent 
              key={station.id} 
              value={station.id} 
              className="flex-1 mt-2 min-h-0"
            >
              <div className="h-full min-h-[200px] bg-background rounded-lg overflow-hidden border border-border/50">
                <WaveformCanvas 
                  stationId={station.id} 
                  isActive={activeTab === station.id}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Canal: {activeChannel}</span>
                <span>100 Hz</span>
                <span className="text-primary font-mono">
                  ● EN VIVO
                </span>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
