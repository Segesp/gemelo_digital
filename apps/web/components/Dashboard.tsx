"use client";
import { useState } from 'react';

interface DashboardData {
  temperature: number | null;
  spatialStats: any;
  selectedDataPoint: any;
  nasaDatasets: any[];
  selectedDataset: string;
  selectedParameter: string;
}

interface DashboardControlsProps {
  data: DashboardData;
  onDatasetChange: (dataset: string) => void;
  onParameterChange: (parameter: string) => void;
  onNASALayerToggle: (show: boolean) => void;
  showNASALayer: boolean;
  viewMode: string;
}

export function DashboardHeader() {
  return (
    <div style={{
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🛰️ Gemelo Digital de Chancay
          </h1>
          <p style={{ 
            fontSize: '16px', 
            opacity: 0.9, 
            margin: 0 
          }}>
            Plataforma avanzada de análisis geoespacial y planificación urbana
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          fontSize: '14px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.8 }}>Última actualización</div>
            <div style={{ fontWeight: 'bold' }}>{new Date().toLocaleTimeString()}</div>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '8px 16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ opacity: 0.8 }}>Estado del Sistema</div>
            <div style={{ fontWeight: 'bold', color: '#10b981' }}>🟢 Operativo</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardControls({ 
  data, 
  onDatasetChange, 
  onParameterChange, 
  onNASALayerToggle, 
  showNASALayer,
  viewMode 
}: DashboardControlsProps) {
  const uniqueDatasets = Array.from(new Set(data.nasaDatasets.map(d => d.dataset)));
  const parametersForDataset = data.nasaDatasets.filter(d => d.dataset === data.selectedDataset);

  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Dataset Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
            🛰️ Dataset NASA:
          </label>
          <select 
            value={data.selectedDataset}
            onChange={(e) => onDatasetChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            {uniqueDatasets.map(dataset => (
              <option key={dataset} value={dataset}>{dataset}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
            📊 Parámetro:
          </label>
          <select 
            value={data.selectedParameter}
            onChange={(e) => onParameterChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '180px'
            }}
          >
            {parametersForDataset.map(item => (
              <option key={item.parameter} value={item.parameter}>
                {item.parameter} ({item.count} puntos)
              </option>
            ))}
          </select>
        </div>

        {/* NASA Layer Toggle for 2D view */}
        {viewMode === '2d' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox"
              checked={showNASALayer}
              onChange={(e) => onNASALayerToggle(e.target.checked)}
              id="nasa-layer"
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="nasa-layer" style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              🗺️ Mostrar datos en mapa 2D
            </label>
          </div>
        )}

        {/* Real-time stats */}
        <div style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          gap: '16px',
          alignItems: 'center'
        }}>
          {data.temperature !== null && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #bae6fd'
            }}>
              <span style={{ color: '#0369a1', fontWeight: '600' }}>
                🌡️ Temp. Puerto: {data.temperature}°C
              </span>
            </div>
          )}
          
          {data.spatialStats && !data.selectedDataPoint && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #bae6fd',
              fontSize: '13px'
            }}>
              <strong style={{ color: '#0284c7' }}>📈 Análisis Espacial (24h):</strong>
              <span style={{ marginLeft: '8px', color: '#0369a1' }}>
                Promedio: {data.spatialStats.avg_value?.toFixed(2)} | 
                Min: {data.spatialStats.min_value?.toFixed(2)} | 
                Max: {data.spatialStats.max_value?.toFixed(2)} |
                Puntos: {data.spatialStats.count}
              </span>
            </div>
          )}

          {data.selectedDataPoint && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              border: '1px solid #fcd34d'
            }}>
              <strong style={{ color: '#92400e' }}>🎯 Punto seleccionado:</strong>
              <span style={{ marginLeft: '8px', color: '#b45309' }}>
                Valor: {data.selectedDataPoint.value?.toFixed(2)} | 
                Tiempo: {new Date(data.selectedDataPoint.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ViewModeSelector({ 
  viewMode, 
  onViewModeChange 
}: { 
  viewMode: string, 
  onViewModeChange: (mode: string) => void 
}) {
  const viewModes = [
    { id: '2d', label: '🗺️ Vista 2D', description: 'Mapa tradicional MapLibre' },
    { id: '3d-scene', label: '🏗️ Escena 3D', description: 'Modelo 3D del puerto' },
    { id: '3d-analysis', label: '📊 Análisis 3D', description: 'Herramientas interactivas' },
    { id: '3d-geospatial', label: '🌍 Geoespacial 3D', description: 'Visualización deck.gl' },
    { id: '3d-temporal', label: '⏰ Temporal 3D', description: 'Análisis temporal inmersivo' }
  ];

  return (
    <div style={{
      padding: '12px 24px',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600', color: '#374151', marginRight: '12px' }}>
          🎛️ Modo de Visualización:
        </span>
        
        {viewModes.map(mode => (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: viewMode === mode.id ? '#3b82f6' : '#ffffff',
              color: viewMode === mode.id ? 'white' : '#374151',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              fontWeight: viewMode === mode.id ? '600' : '500'
            }}
            title={mode.description}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DashboardFooter({ viewMode, dataCount }: { viewMode: string, dataCount: number }) {
  const getViewModeDescription = (mode: string) => {
    switch(mode) {
      case '2d': return '2D MapLibre GL';
      case '3d-scene': return '3D Three.js + React Three Fiber';
      case '3d-analysis': return '3D Análisis Interactivo';
      case '3d-geospatial': return '3D Geoespacial deck.gl';
      case '3d-temporal': return '3D Temporal';
      default: return 'Desconocido';
    }
  };

  return (
    <div style={{
      padding: '12px 24px',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      fontSize: '13px',
      color: '#64748b'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>📡 Fuentes: NASA POWER API, MODIS, VIIRS, ESA, Sensores IoT locales</span>
          <span>📊 Puntos de datos: {dataCount}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>🔄 Actualización: Cada hora</span>
          <span>👁️ Vista activa: {getViewModeDescription(viewMode)}</span>
        </div>
      </div>
    </div>
  );
}