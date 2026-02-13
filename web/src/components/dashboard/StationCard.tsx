import { Station } from '@/types/seismic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Thermometer, 
  HardDrive, 
  Clock, 
  Shield,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const statusConfig = {
    online: {
      label: 'EN LÍNEA',
      className: 'bg-[hsl(var(--status-online))] text-black',
      icon: Wifi,
      pulse: 'animate-pulse-online'
    },
    warning: {
      label: 'ADVERTENCIA',
      className: 'bg-[hsl(var(--status-warning))] text-black',
      icon: Activity,
      pulse: ''
    },
    offline: {
      label: 'FUERA DE LÍNEA',
      className: 'bg-[hsl(var(--status-offline))] text-white',
      icon: WifiOff,
      pulse: ''
    }
  };

  const config = statusConfig[station.status];
  const StatusIcon = config.icon;

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Hace segundos';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    return `Hace ${Math.floor(diff / 3600000)} hrs`;
  };

  return (
    <Card className={cn(
      "border-border/50 transition-all duration-300",
      station.status === 'offline' && "opacity-60"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              station.status === 'online' && "bg-[hsl(var(--status-online))]",
              station.status === 'warning' && "bg-[hsl(var(--status-warning))]",
              station.status === 'offline' && "bg-[hsl(var(--status-offline))]",
              config.pulse
            )} />
            <CardTitle className="text-base font-semibold">{station.name}</CardTitle>
          </div>
          <Badge className={cn("text-xs font-bold", config.className)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{station.building}</p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Last ping */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Último ping
          </span>
          <span className="font-mono">{formatTime(station.lastPing)}</span>
        </div>

        {/* Metrics Grid */}
        {station.status !== 'offline' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* SeedLink */}
            <div className="flex items-center gap-1.5">
              <Activity className={cn(
                "w-3.5 h-3.5",
                station.metrics.seedlinkActive 
                  ? "text-[hsl(var(--status-online))]" 
                  : "text-[hsl(var(--status-offline))]"
              )} />
              <span>SeedLink</span>
            </div>

            {/* WireGuard */}
            <div className="flex items-center gap-1.5">
              <Shield className={cn(
                "w-3.5 h-3.5",
                station.metrics.wireguardConnected 
                  ? "text-[hsl(var(--status-online))]" 
                  : "text-[hsl(var(--status-offline))]"
              )} />
              <span>WireGuard</span>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-1.5">
              <Thermometer className={cn(
                "w-3.5 h-3.5",
                station.metrics.temperature > 50 
                  ? "text-[hsl(var(--status-warning))]" 
                  : "text-muted-foreground"
              )} />
              <span>{station.metrics.temperature}°C</span>
            </div>

            {/* NTP */}
            <div className="flex items-center gap-1.5">
              <Clock className={cn(
                "w-3.5 h-3.5",
                station.metrics.ntpSynced 
                  ? "text-[hsl(var(--status-online))]" 
                  : "text-[hsl(var(--status-offline))]"
              )} />
              <span>NTP Sync</span>
            </div>
          </div>
        )}

        {/* Disk Usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-3.5 h-3.5" />
              Disco
            </span>
            <span className={cn(
              "font-mono",
              station.metrics.diskUsagePercent > 80 && "text-[hsl(var(--status-warning))]",
              station.metrics.diskUsagePercent > 90 && "text-[hsl(var(--status-offline))]"
            )}>
              {station.metrics.diskUsagePercent}%
            </span>
          </div>
          <Progress 
            value={station.metrics.diskUsagePercent} 
            className="h-1.5"
          />
        </div>

        {/* Last Event PGA */}
        {station.lastEvent && (
          <div className="pt-2 border-t border-border/50 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PGA</span>
              <span className="font-mono font-semibold text-primary">
                {station.lastEvent.pga.toFixed(2)} gal
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PGV</span>
              <span className="font-mono font-semibold text-muted-foreground">
                {station.lastEvent.pgv.toFixed(2)} cm/s
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
