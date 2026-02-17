import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Radio, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusHeaderProps {
  totalStations: number;
  onlineStations: number;
  warningStations: number;
  offlineStations: number;
  lastAlarm?: Date;
}

export function StatusHeader({
  totalStations,
  onlineStations,
  warningStations,
  offlineStations,
  lastAlarm
}: StatusHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const allOnline = offlineStations === 0 && warningStations === 0;

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Alertamiento Sísmico TAKAB</h1>
              <p className="text-xs text-muted-foreground">
                Red de Estaciones TakabAilert
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          {/* Station counts */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-online))] animate-pulse-online" />
              <span className="font-mono text-sm">{onlineStations}</span>
              <span className="text-xs text-muted-foreground">en linea</span>
            </div>

            {warningStations > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-warning))]" />
                <span className="font-mono text-sm">{warningStations}</span>
                <span className="text-xs text-muted-foreground">advertencia</span>
              </div>
            )}

            {offlineStations > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-offline))]" />
                <span className="font-mono text-sm">{offlineStations}</span>
                <span className="text-xs text-muted-foreground">fuera de linea</span>
              </div>
            )}
          </div>

          {/* System Status */}
          <Badge
            variant={allOnline ? 'default' : 'destructive'}
            className={cn(
              'gap-1.5 px-3 py-1',
              allOnline
                ? 'bg-[hsl(var(--status-online))] text-black hover:bg-[hsl(var(--status-online))]'
                : 'bg-[hsl(var(--status-warning))] text-black hover:bg-[hsl(var(--status-warning))]'
            )}
          >
            {allOnline ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {allOnline ? 'Sistema Operativo' : 'Atencion Requerida'}
          </Badge>

          {/* Radio Status */}
          <div className="flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4 text-primary animate-pulse-online" />
            <span className="text-muted-foreground">Radio</span>
            <Badge variant="outline" className="text-xs">ESCUCHANDO</Badge>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2 text-sm border-l border-border pl-6">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-sm">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}