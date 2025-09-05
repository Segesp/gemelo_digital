"use client";
import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import { DashboardHeader, DashboardControls, ViewModeSelector, DashboardFooter } from '../components/Dashboard';

// Lazy load 3D components for better performance
const Scene3D = lazy(() => import('../components/Scene3D'));
const Analysis3D = lazy(() => import('../components/Analysis3D'));
const DeckGL3D = lazy(() => import('../components/DeckGL3D'));
const Temporal3D = lazy(() => import('../components/Temporal3D'));
const CityEngine3D = lazy(() => import('../components/CityEngine3D'));

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

type ViewMode = '2d' | '3d-scene' | '3d-analysis' | '3d-geospatial' | '3d-temporal' | 'city-engine';

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
        zoom: 12,
        attributionControl: false
      });
      
      // Add custom attribution
      m.addControl(new maplibregl.AttributionControl({
        compact: true
      }), 'bottom-right');
      
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
        map.addLayer({ 
          id: 'puerto-fill', 
          type: 'fill', 
          source: 'puerto', 
          paint: { 
            'fill-color': '#1d4ed8', 
            'fill-opacity': 0.3 
          } 
        });
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
  }, []);

  // Load NASA datasets
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
            <div style="padding: 12px; font-family: Inter, sans-serif;">
              <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">
                ${props.dataset} - ${props.parameter}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Valor:</strong> ${props.value}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Fecha:</strong> ${new Date(props.timestamp).toLocaleString()}
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                📍 Lat: ${e.lngLat.lat.toFixed(4)}, Lng: ${e.lngLat.lng.toFixed(4)}
              </div>
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

  const handleDataPointSelect = (point: any) => {
    setSelectedDataPoint(point);
  };

  const renderMainContent = () => {
    switch (viewMode) {
      case '2d':
        return (
          <div ref={containerRef} className="flex-1" style={{ position: 'relative' }}>
            {!ready && (
              <div className="loading-overlay">
                <div className="loading">Cargando mapa base...</div>
              </div>
            )}
          </div>
        );
      
      case '3d-scene':
        return (
          <div className="flex-1">
            <Suspense fallback={
              <div className="loading-overlay">
                <div className="loading">🏗️ Cargando vista 3D del puerto...</div>
              </div>
            }>
              <Scene3D 
                data={nasaData} 
                parameter={selectedParameter} 
                dataset={selectedDataset} 
              />
            </Suspense>
          </div>
        );
      
      case '3d-analysis':
        return (
          <div className="flex-1">
            <Suspense fallback={
              <div className="loading-overlay">
                <div className="loading">📊 Cargando herramientas de análisis...</div>
              </div>
            }>
              <Analysis3D 
                data={nasaData} 
                parameter={selectedParameter}
                onPointSelect={handleDataPointSelect}
              />
            </Suspense>
          </div>
        );
      
      case '3d-geospatial':
        return (
          <div className="flex-1">
            <Suspense fallback={
              <div className="loading-overlay">
                <div className="loading">🌍 Cargando visualización geoespacial...</div>
              </div>
            }>
              <DeckGL3D 
                data={nasaData} 
                parameter={selectedParameter}
                dataset={selectedDataset}
              />
            </Suspense>
          </div>
        );
      
      case '3d-temporal':
        return (
          <div className="flex-1">
            <Suspense fallback={
              <div className="loading-overlay">
                <div className="loading">⏰ Cargando análisis temporal...</div>
              </div>
            }>
              <Temporal3D 
                data={nasaData} 
                parameter={selectedParameter}
                dataset={selectedDataset}
              />
            </Suspense>
          </div>
        );
      
      case 'city-engine':
        return (
          <div className="flex-1">
            <Suspense fallback={
              <div className="loading-overlay">
                <div className="loading">🏗️ Cargando City Engine...</div>
              </div>
            }>
              <CityEngine3D 
                data={nasaData} 
                parameter={selectedParameter}
                dataset={selectedDataset}
              />
            </Suspense>
          </div>
        );
      
      default:
        return <div ref={containerRef} className="flex-1" />;
    }
  };

  const dashboardData = {
    temperature: temp,
    spatialStats,
    selectedDataPoint,
    nasaDatasets,
    selectedDataset,
    selectedParameter
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <DashboardHeader />

      {/* View Mode Selector */}
      <ViewModeSelector 
        viewMode={viewMode} 
        onViewModeChange={(mode) => setViewMode(mode as ViewMode)} 
      />

      {/* Controls Panel */}
      <DashboardControls
        data={dashboardData}
        onDatasetChange={setSelectedDataset}
        onParameterChange={setSelectedParameter}
        onNASALayerToggle={setShowNASALayer}
        showNASALayer={showNASALayer}
        viewMode={viewMode}
      />

      {/* Main Content Area */}
      {renderMainContent()}

      {/* Footer */}
      <DashboardFooter 
        viewMode={viewMode} 
        dataCount={nasaData.length} 
      />
    </div>
  );
}
