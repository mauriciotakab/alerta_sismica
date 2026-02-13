import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download } from 'lucide-react';
import { SeismicEvent } from '@/types/seismic';
import { cn } from '@/lib/utils';

interface EventsTableProps {
  events: SeismicEvent[];
}

export function EventsTable({ events }: EventsTableProps) {
  const formatDate = (date: Date) =>
    date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const getMagnitudeColor = (mag: number) => {
    if (mag >= 6) return 'text-[hsl(var(--semaphore-red))]';
    if (mag >= 4) return 'text-[hsl(var(--semaphore-yellow))]';
    return 'text-[hsl(var(--semaphore-green))]';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-primary" />
          Eventos Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Fecha/Hora</TableHead>
              <TableHead className="text-xs">Magnitud</TableHead>
              <TableHead className="text-xs">Prof.</TableHead>
              <TableHead className="text-xs">Localización</TableHead>
              <TableHead className="text-xs">Fuente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {formatDate(event.timestamp)}
                </TableCell>
                <TableCell>
                  <span className={cn('font-mono font-bold text-sm', getMagnitudeColor(event.magnitude))}>
                    {event.magnitude.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">{event.depth} km</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {event.location.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {event.source}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
