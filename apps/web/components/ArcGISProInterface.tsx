"use client";
import { useState, useRef, useEffect } from 'react';

interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'map' | 'edit' | 'analysis' | 'insert' | 'view';
  tooltip: string;
  action?: () => void;
}

interface ArcGISProInterfaceProps {
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onToolSelect: (tool: string) => void;
  selectedTool: string;
}

const tools: Tool[] = [
  // Map Navigation Tools
  { id: 'explore', name: 'Explorar', icon: '🗺️', category: 'map', tooltip: 'Navegar por el mapa' },
  { id: 'pan', name: 'Desplazar', icon: '✋', category: 'map', tooltip: 'Desplazar vista' },
  { id: 'zoom-in', name: 'Acercar', icon: '🔍', category: 'map', tooltip: 'Acercar zoom' },
  { id: 'zoom-out', name: 'Alejar', icon: '🔎', category: 'map', tooltip: 'Alejar zoom' },
  
  // Edit Tools
  { id: 'select', name: 'Seleccionar', icon: '👆', category: 'edit', tooltip: 'Seleccionar características' },
  { id: 'edit', name: 'Editar', icon: '✏️', category: 'edit', tooltip: 'Editar características' },
  { id: 'create-polygon', name: 'Polígono', icon: '⬟', category: 'edit', tooltip: 'Crear polígono' },
  { id: 'create-line', name: 'Línea', icon: '📏', category: 'edit', tooltip: 'Crear línea' },
  { id: 'create-point', name: 'Punto', icon: '📍', category: 'edit', tooltip: 'Crear punto' },
  
  // Analysis Tools
  { id: 'measure', name: 'Medir', icon: '📐', category: 'analysis', tooltip: 'Herramientas de medición' },
  { id: 'buffer', name: 'Buffer', icon: '⭕', category: 'analysis', tooltip: 'Análisis de buffer' },
  { id: 'intersect', name: 'Intersectar', icon: '⚡', category: 'analysis', tooltip: 'Análisis de intersección' },
  { id: 'statistics', name: 'Estadísticas', icon: '📊', category: 'analysis', tooltip: 'Estadísticas espaciales' },
  
  // Insert Tools
  { id: 'add-building', name: 'Edificio', icon: '🏢', category: 'insert', tooltip: 'Insertar edificio' },
  { id: 'add-road', name: 'Carretera', icon: '🛣️', category: 'insert', tooltip: 'Insertar carretera' },
  { id: 'add-vegetation', name: 'Vegetación', icon: '🌳', category: 'insert', tooltip: 'Insertar vegetación' },
  { id: 'add-water', name: 'Agua', icon: '💧', category: 'insert', tooltip: 'Insertar cuerpo de agua' },
  
  // View Tools
  { id: 'layers', name: 'Capas', icon: '📋', category: 'view', tooltip: 'Panel de capas' },
  { id: 'symbology', name: 'Simbología', icon: '🎨', category: 'view', tooltip: 'Controles de simbología' },
  { id: 'attributes', name: 'Atributos', icon: '📑', category: 'view', tooltip: 'Tabla de atributos' },
  { id: 'bookmarks', name: 'Marcadores', icon: '🔖', category: 'view', tooltip: 'Marcadores espaciales' }
];

