import { BuildingStatus, SemaphoreColor } from '@/types/seismic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SemaphorePanelProps {
  buildings: BuildingStatus[];
}

function SemaphoreIndicator({ color, size = 'md' }: { color: SemaphoreColor; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  const colorClasses = {
    green: 'bg-[hsl(var(--semaphore-green))] shadow-[0_0_20px_hsl(var(--semaphore-green)/0.5)]',
    yellow: 'bg-[hsl(var(--semaphore-yellow))] shadow-[0_0_20px_hsl(var(--semaphore-yellow)/0.5)]',
    red: 'bg-[hsl(var(--semaphore-red))] shadow-[0_0_20px_hsl(var(--semaphore-red)/0.5)] animate-pulse-alert'
  };

  return (
    <div className={cn(
      "rounded-full",
      sizeClasses[size],
      colorClasses[color]
    )} />
  );
}

function BuildingStatusRow({ building }: { building: BuildingStatus }) {
  const IconComponent = {
    green: CheckCircle2,
    yellow: AlertTriangle,
    red: XCircle
  }[building.semaphore];

  const iconColor = {
    green: 'text-[hsl(var(--semaphore-green))]',
    yellow: 'text-[hsl(var(--semaphore-yellow))]',
    red: 'text-[hsl(var(--semaphore-red))]'
  }[building.semaphore];

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border transition-all",
      building.semaphore === 'green' && "border-[hsl(var(--semaphore-green)/0.3)] bg-[hsl(var(--semaphore-green)/0.05)]",
      building.semaphore === 'yellow' && "border-[hsl(var(--semaphore-yellow)/0.3)] bg-[hsl(var(--semaphore-yellow)/0.05)]",
      building.semaphore === 'red' && "border-[hsl(var(--semaphore-red)/0.3)] bg-[hsl(var(--semaphore-red)/0.05)]"
    )}>
      <SemaphoreIndicator color={building.semaphore} size="lg" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-semibold truncate">{building.name}</h4>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {building.recommendation}
        </p>
      </div>

      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <IconComponent className={cn("w-4 h-4", iconColor)} />
          <span className="font-mono font-bold text-lg">
            {building.lastPga.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">gal</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          PGA máximo
        </p>
      </div>
    </div>
  );
}

export function SemaphorePanel({ buildings }: SemaphorePanelProps) {
  // Sort by severity: red first, then yellow, then green
  const sortedBuildings = [...buildings].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.semaphore] - order[b.semaphore];
  });

  const counts = {
    green: buildings.filter(b => b.semaphore === 'green').length,
    yellow: buildings.filter(b => b.semaphore === 'yellow').length,
    red: buildings.filter(b => b.semaphore === 'red').length
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Semáforo de Reingreso
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <SemaphoreIndicator color="green" size="sm" />
              <span className="text-sm font-mono">{counts.green}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SemaphoreIndicator color="yellow" size="sm" />
              <span className="text-sm font-mono">{counts.yellow}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SemaphoreIndicator color="red" size="sm" />
              <span className="text-sm font-mono">{counts.red}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedBuildings.map(building => (
          <BuildingStatusRow key={building.id} building={building} />
        ))}

        {/* Leyenda de umbrales PGA */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Umbrales PGA (cm/s²)
          </h5>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-[hsl(var(--semaphore-green)/0.1)] border border-[hsl(var(--semaphore-green)/0.2)]">
              <SemaphoreIndicator color="green" size="sm" />
              <div>
                <p className="font-semibold">&lt; 5 gal</p>
                <p className="text-muted-foreground">Reingreso OK</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[hsl(var(--semaphore-yellow)/0.1)] border border-[hsl(var(--semaphore-yellow)/0.2)]">
              <SemaphoreIndicator color="yellow" size="sm" />
              <div>
                <p className="font-semibold">5–15 gal</p>
                <p className="text-muted-foreground">Inspección</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[hsl(var(--semaphore-red)/0.1)] border border-[hsl(var(--semaphore-red)/0.2)]">
              <SemaphoreIndicator color="red" size="sm" />
              <div>
                <p className="font-semibold">&gt; 15 gal</p>
                <p className="text-muted-foreground">No reingreso</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            PGA = Aceleración Máxima del Suelo • PGV = Velocidad Máxima del Suelo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
