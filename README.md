# Gemelo Digital de Chancay

Este monorepo contiene una plataforma de gemelo digital para Chancay, con visualización web, API, base de datos PostGIS/TimescaleDB, MQTT para IoT y servicios geoespaciales de teselas y features.

Componentes:
- DB: Postgres + PostGIS + TimescaleDB
- API: FastAPI (features, capas y series temporales)
- Ingest: Servicio de ingesta (MQTT -> BD) + generador de datos demo
- Web: Next.js + MapLibre GL
- pg_tileserv y pg_featureserv para servir MVT y GeoJSON API sobre PostGIS
- MQTT: Mosquitto

## Puesta en marcha

Requisitos: Docker y Docker Compose.

1. Construir y levantar

```bash
docker compose up -d --build
```

2. Comprobar salud de servicios

- API: http://localhost:8000/health
- Web: http://localhost:3000
- pg_featureserv: http://localhost:9000
- pg_tileserv: http://localhost:7800
- Adminer: http://localhost:8080 (servidor: db, usuario: postgres, pass: postgres, base: gemelo)

3. Semillas y demo

La BD se inicializa con extensiones y una capa de ejemplo "puerto" en `gd.features`. El servicio `ingest` publica datos sintéticos a MQTT y los persiste en `gd.timeseries`.

## Desarrollo local (opcional)

También puedes ejecutar apps por separado fuera de Docker.

### Web

```bash
cd apps/web
npm i
npm run dev
```

### API

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Configura `DATABASE_URL` y `NEXT_PUBLIC_API_BASE` según sea necesario.
# gemelo_digital