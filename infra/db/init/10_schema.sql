-- Esquema base para gemelo digital de Chancay
CREATE SCHEMA IF NOT EXISTS gd;

-- Entidades geográficas
CREATE TABLE IF NOT EXISTS gd.layers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  geom_type TEXT NOT NULL,
  srid INT DEFAULT 4326,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Features genéricos (GeoJSON properties + geometría)
CREATE TABLE IF NOT EXISTS gd.features (
  id BIGSERIAL PRIMARY KEY,
  layer_id INT REFERENCES gd.layers(id) ON DELETE CASCADE,
  properties JSONB DEFAULT '{}'::jsonb,
  geom geometry(GEOMETRY, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS features_gix ON gd.features USING GIST (geom);

-- Series temporales (sensores, IoT)
CREATE TABLE IF NOT EXISTS gd.timeseries (
  time TIMESTAMPTZ NOT NULL,
  sensor_id TEXT NOT NULL,
  value DOUBLE PRECISION,
  properties JSONB DEFAULT '{}'::jsonb
);
DO $$ BEGIN
  PERFORM extname FROM pg_extension WHERE extname='timescaledb';
  IF FOUND THEN
    PERFORM create_hypertable('gd.timeseries', 'time', if_not_exists => TRUE);
  ELSE
    RAISE NOTICE 'TimescaleDB no instalada; usando tabla normal para timeseries';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS ts_sensor_time_idx ON gd.timeseries(sensor_id, time DESC);

-- Eventos
CREATE TABLE IF NOT EXISTS gd.events (
  id BIGSERIAL PRIMARY KEY,
  time TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL
);
