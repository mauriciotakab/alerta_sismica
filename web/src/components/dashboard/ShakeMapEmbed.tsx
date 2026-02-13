import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, ExternalLink, AlertCircle } from 'lucide-react';
import { SeismicEvent } from '@/types/seismic';

interface ShakeMapEmbedProps {
  lastEvent?: SeismicEvent;
}

export function ShakeMapEmbed({ lastEvent }: ShakeMapEmbedProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            ShakeMap
          </CardTitle>
          <a 
            href="http://www.ssn.unam.mx/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            SSN <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Map placeholder - In production this would be an actual ShakeMap embed or Leaflet map */}
        <div className="flex-1 min-h-[300px] rounded-lg border border-border/50 bg-muted/20 relative overflow-hidden">
          {/* Simulated map background */}
          <div className="absolute inset-0 opacity-30">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Mexico outline simplified */}
              <path
                d="M50,100 Q100,80 150,90 L200,70 Q250,60 300,80 L350,100 Q360,150 340,200 L300,220 Q250,240 200,230 L150,240 Q100,250 60,220 Q40,180 50,100 Z"
                fill="none"
                stroke="hsl(199, 89%, 48%)"
                strokeWidth="1"
              />
              {/* Grid lines */}
              {[...Array(10)].map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * 30}
                  x2="400"
                  y2={i * 30}
                  stroke="hsl(217, 33%, 20%)"
                  strokeWidth="0.5"
                />
              ))}
              {[...Array(13)].map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * 30}
                  y1="0"
                  x2={i * 30}
                  y2="300"
                  stroke="hsl(217, 33%, 20%)"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
          </div>
          
          {/* Event marker if exists */}
          {lastEvent && (
            <div 
              className="absolute animate-pulse-alert"
              style={{
                left: '60%',
                top: '70%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 w-8 h-8 bg-[hsl(var(--status-offline))] rounded-full opacity-30 animate-ping" />
                <div className="w-8 h-8 bg-[hsl(var(--status-offline))] rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Scale indicator */}
          <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-16 h-0.5 bg-muted-foreground" />
              <span>100 km</span>
            </div>
          </div>
        </div>

        {/* Last event info */}
        {lastEvent ? (
          <div className="rounded-lg border border-border/50 p-4 bg-muted/10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">Último Evento</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDate(lastEvent.timestamp)}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className="font-mono text-lg border-primary text-primary"
              >
                M {lastEvent.magnitude.toFixed(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Profundidad</span>
                <p className="font-mono">{lastEvent.depth} km</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fuente</span>
                <p className="font-mono">{lastEvent.source}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Localización</span>
                <p className="text-sm">{lastEvent.location.description}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 p-4 bg-muted/10 text-center text-muted-foreground">
            No hay eventos recientes
          </div>
        )}
      </CardContent>
    </Card>
  );
}
