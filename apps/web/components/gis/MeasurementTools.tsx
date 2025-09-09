"use client";
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface MeasurementResult {
  type: 'distance' | 'area' | 'point';
  value: number;
  unit: string;
  coordinates: [number, number][];
  timestamp: Date;
}

interface MeasurementToolsProps {
  map: any; // MapLibre map instance
  isActive: boolean;
  tool: 'distance' | 'area' | 'point' | null;
  onMeasurementComplete: (result: MeasurementResult) => void;
}

// Utility functions for measurements
const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

const calculatePolygonArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;
  
  // Convert to radians and calculate area using spherical excess
  const R = 6371000; // Earth's radius in meters
  let area = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[j];
    
    area += (lng2 - lng1) * Math.PI / 180 * 
            (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180));
  }
  
  area = Math.abs(area) * R * R / 2;
  return area; // Area in square meters
};

const formatDistance = (meters: number): { value: number; unit: string } => {
  if (meters < 1000) {
    return { value: Math.round(meters * 100) / 100, unit: 'm' };
  } else if (meters < 100000) {
    return { value: Math.round(meters / 10) / 100, unit: 'km' };
  } else {
    return { value: Math.round(meters / 1000), unit: 'km' };
  }
};

const formatArea = (sqMeters: number): { value: number; unit: string } => {
  if (sqMeters < 10000) {
    return { value: Math.round(sqMeters * 100) / 100, unit: 'm²' };
  } else if (sqMeters < 1000000) {
    return { value: Math.round(sqMeters / 100) / 100, unit: 'ha' };
  } else {
    return { value: Math.round(sqMeters / 10000) / 100, unit: 'km²' };
  }
};

