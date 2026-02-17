import { Station } from '@/types/seismic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wifi, WifiOff, Thermometer, HardDrive, Clock, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StationCardProps {
  station: Station;
}

function formatLastSeen(seconds: number | null | undefined): string {
  if (seconds == null) return 'Sin datos';
  if (seconds < 60) return 'Hace segundos';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  return `Hace ${Math.floor(seconds / 3600)} hrs`;
}

export function StationCard({ station }: StationCardProps) {
  const statusConfig = {
    online: {
      label: 'EN LINEA',
      className: 'bg-[hsl(var(--status-online))] text-black',
      icon: Wifi,
      pulse: 'animate-pulse-online',
    },
    warning: {
      label: 'ADVERTENCIA',
      className: 'bg-[hsl(var(--status-warning))] text-black',
      icon: Activity,
      pulse: '',
    },
    offline: {
      label: 'FUERA DE LINEA',
      className: 'bg-[hsl(var(--status-offline))] text-white',
      icon: WifiOff,
      pulse: '',
    },
  };

  const config = statusConfig[station.status];
  const StatusIcon = config.icon;
  const channelCount = station.channels?.length ?? 0;
  const latencyMs = station.statusData?.latency_ms;

  return (
    <Card
      className={cn('border-border/50 transition-all duration-300', station.status === 'offline' && 'opacity-60')}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                station.status === 'online' && 'bg-[hsl(var(--status-online))]',
                station.status === 'warning' && 'bg-[hsl(var(--status-warning))]',
                station.status === 'offline' && 'bg-[hsl(var(--status-offline))]',
                config.pulse
              )}
            />
            <CardTitle className="text-base font-semibold">{station.name}</CardTitle>
          </div>
          <Badge className={cn('text-xs font-bold', config.className)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{station.building}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Ultimo ping
          </span>
          <span className="font-mono">{formatLastSeen(station.statusData?.last_seen_seconds)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Activity
              className={cn(
                'w-3.5 h-3.5',
                station.metrics.seedlinkActive ? 'text-[hsl(var(--status-online))]' : 'text-[hsl(var(--status-offline))]'
              )}
            />
            <span>SeedLink</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Shield
              className={cn(
                'w-3.5 h-3.5',
                station.metrics.wireguardConnected
                  ? 'text-[hsl(var(--status-online))]'
                  : 'text-[hsl(var(--status-offline))]'
              )}
            />
            <span>WireGuard</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{station.metrics.temperature.toFixed(0)} C</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock
              className={cn(
                'w-3.5 h-3.5',
                station.metrics.ntpSynced ? 'text-[hsl(var(--status-online))]' : 'text-[hsl(var(--status-offline))]'
              )}
            />
            <span>NTP Sync</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-3.5 h-3.5" />
              Disco
            </span>
            <span className="font-mono">{station.metrics.diskUsagePercent}%</span>
          </div>
          <Progress value={station.metrics.diskUsagePercent} className="h-1.5" />
        </div>

        <div className="pt-2 border-t border-border/50 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Canales</span>
            <span className="font-mono">{channelCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Latencia</span>
            <span className="font-mono">
              {latencyMs == null ? 'N/A' : `${Math.round(latencyMs)} ms`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
