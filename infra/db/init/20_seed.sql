-- Crear capas iniciales
INSERT INTO gd.layers(name, description, geom_type) VALUES
  ('barrios', 'Barrios de Chancay (ejemplo)', 'MULTIPOLYGON'),
  ('puerto', 'Infraestructura portuaria', 'POLYGON')
ON CONFLICT DO NOTHING;

-- Insertar un polígono de ejemplo (caja) cerca de Chancay
WITH l AS (
  SELECT id FROM gd.layers WHERE name='puerto' LIMIT 1
)
INSERT INTO gd.features(layer_id, properties, geom)
SELECT l.id, '{"name":"Puerto Chancay (ejemplo)"}'::jsonb,
       ST_SetSRID(ST_GeomFromText('POLYGON((-77.28 -11.58,-77.26 -11.58,-77.26 -11.56,-77.28 -11.56,-77.28 -11.58))'),4326)
FROM l;
