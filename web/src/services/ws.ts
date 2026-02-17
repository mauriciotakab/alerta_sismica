export function buildWaveWsUrl(stationId: string, channel: string, timeWindow: number, hz: number): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = new URL(
    `${protocol}//${window.location.host}/ws/wave/${encodeURIComponent(stationId)}/${encodeURIComponent(
      channel.toUpperCase()
    )}`
  );
  url.searchParams.set('window', String(timeWindow));
  url.searchParams.set('hz', String(hz));
  return url.toString();
}