export function ArcGISProInterface({ 
  viewMode, 
  onViewModeChange, 
  onToolSelect, 
  selectedTool 
}: ArcGISProInterfaceProps) {
  const [activeCategory, setActiveCategory] = useState<string>('map');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const categories = [
    { id: 'map', name: 'Mapa', icon: '🗺️' },
    { id: 'edit', name: 'Editar', icon: '✏️' },
    { id: 'analysis', name: 'Análisis', icon: '📊' },
    { id: 'insert', name: 'Insertar', icon: '➕' },
    { id: 'view', name: 'Vista', icon: '👁️' }
  ];

  const handleMouseEnter = (toolId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.bottom + 5 
    });
    setShowTooltip(toolId);
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: 1000,
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
      borderBottom: '1px solid #dee2e6',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Top Menu Bar */}
      <div style={{
        height: '40px',
        background: '#212529',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: '600', marginRight: '24px' }}>
          🛰️ Gemelo Digital de Chancay
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <span>Archivo</span>
          <span>Proyecto</span>
          <span>Mapa</span>
          <span>Insertar</span>
          <span>Análisis</span>
          <span>Vista</span>
          <span>Editar</span>
          <span>Datos</span>
          <span>Imagen</span>
          <span>Ayuda</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            Estado: ✅ Operativo
          </span>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div style={{
        height: '50px',
        background: '#495057',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px'
      }}>
        <div style={{ 
          display: 'flex', 
          background: '#343a40',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => onViewModeChange('2d')}
            style={{
              padding: '8px 16px',
              background: viewMode === '2d' ? '#007bff' : 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🗺️ Vista 2D
          </button>
          <button
            onClick={() => onViewModeChange('3d')}
            style={{
              padding: '8px 16px',
              background: viewMode === '3d' ? '#007bff' : 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🌍 Vista 3D
          </button>
        </div>
        
        <div style={{ marginLeft: '24px', color: '#adb5bd', fontSize: '13px' }}>
          Coordenadas: -77.608, -11.084 | Escala: 1:10,000 | Proyección: WGS84
        </div>
      </div>

      {/* Tool Categories */}
      <div style={{
        height: '44px',
        background: '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #ced4da'
      }}>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            style={{
              padding: '8px 16px',
              background: activeCategory === category.id ? '#007bff' : 'transparent',
              color: activeCategory === category.id ? 'white' : '#495057',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: '4px'
            }}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Tool Ribbon */}
      <div style={{
        height: '80px',
        background: '#f8f9fa',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflowX: 'auto'
      }}>
        {tools.filter(tool => tool.category === activeCategory).map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            onMouseEnter={(e) => {
              handleMouseEnter(tool.id, e);
              if (selectedTool !== tool.id) {
                (e.currentTarget as HTMLElement).style.background = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              handleMouseLeave();
              if (selectedTool !== tool.id) {
                (e.currentTarget as HTMLElement).style.background = 'white';
              }
            }}
            style={{
              width: '64px',
              height: '64px',
              background: selectedTool === tool.id ? '#007bff' : 'white',
              color: selectedTool === tool.id ? 'white' : '#495057',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              fontSize: '11px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '20px' }}>{tool.icon}</div>
            <div style={{ textAlign: 'center', lineHeight: '1.1' }}>
              {tool.name}
            </div>
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            background: '#212529',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {tools.find(t => t.id === showTooltip)?.tooltip}
        </div>
      )}
    </div>
  );
}

// Professional Layer Panel Component
interface LayerPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function LayerPanel({ isVisible, onClose }: LayerPanelProps) {
  const [layers, setLayers] = useState([
    { id: 'satellite', name: 'Imagen Satelital', visible: true, opacity: 1.0, type: 'raster' },
    { id: 'buildings', name: 'Edificios', visible: true, opacity: 0.8, type: 'vector' },
    { id: 'roads', name: 'Carreteras', visible: true, opacity: 1.0, type: 'vector' },
    { id: 'vegetation', name: 'Vegetación', visible: false, opacity: 0.7, type: 'vector' },
    { id: 'water', name: 'Cuerpos de Agua', visible: true, opacity: 0.9, type: 'vector' },
    { id: 'nasa-data', name: 'Datos NASA', visible: false, opacity: 0.6, type: 'raster' }
  ]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '218px',
      right: '16px',
      width: '320px',
      background: 'white',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      <div style={{
        padding: '12px 16px',
        background: '#f8f9fa',
        borderBottom: '1px solid #ced4da',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          📋 Panel de Capas
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '12px' }}>
        {layers.map(layer => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
              marginBottom: '6px',
              background: '#fdfdfd'
            }}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(e) => {
                setLayers(prev => prev.map(l => 
                  l.id === layer.id ? { ...l, visible: e.target.checked } : l
                ));
              }}
              style={{ margin: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
                {layer.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                {layer.type} • Opacidad: {Math.round(layer.opacity * 100)}%
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layer.opacity}
              onChange={(e) => {
                setLayers(prev => prev.map(l => 
                  l.id === layer.id ? { ...l, opacity: parseFloat(e.target.value) } : l
                ));
              }}
              style={{ width: '60px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}