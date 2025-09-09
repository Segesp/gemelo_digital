"use client";
import { useEffect, useRef, useState, Suspense, lazy, useCallback } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import { DashboardHeader, DashboardControls, ViewModeSelector, DashboardFooter } from '../components/Dashboard';
import { ModernToolbar } from '../components/ModernUI';
import { ArcGISProInterface, LayerPanel } from '../components/ArcGISProInterface';
import { ContentPane } from '../components/ContentPane';
import { StatusBar } from '../components/StatusBar';
import { GISToolsManager } from '../components/gis/GISToolsManager';
import LimaUrbanObservatory from '../components/observatory/LimaUrbanObservatory';
import EnergyServicesMonitoring from '../components/monitoring/EnergyServicesMonitoring';
import GreenCorridorsPlanning from '../components/planning/GreenCorridorsPlanning';
import IntelligentTransportSystem from '../components/transport/IntelligentTransportSystem';
import EarlyWarningSystem from '../components/warnings/EarlyWarningSystem';
import CityReportsGenerator from '../components/reports/CityReportsGenerator';
import { useCityEngineStore, useBuildings } from '../utils/cityEngineStore';

// Lazy load 3D components for better performance
const Unified3D = lazy(() => import('../components/Unified3D'));

const API = process.env.NEXT_PUBLIC_API_BASE || '/api';

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