export function MeasurementTools({ map, isActive, tool, onMeasurementComplete }: MeasurementToolsProps) {
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementResult[]>([]);
  const measurementLayersRef = useRef<string[]>([]);

  // Clean up measurement layers
  const clearMeasurements = () => {
    if (!map) return;
    
    measurementLayersRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
    });
    measurementLayersRef.current = [];
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  // Handle map clicks for measurement tools
  useEffect(() => {
    if (!map || !isActive || !tool) return;

    const handleClick = (e: any) => {
      const { lng, lat } = e.lngLat;
      const newPoint: [number, number] = [lng, lat];

      if (tool === 'point') {
        // Point measurement - just capture coordinates
        const result: MeasurementResult = {
          type: 'point',
          value: 0,
          unit: 'coordinates',
          coordinates: [newPoint],
          timestamp: new Date()
        };
        onMeasurementComplete(result);
        addPointToMap(newPoint);
        return;
      }

      if (tool === 'distance') {
        const newPoints = [...currentPoints, newPoint];
        setCurrentPoints(newPoints);
        
        if (newPoints.length >= 2) {
          // Calculate distance
          let totalDistance = 0;
          for (let i = 1; i < newPoints.length; i++) {
            totalDistance += calculateDistance(newPoints[i-1], newPoints[i]);
          }
          
          const formatted = formatDistance(totalDistance);
          const result: MeasurementResult = {
            type: 'distance',
            value: formatted.value,
            unit: formatted.unit,
            coordinates: newPoints,
            timestamp: new Date()
          };
          
          addLineToMap(newPoints, totalDistance);
          onMeasurementComplete(result);
        } else {
          addPointToMap(newPoint);
        }
      }

      if (tool === 'area') {
        const newPoints = [...currentPoints, newPoint];
        setCurrentPoints(newPoints);
        
        if (newPoints.length >= 3) {
          // Check for double-click to complete polygon
          if (newPoints.length > 3) {
            const lastPoint = newPoints[newPoints.length - 1];
            const secondLastPoint = newPoints[newPoints.length - 2];
            const distance = calculateDistance(lastPoint, secondLastPoint);
            
            if (distance < 10) { // Close polygon if points are very close
              const polygonPoints = newPoints.slice(0, -1); // Remove duplicate
              const area = calculatePolygonArea(polygonPoints);
              const formatted = formatArea(area);
              
              const result: MeasurementResult = {
                type: 'area',
                value: formatted.value,
                unit: formatted.unit,
                coordinates: polygonPoints,
                timestamp: new Date()
              };
              
              addPolygonToMap(polygonPoints, area);
              onMeasurementComplete(result);
              setCurrentPoints([]);
              return;
            }
          }
          
          addPointToMap(newPoint);
          updatePolygonPreview(newPoints);
        } else {
          addPointToMap(newPoint);
        }
      }
    };

    const handleDoubleClick = (e: any) => {
      if (tool === 'area' && currentPoints.length >= 3) {
        const area = calculatePolygonArea(currentPoints);
        const formatted = formatArea(area);
        
        const result: MeasurementResult = {
          type: 'area',
          value: formatted.value,
          unit: formatted.unit,
          coordinates: currentPoints,
          timestamp: new Date()
        };
        
        addPolygonToMap(currentPoints, area);
        onMeasurementComplete(result);
        setCurrentPoints([]);
      }
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDoubleClick);
    };
  }, [map, isActive, tool, currentPoints, onMeasurementComplete]);

  // Add point to map
  const addPointToMap = (point: [number, number]) => {
    if (!map) return;
    
    const pointId = `measurement-point-${Date.now()}-${Math.random()}`;
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point
        },
        properties: {}
      }]
    };

    map.addSource(pointId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: pointId,
      type: 'circle',
      source: pointId,
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff6b35',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    measurementLayersRef.current.push(pointId);
  };

  // Add line to map with distance label
  const addLineToMap = (points: [number, number][], distance: number) => {
    if (!map || points.length < 2) return;
    
    const lineId = `measurement-line-${Date.now()}`;
    const labelId = `measurement-label-${Date.now()}`;
    
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points
        },
        properties: {}
      }]
    };

    // Add line
    map.addSource(lineId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: lineId,
      type: 'line',
      source: lineId,
      paint: {
        'line-color': '#ff6b35',
        'line-width': 3,
        'line-dasharray': [2, 2]
      }
    });

    // Add distance label at midpoint
    const midPoint = points[Math.floor(points.length / 2)];
    const formatted = formatDistance(distance);
    const labelGeojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: midPoint
        },
        properties: {
          label: `${formatted.value} ${formatted.unit}`
        }
      }]
    };

    map.addSource(labelId, { type: 'geojson', data: labelGeojson });
    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: labelId,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, -2]
      },
      paint: {
        'text-color': '#ff6b35',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    measurementLayersRef.current.push(lineId, labelId);
  };

  // Add polygon to map with area label
  const addPolygonToMap = (points: [number, number][], area: number) => {
    if (!map || points.length < 3) return;
    
    const polygonId = `measurement-polygon-${Date.now()}`;
    const labelId = `measurement-area-label-${Date.now()}`;
    
    // Close polygon
    const closedPoints = [...points, points[0]];
    
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [closedPoints]
        },
        properties: {}
      }]
    };

    // Add polygon
    map.addSource(polygonId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: polygonId,
      type: 'fill',
      source: polygonId,
      paint: {
        'fill-color': '#ff6b35',
        'fill-opacity': 0.2
      }
    });
    
    map.addLayer({
      id: `${polygonId}-stroke`,
      type: 'line',
      source: polygonId,
      paint: {
        'line-color': '#ff6b35',
        'line-width': 2,
        'line-dasharray': [3, 3]
      }
    });

    // Add area label at centroid
    const centroid = calculateCentroid(points);
    const formatted = formatArea(area);
    const labelGeojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: centroid
        },
        properties: {
          label: `${formatted.value} ${formatted.unit}`
        }
      }]
    };

    map.addSource(labelId, { type: 'geojson', data: labelGeojson });
    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: labelId,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ff6b35',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    measurementLayersRef.current.push(polygonId, `${polygonId}-stroke`, labelId);
  };

  // Update polygon preview while drawing
  const updatePolygonPreview = (points: [number, number][]): void => {
    if (!map || points.length < 2) return;
    
    const previewId = 'measurement-polygon-preview';
    
    // Remove existing preview
    if (map.getLayer(previewId)) {
      map.removeLayer(previewId);
    }
    if (map.getSource(previewId)) {
      map.removeSource(previewId);
    }

    // Add new preview
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...points, points[0]]]
        },
        properties: {}
      }]
    };

    map.addSource(previewId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: previewId,
      type: 'fill',
      source: previewId,
      paint: {
        'fill-color': '#ff6b35',
        'fill-opacity': 0.1
      }
    });
  };

  // Calculate polygon centroid
  const calculateCentroid = (points: [number, number][]): [number, number] => {
    let sumLng = 0;
    let sumLat = 0;
    
    points.forEach(([lng, lat]) => {
      sumLng += lng;
      sumLat += lat;
    });
    
    return [sumLng / points.length, sumLat / points.length];
  };

  // Clear measurements when tool changes or becomes inactive
  useEffect(() => {
    if (!isActive || !tool) {
      clearMeasurements();
    }
  }, [isActive, tool]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMeasurements();
    };
  }, []);

  return null; // This component only handles map interactions
}

export default MeasurementTools;