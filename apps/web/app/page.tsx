"use client";
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

interface NASADataset {
  dataset: string;
  parameter: string;
  count: number;
  earliest: string;
  latest: string;
}

interface NASADataPoint {
  timestamp: string;
  value: number;
  latitude: number;
  longitude: number;
  metadata: any;
  geometry: any;
}

interface SpatialStats {
  count: number;
  avg_value: number;
  min_value: number;
  max_value: number;
  std_value: number;
}

export default function Home() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);
  const [nasaDatasets, setNasaDatasets] = useState<NASADataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedParameter, setSelectedParameter] = useState<string>('');
  const [nasaData, setNasaData] = useState<NASADataPoint[]>([]);
  const [spatialStats, setSpatialStats] = useState<SpatialStats | null>(null);
  const [showNASALayer, setShowNASALayer] = useState(false);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const m = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-77.27, -11.57],
        zoom: 12
      });
      mapRef.current = m;
      m.on('load', () => setReady(true));
    }
    return () => mapRef.current?.remove();
  }, []);

  // Load puerto layer
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    fetch(`${API}/features/puerto`)
      .then(r => r.json())
      .then(fc => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        if (map.getSource('puerto')) {
          map.removeLayer('puerto-fill');
          map.removeSource('puerto');
        }
        map.addSource('puerto', { type: 'geojson', data: fc });
        map.addLayer({ id: 'puerto-fill', type: 'fill', source: 'puerto', paint: { 'fill-color': '#1d4ed8', 'fill-opacity': 0.3 } });
      })
      .catch(console.error);
  }, [ready]);

  // Load temperature data
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${API}/analysis/timeseries/harbor_temp/stats?start=` + new Date(Date.now() - 3600*1000).toISOString())
        .then(r => r.json())
        .then(s => setTemp(typeof s.avg === 'number' ? Math.round(s.avg*100)/100 : null))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [ready]);

  // Load NASA datasets
  useEffect(() => {
    if (!ready) return;
    fetch(`${API}/nasa/datasets`)
      .then(r => r.json())
      .then(datasets => {
        setNasaDatasets(datasets);
        if (datasets.length > 0) {
          setSelectedDataset(datasets[0].dataset);
          setSelectedParameter(datasets[0].parameter);
        }
      })
      .catch(console.error);
  }, [ready]);

  // Load NASA data when dataset/parameter changes
  useEffect(() => {
    if (!selectedDataset || !selectedParameter) return;
    
    // Load data points
    fetch(`${API}/nasa/data/${selectedDataset}/${selectedParameter}?limit=100&hours_back=24`)
      .then(r => r.json())
      .then(response => setNasaData(response.data || []))
      .catch(console.error);

    // Load spatial statistics
    fetch(`${API}/nasa/analysis/spatial-average/${selectedDataset}/${selectedParameter}?hours_back=24`)
      .then(r => r.json())
      .then(response => setSpatialStats(response.spatial_stats))
      .catch(console.error);
  }, [selectedDataset, selectedParameter]);

  // Update NASA layer on map
  useEffect(() => {
    if (!ready || !mapRef.current || !showNASALayer || nasaData.length === 0) return;
    
    const map = mapRef.current;
    
    // Remove existing NASA layer
    if (map.getSource('nasa-data')) {
      map.removeLayer('nasa-data-points');
      map.removeSource('nasa-data');
    }

    // Create GeoJSON from NASA data
    const geojson = {
      type: 'FeatureCollection',
      features: nasaData.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude]
        },
        properties: {
          value: point.value,
          timestamp: point.timestamp,
          dataset: selectedDataset,
          parameter: selectedParameter
        }
      }))
    };

    // Add NASA data source and layer
    map.addSource('nasa-data', { type: 'geojson', data: geojson });
    
    map.addLayer({
      id: 'nasa-data-points',
      type: 'circle',
      source: 'nasa-data',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, 4,
          50, 12
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, '#3b82f6',
          25, '#eab308',
          40, '#ef4444'
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handler for NASA points
    map.on('click', 'nasa-data-points', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const props = feature.properties;
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 8px;">
              <strong>${props.dataset} - ${props.parameter}</strong><br/>
              Valor: ${props.value}<br/>
              Fecha: ${new Date(props.timestamp).toLocaleString()}
            </div>
          `)
          .addTo(map);
      }
    });

    map.on('mouseenter', 'nasa-data-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'nasa-data-points', () => {
      map.getCanvas().style.cursor = '';
    });

  }, [ready, showNASALayer, nasaData, selectedDataset, selectedParameter]);

  const uniqueDatasets = Array.from(new Set(nasaDatasets.map(d => d.dataset)));
  const parametersForDataset = nasaDatasets.filter(d => d.dataset === selectedDataset);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      {/* Header */}
      <div style={{padding:'12px',borderBottom:'1px solid #eee',backgroundColor:'#f8fafc'}}>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <strong style={{fontSize:'18px',color:'#1e293b'}}>🛰️ Gemelo Digital Chancay</strong>
          <span style={{color:'#64748b'}}>Datos NASA + IoT + Análisis Espacial</span>
          <span style={{marginLeft:'auto',color:'#059669',fontWeight:'500'}}>
            Temp puerto: {temp ?? '...' } °C
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <div style={{padding:'12px',borderBottom:'1px solid #eee',backgroundColor:'#ffffff'}}>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <label style={{fontWeight:'500',color:'#374151'}}>Dataset NASA:</label>
            <select 
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              style={{padding:'4px 8px',border:'1px solid #d1d5db',borderRadius:'4px'}}
            >
              {uniqueDatasets.map(dataset => (
                <option key={dataset} value={dataset}>{dataset}</option>
              ))}
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <label style={{fontWeight:'500',color:'#374151'}}>Parámetro:</label>
            <select 
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              style={{padding:'4px 8px',border:'1px solid #d1d5db',borderRadius:'4px'}}
            >
              {parametersForDataset.map(item => (
                <option key={item.parameter} value={item.parameter}>
                  {item.parameter} ({item.count} puntos)
                </option>
              ))}
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <input 
              type="checkbox"
              checked={showNASALayer}
              onChange={(e) => setShowNASALayer(e.target.checked)}
              id="nasa-layer"
            />
            <label htmlFor="nasa-layer" style={{fontWeight:'500',color:'#374151'}}>
              Mostrar datos NASA en mapa
            </label>
          </div>

          {spatialStats && (
            <div style={{marginLeft:'auto',padding:'8px 12px',backgroundColor:'#f0f9ff',borderRadius:'4px',border:'1px solid #bae6fd'}}>
              <strong style={{color:'#0284c7'}}>Análisis Espacial (24h):</strong>
              <span style={{marginLeft:8,color:'#0369a1'}}>
                Promedio: {spatialStats.avg_value?.toFixed(2)} | 
                Min: {spatialStats.min_value?.toFixed(2)} | 
                Max: {spatialStats.max_value?.toFixed(2)} |
                Puntos: {spatialStats.count}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{flex:1}} />

      {/* Footer Info */}
      <div style={{padding:'8px 12px',borderTop:'1px solid #eee',backgroundColor:'#f8fafc',fontSize:'12px',color:'#64748b'}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span>📡 Datos en tiempo real de NASA POWER API, MODIS, VIIRS y sensores locales</span>
          <span>🔄 Actualización automática cada hora</span>
        </div>
      </div>
    </div>
  );
}
