"use client";
import { useState, useRef, useEffect } from 'react';
import MeasurementTools, { MeasurementResult } from './MeasurementTools';
import SpatialAnalysisTools, { SpatialAnalysisResult } from './SpatialAnalysisTools';
import AttributeTable, { FeatureData } from './AttributeTable';
import CoordinateSystemManager from './CoordinateSystemManager';

interface GISToolsManagerProps {
  map: any; // MapLibre map instance
  activeTool: string | null;
  onToolComplete: (tool: string, result: any) => void;
  currentCoordinates: { lat: number; lng: number };
  layers: Array<{
    id: string;
    name: string;
    features: GeoJSON.FeatureCollection;
    visible: boolean;
  }>;
}

export function GISToolsManager({ 
  map, 
  activeTool, 
  onToolComplete, 
  currentCoordinates,
  layers 
}: GISToolsManagerProps) {
  // State for different tool interfaces
  const [showAttributeTable, setShowAttributeTable] = useState(false);
  const [showCoordinateManager, setShowCoordinateManager] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [measurementResults, setMeasurementResults] = useState<MeasurementResult[]>([]);
  const [analysisResults, setAnalysisResults] = useState<SpatialAnalysisResult[]>([]);
  const [currentCoordinateSystem, setCurrentCoordinateSystem] = useState('WGS84');

  // Refs for tool state management
  const toolStateRef = useRef<{
    isDrawing: boolean;
    currentTool: string | null;
  }>({
    isDrawing: false,
    currentTool: null
  });

  // Handle tool activation/deactivation
  useEffect(() => {
    const previousTool = toolStateRef.current.currentTool;
    toolStateRef.current.currentTool = activeTool;

    // Handle tool-specific UI visibility
    switch (activeTool) {
      case 'attributes':
        setShowAttributeTable(true);
        break;
      case 'coordinates':
        setShowCoordinateManager(true);
        break;
      case 'layers':
        // Layer panel is handled by parent component
        break;
      default:
        // Close any open panels when switching to drawing tools
        if (isDrawingTool(activeTool)) {
          setShowAttributeTable(false);
          setShowCoordinateManager(false);
        }
        break;
    }

    // Update cursor for active tool
    updateMapCursor(activeTool);

    // Clean up previous tool if needed
    if (previousTool && previousTool !== activeTool) {
      cleanupTool(previousTool);
    }
  }, [activeTool]);

  // Check if tool is a drawing/editing tool
  const isDrawingTool = (tool: string | null): boolean => {
    const drawingTools = [
      'measure-distance', 'measure-area', 'measure-point',
      'create-polygon', 'create-line', 'create-point',
      'buffer', 'intersect', 'union', 'spatial-join', 'clip',
      'select', 'edit', 'delete'
    ];
    return tool ? drawingTools.includes(tool) : false;
  };

  // Check if tool is a measurement tool
  const isMeasurementTool = (tool: string | null): boolean => {
    return tool ? ['measure-distance', 'measure-area', 'measure-point'].includes(tool) : false;
  };

  // Check if tool is an analysis tool
  const isAnalysisTool = (tool: string | null): boolean => {
    return tool ? ['buffer', 'intersect', 'union', 'spatial-join', 'clip'].includes(tool) : false;
  };

  // Update map cursor based on active tool
  const updateMapCursor = (tool: string | null): void => {
    if (!map) return;

    const canvas = map.getCanvas();
    if (!canvas) return;

    switch (tool) {
      case 'measure-distance':
      case 'measure-area':
      case 'measure-point':
        canvas.style.cursor = 'crosshair';
        break;
      case 'select':
        canvas.style.cursor = 'pointer';
        break;
      case 'edit':
        canvas.style.cursor = 'move';
        break;
      case 'delete':
        canvas.style.cursor = 'not-allowed';
        break;
      case 'create-polygon':
      case 'create-line':
      case 'create-point':
        canvas.style.cursor = 'crosshair';
        break;
      case 'buffer':
      case 'intersect':
      case 'union':
      case 'spatial-join':
      case 'clip':
        canvas.style.cursor = 'cell';
        break;
      default:
        canvas.style.cursor = '';
        break;
    }
  };

  // Clean up tool-specific resources
  const cleanupTool = (tool: string): void => {
    // Reset drawing state
    toolStateRef.current.isDrawing = false;
    
    // Tool-specific cleanup
    switch (tool) {
      case 'measure-distance':
      case 'measure-area':
      case 'measure-point':
        // Measurement tools cleanup is handled by the component itself
        break;
      case 'buffer':
      case 'intersect':
      case 'union':
      case 'spatial-join':
      case 'clip':
        // Analysis tools cleanup is handled by the component itself
        break;
      default:
        break;
    }
  };

  // Handle measurement completion
  const handleMeasurementComplete = (result: MeasurementResult): void => {
    setMeasurementResults(prev => [...prev, result]);
    onToolComplete('measurement', result);
    
    // Show notification
    showToolNotification(`Medición completada: ${result.value} ${result.unit}`, 'success');
  };

  // Handle analysis completion
  const handleAnalysisComplete = (result: SpatialAnalysisResult): void => {
    setAnalysisResults(prev => [...prev, result]);
    onToolComplete('analysis', result);
    
    // Show notification
    showToolNotification(`Análisis ${result.type} completado`, 'success');
  };

  // Show tool notification
  const showToolNotification = (message: string, type: 'success' | 'error' | 'info'): void => {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  // Handle feature selection for attribute table
  const handleFeatureSelect = (featureId: string | number): void => {
    // Highlight feature on map
    // This would typically involve updating map styling
    console.log('Feature selected:', featureId);
  };

  // Handle feature update from attribute table
  const handleFeatureUpdate = (featureId: string | number, properties: Record<string, any>): void => {
    // Update feature properties in the layer
    // This would typically involve updating the data source
    console.log('Feature updated:', featureId, properties);
    onToolComplete('feature-update', { featureId, properties });
  };

  // Handle feature deletion
  const handleFeatureDelete = (featureId: string | number): void => {
    // Delete feature from layer
    console.log('Feature deleted:', featureId);
    onToolComplete('feature-delete', { featureId });
  };

  // Get features for attribute table
  const getAttributeTableFeatures = (): FeatureData[] => {
    const layer = layers.find(l => l.id === selectedLayer);
    if (!layer) return [];
    
    return layer.features.features.map(feature => ({
      id: feature.id || Math.random().toString(),
      geometry: feature.geometry,
      properties: feature.properties || {}
    }));
  };

  // Handle data import
  const handleDataImport = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: any;

        if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing (would need a proper library for production)
          data = parseCSVToGeoJSON(content);
        } else {
          throw new Error('Formato de archivo no soportado');
        }

        onToolComplete('data-import', { data, filename: file.name });
        showToolNotification(`Datos importados: ${file.name}`, 'success');
      } catch (error) {
        showToolNotification(`Error importando datos: ${error}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Simple CSV to GeoJSON parser (basic implementation)
  const parseCSVToGeoJSON = (csvContent: string): GeoJSON.FeatureCollection => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const lngIndex = headers.findIndex(h => h.toLowerCase().includes('lng') || h.toLowerCase().includes('lon'));
    const latIndex = headers.findIndex(h => h.toLowerCase().includes('lat'));
    
    if (lngIndex === -1 || latIndex === -1) {
      throw new Error('No se encontraron columnas de coordenadas (lat/lng)');
    }

    const features: GeoJSON.Feature[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const lng = parseFloat(values[lngIndex]);
      const lat = parseFloat(values[latIndex]);
      
      if (isNaN(lng) || isNaN(lat)) continue;
      
      const properties: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index !== lngIndex && index !== latIndex) {
          properties[header] = values[index];
        }
      });
      
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties
      });
    }
    
    return {
      type: 'FeatureCollection',
      features
    };
  };

  // Handle data export
  const handleDataExport = (format: 'geojson' | 'csv'): void => {
    const layer = layers.find(l => l.id === selectedLayer);
    if (!layer) {
      showToolNotification('Seleccione una capa para exportar', 'error');
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'geojson') {
      content = JSON.stringify(layer.features, null, 2);
      filename = `${layer.name}.geojson`;
      mimeType = 'application/json';
    } else {
      // Export as CSV
      const features = layer.features.features;
      if (features.length === 0) {
        showToolNotification('No hay datos para exportar', 'error');
        return;
      }

      // Get all property keys
      const allProps = new Set<string>();
      features.forEach(f => {
        Object.keys(f.properties || {}).forEach(key => allProps.add(key));
      });
      
      const headers = ['id', 'geometry_type', 'lng', 'lat', ...Array.from(allProps)];
      const rows = features.map(feature => {
        const coords = feature.geometry.type === 'Point' 
          ? feature.geometry.coordinates 
          : [0, 0]; // For non-point geometries, use centroid or 0,0
        
        return headers.map(header => {
          switch (header) {
            case 'id': return feature.id || '';
            case 'geometry_type': return feature.geometry.type;
            case 'lng': return coords[0];
            case 'lat': return coords[1];
            default: return feature.properties?.[header] || '';
          }
        }).join(',');
      });
      
      content = [headers.join(','), ...rows].join('\n');
      filename = `${layer.name}.csv`;
      mimeType = 'text/csv';
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    showToolNotification(`Datos exportados: ${filename}`, 'success');
  };

  return (
    <>
      {/* Measurement Tools */}
      {isMeasurementTool(activeTool) && (
        <MeasurementTools
          map={map}
          isActive={true}
          tool={activeTool?.replace('measure-', '') as 'distance' | 'area' | 'point'}
          onMeasurementComplete={handleMeasurementComplete}
        />
      )}

      {/* Spatial Analysis Tools */}
      {isAnalysisTool(activeTool) && (
        <SpatialAnalysisTools
          map={map}
          isActive={true}
          tool={activeTool as 'buffer' | 'intersect' | 'union' | 'clip' | 'spatial-join'}
          layers={layers}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {/* Attribute Table */}
      {showAttributeTable && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1001,
          padding: '20px',
          minWidth: '400px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
            Seleccionar Capa para Tabla de Atributos
          </h3>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '16px'
            }}
          >
            <option value="">Seleccionar capa...</option>
            {layers.map(layer => (
              <option key={layer.id} value={layer.id}>
                {layer.name} ({layer.features.features.length} características)
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (selectedLayer) {
                  setShowAttributeTable(false);
                  // Open actual attribute table
                  setTimeout(() => setShowAttributeTable(true), 100);
                }
              }}
              disabled={!selectedLayer}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: selectedLayer ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedLayer ? 'pointer' : 'default',
                fontSize: '12px'
              }}
            >
              Abrir Tabla
            </button>
            <button
              onClick={() => setShowAttributeTable(false)}
              style={{
                padding: '8px 16px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {selectedLayer && showAttributeTable && (
        <AttributeTable
          isVisible={true}
          onClose={() => {
            setShowAttributeTable(false);
            setSelectedLayer('');
          }}
          features={getAttributeTableFeatures()}
          layerName={layers.find(l => l.id === selectedLayer)?.name || ''}
          onFeatureSelect={handleFeatureSelect}
          onFeatureUpdate={handleFeatureUpdate}
          onFeatureDelete={handleFeatureDelete}
          editable={true}
        />
      )}

      {/* Coordinate System Manager */}
      {showCoordinateManager && (
        <CoordinateSystemManager
          isVisible={true}
          onClose={() => setShowCoordinateManager(false)}
          currentCoordinates={currentCoordinates}
          onCoordinateSystemChange={setCurrentCoordinateSystem}
          currentSystem={currentCoordinateSystem}
        />
      )}

      {/* Data Import/Export Tools */}
      {activeTool === 'import-data' && (
        <input
          type="file"
          accept=".json,.geojson,.csv"
          onChange={handleDataImport}
          style={{ display: 'none' }}
          ref={(ref) => ref?.click()}
        />
      )}

      {activeTool === 'export-data' && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1001,
          padding: '20px',
          minWidth: '300px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
            Exportar Datos
          </h3>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '16px'
            }}
          >
            <option value="">Seleccionar capa...</option>
            {layers.map(layer => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => handleDataExport('geojson')}
              disabled={!selectedLayer}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: selectedLayer ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedLayer ? 'pointer' : 'default',
                fontSize: '12px'
              }}
            >
              GeoJSON
            </button>
            <button
              onClick={() => handleDataExport('csv')}
              disabled={!selectedLayer}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: selectedLayer ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedLayer ? 'pointer' : 'default',
                fontSize: '12px'
              }}
            >
              CSV
            </button>
          </div>
          <button
            onClick={() => onToolComplete('export-cancel', null)}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Measurement Results Panel */}
      {measurementResults.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '280px',
          right: '20px',
          background: 'white',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '12px',
          maxWidth: '250px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '600' }}>📏 Mediciones</h4>
            <button
              onClick={() => setMeasurementResults([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {measurementResults.slice(-5).map((result, index) => (
              <div key={index} style={{
                padding: '6px 8px',
                background: '#f3f4f6',
                borderRadius: '4px',
                marginBottom: '4px',
                fontSize: '11px'
              }}>
                <div style={{ fontWeight: '500' }}>
                  {result.type === 'distance' ? '📏' : result.type === 'area' ? '📐' : '📍'} 
                  {result.type.toUpperCase()}
                </div>
                <div>{result.value} {result.unit}</div>
                <div style={{ color: '#6b7280', fontSize: '10px' }}>
                  {result.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default GISToolsManager;