type ViewMode = '2d' | '3d';

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
  
  // ArcGIS Pro-like interface state
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showContentPane, setShowContentPane] = useState(true);
  const [activeContentPane, setActiveContentPane] = useState('contents');
  const [currentCoordinates, setCurrentCoordinates] = useState({ lat: -11.084, lng: -77.608 });
  const [mapScale, setMapScale] = useState(10000);
  
  // Lima 2025 NASA Tools state
  const [showUrbanObservatory, setShowUrbanObservatory] = useState(false);
  const [showEnergyMonitoring, setShowEnergyMonitoring] = useState(false);
  const [showGreenCorridors, setShowGreenCorridors] = useState(false);
  const [showTransportSystem, setShowTransportSystem] = useState(false);
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);
  const [showCityReports, setShowCityReports] = useState(false);
  
  // City Engine store hooks
  const addBuilding = useCityEngineStore(s => s.addBuilding);
  const addRoad = useCityEngineStore(s => s.addRoad);
  const selectedTool = useCityEngineStore(s => s.selectedTool);
  const ceBuildings = useBuildings();
  const [roadDraft, setRoadDraft] = useState<Array<[number, number]>>([]);

  // Helpers para convertir coordenadas
  const centerLat = -11.57;
  const centerLng = -77.27;
  
  const to3D = useCallback((lat: number, lng: number): [number, number, number] => {
    const x = (lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180) / 500;
    const z = (lat - centerLat) * 110540 / 500;
    return [x, 0, z];
  }, [centerLat, centerLng]);
  
  const toLL = useCallback((x: number, z: number): [number, number] => {
    const lng = x * 500 / (111320 * Math.cos(centerLat * Math.PI / 180)) + centerLng;
    const lat = z * 500 / 110540 + centerLat;
    return [lat, lng];
  }, [centerLat, centerLng]);

  // Tool selection handler
  const handleToolSelect = (toolId: string) => {
    // Handle special tools
    switch (toolId) {
      case 'layers':
        setShowLayerPanel(!showLayerPanel);
        break;
      case 'add-building':
        useCityEngineStore.getState().setSelectedTool('build');
        break;
      case 'add-road':
        useCityEngineStore.getState().setSelectedTool('road');
        break;
      case 'select':
        useCityEngineStore.getState().setSelectedTool('select');
        break;
      case 'measure-distance':
      case 'measure-area':
      case 'measure-point':
        useCityEngineStore.getState().setSelectedTool(toolId);
        break;
      case 'buffer':
      case 'intersect':
      case 'union':
      case 'spatial-join':
      case 'clip':
        useCityEngineStore.getState().setSelectedTool(toolId);
        break;
      case 'add-vegetation':
        useCityEngineStore.getState().setSelectedTool('vegetation');
        break;
      case 'coordinates':
      case 'attributes':
      case 'import-data':
      case 'export-data':
        useCityEngineStore.getState().setSelectedTool(toolId);
        break;
      // Lima 2025 NASA Tools
      case 'urban-observatory':
        setShowUrbanObservatory(true);
        break;
      case 'energy-monitoring':
        setShowEnergyMonitoring(true);
        break;
      case 'green-corridors':
        setShowGreenCorridors(true);
        break;
      case 'transport-system':
        setShowTransportSystem(true);
        break;
      case 'early-warning':
        setShowEarlyWarning(true);
        break;
      case 'city-reports':
        setShowCityReports(true);
        break;
      default:
        // For other tools, use select as default
        useCityEngineStore.getState().setSelectedTool('select');
        break;
    }
  };

  // Handle GIS tool completion
  const handleGISToolComplete = (tool: string, result: any) => {
    console.log('GIS Tool completed:', tool, result);
    
    // Handle specific tool results
    switch (tool) {
      case 'measurement':
        // Store measurement result or update UI
        break;
      case 'analysis':
        // Store analysis result or update layers
        break;
      case 'feature-update':
        // Update feature in layers
        break;
      case 'feature-delete':
        // Remove feature from layers
        break;
      case 'data-import':
        // Add imported data as new layer
        break;
      case 'export-cancel':
        // Reset tool state
        useCityEngineStore.getState().setSelectedTool('select');
        break;
      default:
        break;
    }
  };

  // Create layers array for GIS tools
  const gisLayers = [
    {
      id: 'puerto',
      name: 'Puerto de Chancay',
      features: {
        type: 'FeatureCollection' as const,
        features: [] // Would be populated from actual data
      },
      visible: true
    },
    {
      id: 'buildings',
      name: 'Edificios',
      features: {
        type: 'FeatureCollection' as const,
        features: ceBuildings.map(building => ({
          type: 'Feature' as const,
          id: building.id,
          geometry: {
            type: 'Point' as const,
            coordinates: building.properties?.lng && building.properties?.lat 
              ? [building.properties.lng, building.properties.lat]
              : toLL(building.position[0], building.position[2]).reverse()
          },
          properties: {
            ...building.properties,
            height: building.height,
            type: building.type,
            id: building.id
          }
        }))
      },
      visible: true
    },
    {
      id: 'nasa-data',
      name: 'Datos NASA',
      features: {
        type: 'FeatureCollection' as const,
        features: nasaData.map((point, index) => ({
          type: 'Feature' as const,
          id: index,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.longitude, point.latitude]
          },
          properties: {
            value: point.value,
            timestamp: point.timestamp,
            dataset: selectedDataset,
            parameter: selectedParameter
          }
        }))
      },
      visible: showNASALayer
    }
  ];

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
      
      // Add coordinate and scale tracking
      m.on('mousemove', (e) => {
        setCurrentCoordinates({ 
          lat: e.lngLat.lat, 
          lng: e.lngLat.lng 
        });
      });
      
      m.on('zoom', () => {
        const zoom = m.getZoom();
        // Calculate approximate scale based on zoom level
        const scale = Math.round(591657527.591555 / Math.pow(2, zoom));
        setMapScale(scale);
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

  // Interacciones de edición 2D -> sincroniza con 3D
  useEffect(() => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    const handleClick = (e: any) => {
      if (selectedTool === 'build') {
        const { lng, lat } = e.lngLat;
        const position = to3D(lat, lng);
        const id = 'b_' + Date.now();
        addBuilding({
          id,
          position,
          width: 8,
          depth: 10,
          height: 6 + Math.random() * 12,
          type: 'commercial',
          color: '#8ab4f8',
          rotation: 0,
          properties: {
            floors: 3,
            buildingName: 'Edificio ' + id,
            value: 100000,
            yearBuilt: 2025,
            condition: 100,
            // @ts-ignore opcional extra
            lat,
            // @ts-ignore opcional extra
            lng
          },
          economics: {
            constructionCost: 50000,
            maintenanceCost: 2000,
            propertyTax: 500
          },
          environment: {
            pollutionGenerated: 0,
            noiseLevel: 0,
            energyEfficiency: 80,
            powerConsumption: 1,
            waterConsumption: 1
          }
        } as any);
      }
      if (selectedTool === 'road') {
        const { lng, lat } = e.lngLat;
        const next = [...roadDraft, [lng, lat] as [number, number]];
        if (next.length >= 2) {
          const id = 'r_' + Date.now();
          const pts3d: [number, number, number][] = next.map(([lng, lat]) => to3D(lat, lng));
          addRoad({
            id,
            type: 'avenue',
            points: pts3d,
            width: 8,
            color: '#404040',
            capacity: 1000,
            speedLimit: 50
          } as any);
          setRoadDraft([]);
        } else {
          setRoadDraft(next);
        }
      }
    };
    m.on('click', handleClick);
    return () => {
      m.off('click', handleClick);
    };
  }, [selectedTool, addBuilding, addRoad, roadDraft, to3D]);

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
      .then(async (r) => {
        if (!r.ok) {
          console.warn(`NASA API returned ${r.status}: ${r.statusText}`);
          return [];
        }
        
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch (error) {
          console.warn('NASA API returned invalid JSON:', text.substring(0, 100));
          return [];
        }
      })
      .then(datasets => {
        if (Array.isArray(datasets) && datasets.length > 0) {
          setNasaDatasets(datasets);
          setSelectedDataset(datasets[0].dataset);
          setSelectedParameter(datasets[0].parameter);
        }
      })
      .catch(error => {
        console.warn('Failed to load NASA datasets:', error);
      });
  }, []);

  // Load NASA data when dataset/parameter changes
  useEffect(() => {
    if (!selectedDataset || !selectedParameter) return;
    
    // Load data points
    fetch(`${API}/nasa/data/${selectedDataset}/${selectedParameter}?limit=100&hours_back=24`)
      .then(async (r) => {
        if (!r.ok) {
          console.warn(`NASA data API returned ${r.status}: ${r.statusText}`);
          return { data: [] };
        }
        
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch (error) {
          console.warn('NASA data API returned invalid JSON:', text.substring(0, 100));
          return { data: [] };
        }
      })
      .then(response => setNasaData(response.data || []))
      .catch(error => {
        console.warn('Failed to load NASA data:', error);
        setNasaData([]);
      });

    // Load spatial statistics
    fetch(`${API}/nasa/analysis/spatial-average/${selectedDataset}/${selectedParameter}?hours_back=24`)
      .then(async (r) => {
        if (!r.ok) {
          console.warn(`NASA analysis API returned ${r.status}: ${r.statusText}`);
          return { spatial_stats: null };
        }
        
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch (error) {
          console.warn('NASA analysis API returned invalid JSON:', text.substring(0, 100));
          return { spatial_stats: null };
        }
      })
      .then(response => setSpatialStats(response.spatial_stats))
      .catch(error => {
        console.warn('Failed to load NASA spatial stats:', error);
        setSpatialStats(null);
      });
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

  // Dibuja edificios del CityEngine en el mapa 2D
  useEffect(() => {
    if (!ready || !mapRef.current || viewMode !== '2d') return;
    const map = mapRef.current;
    const features = ceBuildings.map(b => {
      // intentar leer lat/lng desde propiedades, si no, convertir desde posición
      // @ts-ignore
      const lat = b.properties?.lat ?? toLL(b.position[0], b.position[2])[0];
      // @ts-ignore
      const lng = b.properties?.lng ?? toLL(b.position[0], b.position[2])[1];
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { id: b.id, height: b.height }
      } as GeoJSON.Feature;
    });
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    const sourceId = 'ce-buildings';
    const layerId = 'ce-buildings-pts';
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(fc);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: fc });
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'height'],
            0, 4,
            40, 10
          ],
          'circle-color': '#22c55e',
          'circle-stroke-color': '#064e3b',
          'circle-stroke-width': 1,
          'circle-opacity': 0.8
        }
      });
    }
  }, [ceBuildings, ready, viewMode, toLL]);

  // Dibuja borrador de carretera y carreteras confirmadas
  useEffect(() => {
    if (!ready || !mapRef.current || viewMode !== '2d') return;
    const map = mapRef.current;
    const draftSource = 'ce-road-draft';
    const draftLayer = 'ce-road-draft-line';
    const geo: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: roadDraft.length >= 2 ? [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: roadDraft },
        properties: {}
      } as any] : []
    };
    if (map.getSource(draftSource)) {
      (map.getSource(draftSource) as any).setData(geo);
    } else {
      map.addSource(draftSource, { type: 'geojson', data: geo });
      map.addLayer({ id: draftLayer, type: 'line', source: draftSource, paint: { 'line-color': '#22c55e', 'line-width': 3, 'line-dasharray': [1, 1] } });
    }
  }, [roadDraft, ready, viewMode]);

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
            {/* Toolbar unificada para edición 2D */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>
                <ModernToolbar />
              </div>
            </div>
          </div>
        );
      
      case '3d':
        return (
          <Suspense fallback={
            <div className="loading-overlay">
              <div className="loading">🌍 Cargando entorno 3D unificado...</div>
              <div className="loading-details">Inicializando herramientas de visualización y análisis</div>
            </div>
          }>
            <Unified3D 
              data={nasaData} 
              parameter={selectedParameter} 
              dataset={selectedDataset}
              onPointSelect={handleDataPointSelect}
            />
          </Suspense>
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
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* ArcGIS Pro-like Interface */}
      <ArcGISProInterface
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode as ViewMode)}
        onToolSelect={handleToolSelect}
        selectedTool={selectedTool}
      />

      {/* Content Pane */}
      <ContentPane
        isVisible={showContentPane}
        onClose={() => setShowContentPane(false)}
        activePane={activeContentPane}
        onPaneChange={setActiveContentPane}
      />

      {/* Content Pane Toggle Button */}
      {!showContentPane && (
        <button
          onClick={() => setShowContentPane(true)}
          style={{
            position: 'fixed',
            top: '230px',
            left: '16px',
            padding: '8px 12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}
        >
          📋 Mostrar Panel
        </button>
      )}

      {/* Layer Panel */}
      <LayerPanel
        isVisible={showLayerPanel}
        onClose={() => setShowLayerPanel(false)}
      />

      {/* Main Content Area */}
      <div style={{ 
        marginTop: '218px', 
        marginBottom: '28px',
        height: 'calc(100vh - 246px)',
        position: 'relative'
      }}>
        {renderMainContent()}
        
        {/* GIS Tools Manager */}
        <GISToolsManager
          map={viewMode === '2d' ? mapRef.current : null}
          activeTool={selectedTool}
          onToolComplete={handleGISToolComplete}
          currentCoordinates={currentCoordinates}
          layers={gisLayers}
        />
      </div>

      {/* Status Bar */}
      <StatusBar
        coordinates={currentCoordinates}
        scale={mapScale}
        projection="WGS84"
        selectedFeatures={0}
        totalFeatures={ceBuildings.length}
        systemStatus="operational"
        lastUpdate={new Date()}
      />

      {/* Lima 2025 NASA Tools */}
      <LimaUrbanObservatory
        isVisible={showUrbanObservatory}
        onClose={() => setShowUrbanObservatory(false)}
      />
      
      <EnergyServicesMonitoring
        isVisible={showEnergyMonitoring}
        onClose={() => setShowEnergyMonitoring(false)}
      />
      
      <GreenCorridorsPlanning
        isVisible={showGreenCorridors}
        onClose={() => setShowGreenCorridors(false)}
      />
      
      <IntelligentTransportSystem
        isVisible={showTransportSystem}
        onClose={() => setShowTransportSystem(false)}
      />
      
      <EarlyWarningSystem
        isVisible={showEarlyWarning}
        onClose={() => setShowEarlyWarning(false)}
      />
      
      <CityReportsGenerator
        isVisible={showCityReports}
        onClose={() => setShowCityReports(false)}
      />
    </div>
  );
}
