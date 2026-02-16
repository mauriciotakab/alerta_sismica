# Alertamiento S&iacute;smico TAKAB

Base de despliegue para Fase 1 con:
- `web/`: frontend Vite + React + TypeScript.
- `backend/`: FastAPI minimo con endpoint de salud.
- `docker-compose.yml`: Nginx al frente del frontend con proxy a backend.
- `events/`: carpeta reservada para artefactos de eventos.

## Levantar entorno

```bash
docker compose up --build
```

Aplicacion:
- http://localhost:8080

## Pruebas

1. Probar health via gateway Nginx:

```bash
curl http://localhost:8080/api/health
```

Respuesta esperada (ejemplo):

```json
{
  "status": "ok",
  "time_utc": "2026-02-13T16:00:00Z",
  "version": "0.1.0",
  "name": "Alertamiento S\\u00EDsmico TAKAB"
}
```

2. Abrir dashboard:
- http://localhost:8080

## Notas de alcance

- Esta base no implementa aun SeedLink, ring buffer ni streaming WS de datos.
- El proxy `/ws/` ya esta configurado en Nginx como placeholder para la siguiente fase.

## Backend smoke test

```bash
docker compose up --build
curl http://localhost:8080/api/health
curl http://localhost:8080/api/stations
curl http://localhost:8080/api/stations/AM.R0820.00/status
```

Opcional (WebSocket):

```bash
websocat "ws://localhost:8080/ws/wave/AM.R0820.00/ENZ?window=30&hz=20"
# o
wscat -c "ws://localhost:8080/ws/wave/AM.R0820.00/ENZ?window=30&hz=20"
```
