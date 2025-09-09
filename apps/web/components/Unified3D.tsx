"use client";
import { useState, Suspense, lazy } from 'react';

// Lazy load all 3D components
const Scene3D = lazy(() => import('./Scene3D'));
const Analysis3D = lazy(() => import('./Analysis3D'));
const DeckGL3D = lazy(() => import('./DeckGL3D'));
const Temporal3D = lazy(() => import('./Temporal3D'));
const CityEngine3D = lazy(() => import('./CityEngine3DPolished'));

type Tool3D = 'scene' | 'analysis' | 'geospatial' | 'temporal' | 'city-engine';

interface Unified3DProps {
  data: any[];
  parameter: string;
  dataset: string;
  onPointSelect?: (point: any) => void;
}

export default function Unified3D({ data, parameter, dataset, onPointSelect }: Unified3DProps) {
  const [activeTool, setActiveTool] = useState<Tool3D>('scene');

  const tools = [
    { id: 'scene' as Tool3D, label: '🏗️ Escena 3D', description: 'Modelo 3D del puerto' },
    { id: 'analysis' as Tool3D, label: '📊 Análisis 3D', description: 'Herramientas interactivas' },
    { id: 'geospatial' as Tool3D, label: '🌍 Geoespacial 3D', description: 'Visualización deck.gl' },
    { id: 'temporal' as Tool3D, label: '⏰ Temporal 3D', description: 'Análisis temporal inmersivo' },
    { id: 'city-engine' as Tool3D, label: '🏙️ City Engine', description: 'Planificación urbana procedural' }
  ];

  const renderActiveTool = () => {
    const commonProps = { data, parameter, dataset };
    
    switch (activeTool) {
      case 'scene':
        return <Scene3D {...commonProps} />;
      case 'analysis':
        return <Analysis3D {...commonProps} onPointSelect={onPointSelect} />;
      case 'geospatial':
        return <DeckGL3D {...commonProps} />;
      case 'temporal':
        return <Temporal3D {...commonProps} />;
      case 'city-engine':
        return <CityEngine3D />;
      default:
        return <Scene3D {...commonProps} />;
    }
  };

  const getLoadingMessage = () => {
    switch (activeTool) {
      case 'scene':
        return '🏗️ Cargando vista 3D del puerto...';
      case 'analysis':
        return '📊 Cargando herramientas de análisis...';
      case 'geospatial':
        return '🌍 Cargando visualización geoespacial...';
      case 'temporal':
        return '⏰ Cargando análisis temporal...';
      case 'city-engine':
        return '🚀 Cargando City Engine Profesional Avanzado...';
      default:
        return '🔄 Cargando herramientas 3D...';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 3D Tools Selector */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: '600', color: '#374151', marginRight: '12px' }}>
          🛠️ Herramientas 3D:
        </span>
        
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: activeTool === tool.id ? '#3b82f6' : '#ffffff',
              color: activeTool === tool.id ? 'white' : '#374151',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              fontWeight: activeTool === tool.id ? '600' : '500'
            }}
            title={tool.description}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* 3D Content Area */}
      <div className="flex-1">
        <Suspense fallback={
          <div className="loading-overlay">
            <div className="loading">{getLoadingMessage()}</div>
            {activeTool === 'city-engine' && (
              <div className="loading-details">Inicializando tecnologías de planificación urbana de última generación</div>
            )}
          </div>
        }>
          {renderActiveTool()}
        </Suspense>
      </div>
    </div>
  );
}