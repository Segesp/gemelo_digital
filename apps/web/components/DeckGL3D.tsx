"use client";
import DeckGL from '@deck.gl/react';
import { ColumnLayer, ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { GridLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { useMemo, useState } from 'react';

interface DataPoint {
  longitude: number;
  latitude: number;
  value: number;
  timestamp: string;
}

interface DeckGL3DProps {
  data: DataPoint[];
  parameter: string;
  dataset: string;
}

const INITIAL_VIEW_STATE = {
  longitude: -77.27,
  latitude: -11.57,
  zoom: 14,
  pitch: 45,
  bearing: 0
};

export default function DeckGL3D({ data, parameter, dataset }: DeckGL3DProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [layerType, setLayerType] = useState<'columns' | 'heatmap' | 'grid' | 'scatter'>('columns');

  // Process data for deck.gl layers
  const processedData = useMemo(() => {
    return data.map(point => ({
      position: [point.longitude, point.latitude],
      value: point.value,
      timestamp: point.timestamp,
      elevation: point.value * 100, // Scale elevation
      color: [
        Math.min(255, point.value * 5), // Red intensity
        Math.max(0, 255 - point.value * 5), // Green intensity
        100,
        180
      ]
    }));
  }, [data]);

  // Create layers based on selected type
  const layers = useMemo(() => {
    const baseLayers = [];

    // Add Chancay port structures (simplified)
    const portStructures: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-77.275, -11.57],
              [-77.265, -11.57],
              [-77.265, -11.575],
              [-77.275, -11.575],
              [-77.275, -11.57]
            ]]
          },
          properties: {
            name: 'Puerto Principal',
            elevation: 50
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-77.272, -11.568],
              [-77.268, -11.568],
              [-77.268, -11.572],
              [-77.272, -11.572],
              [-77.272, -11.568]
            ]]
          },
          properties: {
            name: 'Área de Contenedores',
            elevation: 30
          }
        }
      ]
    };

    baseLayers.push(
      new GeoJsonLayer({
        id: 'port-structures',
        data: portStructures,
        filled: true,
        extruded: true,
        getElevation: (d: any) => d.properties.elevation,
        getFillColor: [100, 150, 200, 180],
        getLineColor: [80, 80, 80],
        lineWidthMinPixels: 1,
        pickable: true
      })
    );

    // Add data visualization layer based on type
    switch (layerType) {
      case 'columns':
        baseLayers.push(
          new ColumnLayer({
            id: 'data-columns',
            data: processedData,
            diskResolution: 12,
            radius: 50,
            extruded: true,
            pickable: true,
            elevationScale: 2,
            getPosition: (d: any) => d.position,
            getFillColor: (d: any) => d.color,
            getElevation: (d: any) => d.elevation,
            onHover: ({ object, x, y }: any) => {
              if (object) {
                // Show tooltip
                const tooltip = document.getElementById('deckgl-tooltip');
                if (tooltip) {
                  tooltip.style.display = 'block';
                  tooltip.style.left = x + 'px';
                  tooltip.style.top = y + 'px';
                  tooltip.innerHTML = `
                    <strong>${parameter}</strong><br/>
                    Valor: ${object.value}<br/>
                    Coordenadas: ${object.position[1].toFixed(4)}, ${object.position[0].toFixed(4)}
                  `;
                }
              } else {
                const tooltip = document.getElementById('deckgl-tooltip');
                if (tooltip) tooltip.style.display = 'none';
              }
            }
          })
        );
        break;

      case 'heatmap':
        baseLayers.push(
          new HeatmapLayer({
            id: 'data-heatmap',
            data: processedData,
            getPosition: (d: any) => d.position,
            getWeight: (d: any) => d.value,
            radiusPixels: 100,
            intensity: 1,
            threshold: 0.03
          })
        );
        break;

      case 'grid':
        baseLayers.push(
          new GridLayer({
            id: 'data-grid',
            data: processedData,
            pickable: true,
            extruded: true,
            cellSize: 200,
            elevationScale: 4,
            getPosition: (d: any) => d.position,
            getFillColor: [255, 140, 0, 180],
            getElevation: (d: any) => d.value
          })
        );
        break;

      case 'scatter':
        baseLayers.push(
          new ScatterplotLayer({
            id: 'data-scatter',
            data: processedData,
            pickable: true,
            opacity: 0.8,
            stroked: true,
            filled: true,
            radiusScale: 6,
            radiusMinPixels: 1,
            radiusMaxPixels: 100,
            lineWidthMinPixels: 1,
            getPosition: (d: any) => d.position,
            getRadius: (d: any) => Math.sqrt(d.value) * 10,
            getFillColor: (d: any) => d.color,
            getLineColor: [0, 0, 0]
          })
        );
        break;
    }

    return baseLayers;
  }, [processedData, layerType, parameter]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        viewState={viewState}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
        style={{ background: '#001122' }}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>🌍 Vista Geoespacial 3D</strong>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Tipo de visualización:
          </label>
          <select 
            value={layerType}
            onChange={(e) => setLayerType(e.target.value as any)}
            style={{ 
              background: '#374151', 
              color: 'white', 
              border: '1px solid #6b7280',
              borderRadius: '4px',
              padding: '4px',
              width: '100%'
            }}
          >
            <option value="columns">Columnas 3D</option>
            <option value="heatmap">Mapa de calor</option>
            <option value="grid">Grilla agregada</option>
            <option value="scatter">Puntos dispersos</option>
          </select>
        </div>

        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div><strong>Dataset:</strong> {dataset}</div>
          <div><strong>Parámetro:</strong> {parameter}</div>
          <div><strong>Puntos:</strong> {data.length}</div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '10px', lineHeight: '1.3' }}>
          <div><strong>Controles:</strong></div>
          <div>🖱️ Click + arrastrar: Rotar</div>
          <div>⚡ Ctrl + arrastrar: Inclinar</div>
          <div>🔍 Scroll: Zoom</div>
          <div>🔄 Shift + arrastrar: Mover</div>
        </div>
      </div>

      {/* View state info */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 1000
      }}>
        <div>Zoom: {viewState.zoom.toFixed(1)}</div>
        <div>Inclinación: {viewState.pitch.toFixed(0)}°</div>
        <div>Orientación: {viewState.bearing.toFixed(0)}°</div>
      </div>

      {/* Tooltip */}
      <div
        id="deckgl-tooltip"
        style={{
          position: 'absolute',
          zIndex: 1001,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          display: 'none'
        }}
      />
    </div>
  );
}