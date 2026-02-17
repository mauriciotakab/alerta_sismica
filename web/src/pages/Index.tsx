import { StatusHeader } from '@/components/dashboard/StatusHeader';
import { StationCard } from '@/components/dashboard/StationCard';
import { SemaphorePanel } from '@/components/dashboard/SemaphorePanel';
import { WaveformDisplay } from '@/components/dashboard/WaveformDisplay';
import { ShakeMapEmbed } from '@/components/dashboard/ShakeMapEmbed';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { useStations } from '@/hooks/useStations';
import {
  mockBuildingStatus,
  mockLastEvent,
  mockRecentEvents,
} from '@/data/mockStations';

const Index = () => {
  const { stations, stats: stationStats, isLoading, error } = useStations();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <StatusHeader
        totalStations={stationStats.total}
        onlineStations={stationStats.online}
        warningStations={stationStats.warning}
        offlineStations={stationStats.offline}
      />

      {/* Main Dashboard Grid */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 auto-rows-min">
        {/* Left Column - Stations Grid */}
        <section className="col-span-12 xl:col-span-3">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Estaciones TakabAilert
          </h2>
          {isLoading && (
            <p className="text-xs text-muted-foreground mb-2">Cargando estaciones...</p>
          )}
          {error && (
            <p className="text-xs text-[hsl(var(--status-offline))] mb-2">{error}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {stations.map(station => (
              <StationCard key={station.id} station={station} />
            ))}
            {!isLoading && stations.length === 0 && (
              <div className="rounded border border-border/50 p-3 text-xs text-muted-foreground">
                No hay estaciones configuradas.
              </div>
            )}
          </div>
        </section>

        {/* Center Column - Waveforms & ShakeMap & Events */}
        <section className="col-span-12 xl:col-span-5 flex flex-col gap-4">
          {/* Waveform Display */}
          <div className="min-h-[350px]">
            <WaveformDisplay stations={stations} />
          </div>

          {/* Events Table */}
          <EventsTable events={mockRecentEvents} />

          {/* ShakeMap */}
          <div className="min-h-[400px]">
            <ShakeMapEmbed lastEvent={mockLastEvent} />
          </div>
        </section>

        {/* Right Column - Semaphore Panel */}
        <section className="col-span-12 xl:col-span-4">
          <SemaphorePanel buildings={mockBuildingStatus} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 text-xs text-muted-foreground flex items-center justify-between">
        <span>Alertamiento Sísmico TAKAB 24/7 - Red distribuida Segura</span>
        <span>Sistema desarollado por TAKAB TECHNOLOGY</span>
      </footer>
    </div>
  );
};

export default Index;
