-- Habilitar extensiones PostGIS, TimescaleDB y utilidades
CREATE EXTENSION IF NOT EXISTS postgis;
DO $$ BEGIN
	CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN undefined_file THEN
	RAISE NOTICE 'TimescaleDB no disponible, continuando sin ella';
END $$;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
