"use client";
import { useState, useRef, useEffect } from 'react';
import * as turf from '@turf/turf';

export interface SpatialAnalysisResult {
  type: 'buffer' | 'intersect' | 'union' | 'clip' | 'spatial-join';
  geometry: GeoJSON.Feature | GeoJSON.FeatureCollection;
  metadata: {
    area?: number;
    perimeter?: number;
    count?: number;
    properties?: any;
  };
  timestamp: Date;
}

interface SpatialAnalysisToolsProps {
  map: any; // MapLibre map instance
  isActive: boolean;
  tool: 'buffer' | 'intersect' | 'union' | 'clip' | 'spatial-join' | null;
  layers: Array<{
    id: string;
    name: string;
    features: GeoJSON.FeatureCollection;
  }>;
  onAnalysisComplete: (result: SpatialAnalysisResult) => void;
}

interface BufferParameters {
  distance: number;
  unit: 'meters' | 'kilometers' | 'miles';
  steps: number;
}

export function SpatialAnalysisTools({ map, isActive, tool, layers, onAnalysisComplete }: SpatialAnalysisToolsProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<GeoJSON.Feature[]>([]);
  const [bufferParams, setBufferParams] = useState<BufferParameters>({
    distance: 100,
    unit: 'meters',
    steps: 8
  });
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const analysisLayersRef = useRef<string[]>([]);

  // Clean up analysis layers
  const clearAnalysisLayers = () => {
    if (!map) return;
    
    analysisLayersRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
    });
    analysisLayersRef.current = [];
  };

  // Buffer analysis
  const performBufferAnalysis = (features: GeoJSON.Feature[]): SpatialAnalysisResult | null => {
    if (features.length === 0) return null;

    try {
      const bufferedFeatures: GeoJSON.Feature[] = [];
      let totalArea = 0;

      features.forEach(feature => {
        const buffered = turf.buffer(feature, bufferParams.distance, { 
          units: bufferParams.unit, 
          steps: bufferParams.steps 
        });
        
        if (buffered) {
          bufferedFeatures.push(buffered);
          const area = turf.area(buffered);
          totalArea += area;
        }
      });

      const result: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: bufferedFeatures
      };

      // Add to map
      addAnalysisResultToMap(result, 'buffer', '#4ade80');

      return {
        type: 'buffer',
        geometry: result,
        metadata: {
          area: totalArea,
          count: bufferedFeatures.length,
          properties: {
            distance: bufferParams.distance,
            unit: bufferParams.unit
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Buffer analysis error:', error);
      return null;
    }
  };

  // Intersection analysis
  const performIntersectionAnalysis = (layer1: GeoJSON.FeatureCollection, layer2: GeoJSON.FeatureCollection): SpatialAnalysisResult | null => {
    if (!layer1.features.length || !layer2.features.length) return null;

    try {
      const intersections: GeoJSON.Feature[] = [];
      let totalArea = 0;

      layer1.features.forEach(feature1 => {
        layer2.features.forEach(feature2 => {
          try {
            // Ensure features are polygons or multipolygons for intersection
            if ((feature1.geometry.type === 'Polygon' || feature1.geometry.type === 'MultiPolygon') &&
                (feature2.geometry.type === 'Polygon' || feature2.geometry.type === 'MultiPolygon')) {
              const intersection = turf.intersect(feature1 as any, feature2 as any);
              if (intersection) {
                intersections.push(intersection);
                const area = turf.area(intersection);
                totalArea += area;
              }
            }
          } catch (e) {
            console.warn('Intersection failed for features:', e);
          }
        });
      });

      const result: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: intersections
      };

      // Add to map
      addAnalysisResultToMap(result, 'intersect', '#f59e0b');

      return {
        type: 'intersect',
        geometry: result,
        metadata: {
          area: totalArea,
          count: intersections.length
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Intersection analysis error:', error);
      return null;
    }
  };

  // Union analysis
  const performUnionAnalysis = (features: GeoJSON.Feature[]): SpatialAnalysisResult | null => {
    if (features.length < 2) return null;

    try {
      // Filter for polygon features only
      const polygonFeatures = features.filter(f => 
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      );
      
      if (polygonFeatures.length < 2) {
        console.warn('Union requires at least 2 polygon features');
        return null;
      }
      
      let union = polygonFeatures[0];
      
      for (let i = 1; i < polygonFeatures.length; i++) {
        const combined = turf.union(union as any, polygonFeatures[i] as any);
        if (combined) {
          union = combined;
        }
      }

      const area = turf.area(union);
      // Calculate perimeter safely
      let perimeter = 0;
      try {
        if (union.geometry.type === 'Polygon' || union.geometry.type === 'MultiPolygon') {
          const lineString = turf.polygonToLine(union as any);
          perimeter = turf.length(lineString, { units: 'meters' });
        }
      } catch (e) {
        console.warn('Could not calculate perimeter:', e);
      }

      const result: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [union]
      };

      // Add to map
      addAnalysisResultToMap(result, 'union', '#8b5cf6');

      return {
        type: 'union',
        geometry: result,
        metadata: {
          area,
          perimeter,
          count: 1
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Union analysis error:', error);
      return null;
    }
  };

  // Spatial join analysis
  const performSpatialJoinAnalysis = (targetLayer: GeoJSON.FeatureCollection, joinLayer: GeoJSON.FeatureCollection): SpatialAnalysisResult | null => {
    if (!targetLayer.features.length || !joinLayer.features.length) return null;

    try {
      const joinedFeatures: GeoJSON.Feature[] = [];

      targetLayer.features.forEach(targetFeature => {
        const spatialMatches: any[] = [];
        
        joinLayer.features.forEach(joinFeature => {
          try {
            // Create point from target feature centroid
            const targetPoint = turf.centroid(targetFeature);
            
            // Check if join feature is a polygon
            if (joinFeature.geometry.type === 'Polygon' || joinFeature.geometry.type === 'MultiPolygon') {
              const isWithin = turf.booleanPointInPolygon(targetPoint, joinFeature as any);
              
              if (isWithin) {
                spatialMatches.push(joinFeature.properties);
              }
            }
          } catch (e) {
            console.warn('Spatial join test failed:', e);
          }
        });

        // Create joined feature with combined properties
        const joinedFeature: GeoJSON.Feature = {
          ...targetFeature,
          properties: {
            ...targetFeature.properties,
            spatialJoinCount: spatialMatches.length,
            joinedProperties: spatialMatches
          }
        };

        joinedFeatures.push(joinedFeature);
      });

      const result: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: joinedFeatures
      };

      // Add to map with styling based on join count
      addSpatialJoinResultToMap(result);

      return {
        type: 'spatial-join',
        geometry: result,
        metadata: {
          count: joinedFeatures.length,
          properties: {
            avgJoinCount: joinedFeatures.reduce((sum, f) => sum + (f.properties?.spatialJoinCount || 0), 0) / joinedFeatures.length
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Spatial join analysis error:', error);
      return null;
    }
  };

  // Add analysis result to map
  const addAnalysisResultToMap = (result: GeoJSON.FeatureCollection, analysisType: string, color: string) => {
    if (!map) return;

    const sourceId = `analysis-${analysisType}-${Date.now()}`;
    const layerId = `analysis-${analysisType}-layer-${Date.now()}`;

    map.addSource(sourceId, { type: 'geojson', data: result });

    // Determine layer type based on geometry
    const firstGeometry = result.features[0]?.geometry;
    if (!firstGeometry) return;

    if (firstGeometry.type === 'Polygon' || firstGeometry.type === 'MultiPolygon') {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.3
        }
      });

      map.addLayer({
        id: `${layerId}-stroke`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 2
        }
      });

      analysisLayersRef.current.push(layerId, `${layerId}-stroke`);
    } else if (firstGeometry.type === 'LineString' || firstGeometry.type === 'MultiLineString') {
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 3
        }
      });

      analysisLayersRef.current.push(layerId);
    } else if (firstGeometry.type === 'Point' || firstGeometry.type === 'MultiPoint') {
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': color,
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      analysisLayersRef.current.push(layerId);
    }

    analysisLayersRef.current.push(sourceId);
  };

  // Add spatial join result with graduated colors
  const addSpatialJoinResultToMap = (result: GeoJSON.FeatureCollection) => {
    if (!map) return;

    const sourceId = `analysis-spatial-join-${Date.now()}`;
    const layerId = `analysis-spatial-join-layer-${Date.now()}`;

    map.addSource(sourceId, { type: 'geojson', data: result });

    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'spatialJoinCount'],
          0, '#fef3c7',
          1, '#fcd34d',
          5, '#f59e0b',
          10, '#d97706',
          20, '#92400e'
        ],
        'fill-opacity': 0.7
      }
    });

    map.addLayer({
      id: `${layerId}-stroke`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#92400e',
        'line-width': 1
      }
    });

    analysisLayersRef.current.push(sourceId, layerId, `${layerId}-stroke`);
  };

  // Handle feature selection for analysis
  useEffect(() => {
    if (!map || !isActive || !tool) return;

    const handleClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point);
      if (features.length > 0) {
        const selectedFeature = features[0];
        setSelectedFeatures(prev => {
          const exists = prev.find(f => f.id === selectedFeature.id);
          if (exists) {
            return prev.filter(f => f.id !== selectedFeature.id);
          } else {
            return [...prev, selectedFeature];
          }
        });
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, isActive, tool]);

  // Execute analysis based on tool and selections
  const executeAnalysis = () => {
    if (!tool || selectedFeatures.length === 0) return;

    let result: SpatialAnalysisResult | null = null;

    switch (tool) {
      case 'buffer':
        result = performBufferAnalysis(selectedFeatures);
        break;
      
      case 'intersect':
        if (selectedLayers.length >= 2) {
          const layer1 = layers.find(l => l.id === selectedLayers[0])?.features;
          const layer2 = layers.find(l => l.id === selectedLayers[1])?.features;
          if (layer1 && layer2) {
            result = performIntersectionAnalysis(layer1, layer2);
          }
        }
        break;
      
      case 'union':
        if (selectedFeatures.length >= 2) {
          result = performUnionAnalysis(selectedFeatures);
        }
        break;
      
      case 'spatial-join':
        if (selectedLayers.length >= 2) {
          const targetLayer = layers.find(l => l.id === selectedLayers[0])?.features;
          const joinLayer = layers.find(l => l.id === selectedLayers[1])?.features;
          if (targetLayer && joinLayer) {
            result = performSpatialJoinAnalysis(targetLayer, joinLayer);
          }
        }
        break;
    }

    if (result) {
      onAnalysisComplete(result);
      setSelectedFeatures([]);
    }
  };

  // Clear analysis when tool changes
  useEffect(() => {
    if (!isActive || !tool) {
      clearAnalysisLayers();
      setSelectedFeatures([]);
    }
  }, [isActive, tool]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnalysisLayers();
    };
  }, []);

  // Render analysis controls
  if (!isActive || !tool) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '280px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
        Análisis Espacial - {tool.charAt(0).toUpperCase() + tool.slice(1)}
      </h3>

      {tool === 'buffer' && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Distancia:
            </label>
            <input
              type="number"
              value={bufferParams.distance}
              onChange={(e) => setBufferParams(prev => ({ ...prev, distance: Number(e.target.value) }))}
              style={{ 
                width: '100%', 
                padding: '4px 8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Unidad:
            </label>
            <select
              value={bufferParams.unit}
              onChange={(e) => setBufferParams(prev => ({ ...prev, unit: e.target.value as any }))}
              style={{ 
                width: '100%', 
                padding: '4px 8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="meters">Metros</option>
              <option value="kilometers">Kilómetros</option>
              <option value="miles">Millas</option>
            </select>
          </div>
        </div>
      )}

      {(tool === 'intersect' || tool === 'spatial-join') && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
            Seleccionar Capas:
          </label>
          {layers.map(layer => (
            <label key={layer.id} style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLayers(prev => [...prev, layer.id].slice(0, 2)); // Max 2 layers
                  } else {
                    setSelectedLayers(prev => prev.filter(id => id !== layer.id));
                  }
                }}
                style={{ marginRight: '8px' }}
              />
              {layer.name}
            </label>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
        {tool === 'buffer' && `Características seleccionadas: ${selectedFeatures.length}`}
        {tool === 'union' && `Características seleccionadas: ${selectedFeatures.length} (mín. 2)`}
        {(tool === 'intersect' || tool === 'spatial-join') && 
          `Capas seleccionadas: ${selectedLayers.length}/2`}
      </div>

      <button
        onClick={executeAnalysis}
        disabled={
          (tool === 'buffer' && selectedFeatures.length === 0) ||
          (tool === 'union' && selectedFeatures.length < 2) ||
          ((tool === 'intersect' || tool === 'spatial-join') && selectedLayers.length < 2)
        }
        style={{
          width: '100%',
          padding: '8px 16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          opacity: selectedFeatures.length === 0 && selectedLayers.length < 2 ? 0.5 : 1
        }}
      >
        Ejecutar Análisis
      </button>

      <button
        onClick={() => {
          clearAnalysisLayers();
          setSelectedFeatures([]);
          setSelectedLayers([]);
        }}
        style={{
          width: '100%',
          padding: '6px 16px',
          background: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '11px',
          marginTop: '8px',
          cursor: 'pointer'
        }}
      >
        Limpiar
      </button>
    </div>
  );
}

export default SpatialAnalysisTools;