"use client";
import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import maplibregl, { Map } from 'maplibre-gl';

// Lazy load 3D components for better performance
const Scene3D = lazy(() => import('../components/Scene3D'));
const Analysis3D = lazy(() => import('../components/Analysis3D'));
const DeckGL3D = lazy(() => import('../components/DeckGL3D'));
const Temporal3D = lazy(() => import('../components/Temporal3D'));

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

type ViewMode = '2d' | '3d-scene' | '3d-analysis' | '3d-geospatial' | '3d-temporal';

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
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [selectedDataPoint, setSelectedDataPoint] = useState<NASADataPoint | null>(null);

  // Initialize 2D map only when in 2D mode
  useEffect(() => {
    if (viewMode === '2d' && containerRef.current && !mapRef.current) {
      const m = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-77.27, -11.57],
        zoom: 12
      });
      mapRef.current = m;
      m.on('load', () => setReady(true));
    } else if (viewMode !== '2d' && mapRef.current) {
      // Clean up 2D map when switching to 3D
      mapRef.current.remove();
      mapRef.current = null;
      setReady(false);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode]);

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

  // Load NASA datasets (works for all view modes)
  useEffect(() => {
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
  }, []);

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

  // Update NASA layer on 2D map only
  useEffect(() => {
    if (!ready || !mapRef.current || viewMode !== '2d' || !showNASALayer || nasaData.length === 0) return;
    
    const map = mapRef.current;
    
    // Remove existing NASA layer
    if (map.getSource('nasa-data')) {
      map.removeLayer('nasa-data-points');
      map.removeSource('nasa-data');
    }

    // Create GeoJSON from NASA data
    const geojson: GeoJSON.FeatureCollection = {
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

  }, [ready, showNASALayer, nasaData, selectedDataset, selectedParameter, viewMode]);

  const uniqueDatasets = Array.from(new Set(nasaDatasets.map(d => d.dataset)));
  const parametersForDataset = nasaDatasets.filter(d => d.dataset === selectedDataset);

  const handleDataPointSelect = (point: any) => {
    setSelectedDataPoint(point);
  };

  const renderViewModeContent = () => {
    switch (viewMode) {
      case '2d':
        return <div ref={containerRef} style={{flex:1}} />;
      
      case '3d-scene':
        return (
          <Suspense fallback={<div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1a', color:'white'}}>Cargando vista 3D...</div>}>
            <Scene3D 
              data={nasaData} 
              parameter={selectedParameter} 
              dataset={selectedDataset} 
            />
          </Suspense>
        );
      
      case '3d-analysis':
        return (
          <Suspense fallback={<div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1a', color:'white'}}>Cargando análisis 3D...</div>}>
            <Analysis3D 
              data={nasaData} 
              parameter={selectedParameter}
              onPointSelect={handleDataPointSelect}
            />
          </Suspense>
        );
      
      case '3d-geospatial':
        return (
          <Suspense fallback={<div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1a', color:'white'}}>Cargando vista geoespacial 3D...</div>}>
            <DeckGL3D 
              data={nasaData} 
              parameter={selectedParameter}
              dataset={selectedDataset}
            />
          </Suspense>
        );
      
      case '3d-temporal':
        return (
          <Suspense fallback={<div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1a', color:'white'}}>Cargando análisis temporal 3D...</div>}>
            <Temporal3D 
              data={nasaData} 
              parameter={selectedParameter}
              dataset={selectedDataset}
            />
          </Suspense>
        );
      
      default:
        return <div ref={containerRef} style={{flex:1}} />;
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      {/* Header with View Mode Selection */}
      <div style={{padding:'12px',borderBottom:'1px solid #eee',backgroundColor:'#f8fafc'}}>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <strong style={{fontSize:'18px',color:'#1e293b'}}>🛰️ Gemelo Digital Chancay</strong>
          <span style={{color:'#64748b'}}>Datos NASA + IoT + Análisis Espacial</span>
          
          {/* View Mode Selector */}
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <button 
              onClick={() => setViewMode('2d')}
              style={{
                padding:'6px 12px',
                border:'1px solid #d1d5db',
                borderRadius:'4px',
                background: viewMode === '2d' ? '#3b82f6' : '#ffffff',
                color: viewMode === '2d' ? 'white' : '#374151',
                fontSize:'12px',
                cursor:'pointer'
              }}
            >
              🗺️ Vista 2D
            </button>
            <button 
              onClick={() => setViewMode('3d-scene')}
              style={{
                padding:'6px 12px',
                border:'1px solid #d1d5db',
                borderRadius:'4px',
                background: viewMode === '3d-scene' ? '#3b82f6' : '#ffffff',
                color: viewMode === '3d-scene' ? 'white' : '#374151',
                fontSize:'12px',
                cursor:'pointer'
              }}
            >
              🏗️ Escena 3D
            </button>
            <button 
              onClick={() => setViewMode('3d-analysis')}
              style={{
                padding:'6px 12px',
                border:'1px solid #d1d5db',
                borderRadius:'4px',
                background: viewMode === '3d-analysis' ? '#3b82f6' : '#ffffff',
                color: viewMode === '3d-analysis' ? 'white' : '#374151',
                fontSize:'12px',
                cursor:'pointer'
              }}
            >
              📊 Análisis 3D
            </button>
            <button 
              onClick={() => setViewMode('3d-geospatial')}
              style={{
                padding:'6px 12px',
                border:'1px solid #d1d5db',
                borderRadius:'4px',
                background: viewMode === '3d-geospatial' ? '#3b82f6' : '#ffffff',
                color: viewMode === '3d-geospatial' ? 'white' : '#374151',
                fontSize:'12px',
                cursor:'pointer'
              }}
            >
              🌍 Geoespacial 3D
            </button>
            <button 
              onClick={() => setViewMode('3d-temporal')}
              style={{
                padding:'6px 12px',
                border:'1px solid #d1d5db',
                borderRadius:'4px',
                background: viewMode === '3d-temporal' ? '#3b82f6' : '#ffffff',
                color: viewMode === '3d-temporal' ? 'white' : '#374151',
                fontSize:'12px',
                cursor:'pointer'
              }}
            >
              ⏰ Temporal 3D
            </button>
          </div>
          
          <span style={{color:'#059669',fontWeight:'500'}}>
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

          {viewMode === '2d' && (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input 
                type="checkbox"
                checked={showNASALayer}
                onChange={(e) => setShowNASALayer(e.target.checked)}
                id="nasa-layer"
              />
              <label htmlFor="nasa-layer" style={{fontWeight:'500',color:'#374151'}}>
                Mostrar datos NASA en mapa 2D
              </label>
            </div>
          )}

          {selectedDataPoint && (
            <div style={{marginLeft:'auto',padding:'8px 12px',backgroundColor:'#f0f9ff',borderRadius:'4px',border:'1px solid #bae6fd'}}>
              <strong style={{color:'#0284c7'}}>Punto seleccionado:</strong>
              <span style={{marginLeft:8,color:'#0369a1'}}>
                Valor: {selectedDataPoint.value?.toFixed(2)} | 
                Tiempo: {new Date(selectedDataPoint.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {spatialStats && !selectedDataPoint && (
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

      {/* Main Content Area */}
      {renderViewModeContent()}

      {/* Footer Info */}
      <div style={{padding:'8px 12px',borderTop:'1px solid #eee',backgroundColor:'#f8fafc',fontSize:'12px',color:'#64748b'}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span>📡 Datos en tiempo real de NASA POWER API, MODIS, VIIRS y sensores locales</span>
          <span>🔄 Actualización automática cada hora | Vista: {
            viewMode === '2d' ? '2D MapLibre' :
            viewMode === '3d-scene' ? '3D Three.js' :
            viewMode === '3d-analysis' ? '3D Análisis Interactivo' :
            viewMode === '3d-geospatial' ? '3D Geoespacial deck.gl' :
            '3D Temporal'
          }</span>
        </div>
      </div>
    </div>
  );
}
