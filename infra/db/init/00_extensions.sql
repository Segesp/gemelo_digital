-- Habilitar extensiones PostGIS, TimescaleDB y utilidades
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- Intento de crear TimescaleDB - no es crítico si falla
DO $$ BEGIN
	BEGIN
		CREATE EXTENSION IF NOT EXISTS timescaledb;
		RAISE NOTICE 'TimescaleDB instalada exitosamente';
	EXCEPTION WHEN OTHERS THEN
		RAISE NOTICE 'TimescaleDB no disponible, continuando sin ella: %', SQLERRM;
	END;
END $$;
