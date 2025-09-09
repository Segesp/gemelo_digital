"use client";
import { useState } from 'react';

interface ContentPaneProps {
  isVisible: boolean;
  onClose: () => void;
  activePane: string;
  onPaneChange: (pane: string) => void;
}

interface LayerItem {
  id: string;
  name: string;
  type: 'feature' | 'raster' | 'group';
  visible: boolean;
  opacity: number;
  expanded?: boolean;
  children?: LayerItem[];
  symbology?: {
    type: 'simple' | 'categorized' | 'graduated';
    color: string;
    size?: number;
  };
}

interface AnalysisTool {
  id: string;
  name: string;
  category: 'proximity' | 'overlay' | 'statistics' | 'raster';
  icon: string;
  description: string;
}

const mockLayers: LayerItem[] = [
  {
    id: 'puerto',
    name: 'Puerto de Chancay',
    type: 'group',
    visible: true,
    opacity: 1.0,
    expanded: true,
    children: [
      {
        id: 'edificios',
        name: 'Edificios',
        type: 'feature',
        visible: true,
        opacity: 0.8,
        symbology: { type: 'simple', color: '#1976d2', size: 12 }
      },
      {
        id: 'carreteras',
        name: 'Carreteras',
        type: 'feature',
        visible: true,
        opacity: 1.0,
        symbology: { type: 'simple', color: '#424242' }
      },
      {
        id: 'muelles',
        name: 'Muelles',
        type: 'feature',
        visible: true,
        opacity: 1.0,
        symbology: { type: 'simple', color: '#795548' }
      }
    ]
  },
  {
    id: 'satelital',
    name: 'Imagen Satelital',
    type: 'raster',
    visible: true,
    opacity: 1.0
  },
  {
    id: 'nasa-data',
    name: 'Datos NASA',
    type: 'group',
    visible: false,
    opacity: 0.7,
    expanded: false,
    children: [
      {
        id: 'temperatura',
        name: 'Temperatura Superficial',
        type: 'raster',
        visible: false,
        opacity: 0.6
      },
      {
        id: 'precipitacion',
        name: 'Precipitación',
        type: 'raster',
        visible: false,
        opacity: 0.5
      }
    ]
  }
];

const analysisTools: AnalysisTool[] = [
  {
    id: 'buffer',
    name: 'Análisis de Buffer',
    category: 'proximity',
    icon: '⭕',
    description: 'Crear zonas de influencia alrededor de características'
  },
  {
    id: 'intersect',
    name: 'Intersección',
    category: 'overlay',
    icon: '⚡',
    description: 'Encontrar áreas de superposición entre capas'
  },
  {
    id: 'union',
    name: 'Unión',
    category: 'overlay',
    icon: '🔗',
    description: 'Combinar características de múltiples capas'
  },
  {
    id: 'clip',
    name: 'Recortar',
    category: 'overlay',
    icon: '✂️',
    description: 'Recortar características usando una capa de límite'
  },
  {
    id: 'statistics',
    name: 'Estadísticas Zonales',
    category: 'statistics',
    icon: '📊',
    description: 'Calcular estadísticas por zonas geográficas'
  },
  {
    id: 'density',
    name: 'Análisis de Densidad',
    category: 'statistics',
    icon: '🔥',
    description: 'Calcular densidades de puntos o líneas'
  }
];

export function ContentPane({ isVisible, onClose, activePane, onPaneChange }: ContentPaneProps) {
  const [layers, setLayers] = useState<LayerItem[]>(mockLayers);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isVisible) return null;

  const panes = [
    { id: 'contents', name: 'Contenido', icon: '📋' },
    { id: 'catalog', name: 'Catálogo', icon: '📂' },
    { id: 'geoprocessing', name: 'Geoprocesamiento', icon: '⚙️' },
    { id: 'history', name: 'Historial', icon: '📜' },
    { id: 'favorites', name: 'Favoritos', icon: '⭐' }
  ];

  const toggleLayerVisibility = (layerId: string, parentId?: string) => {
    setLayers(prev => prev.map(layer => {
      if (parentId && layer.id === parentId) {
        return {
          ...layer,
          children: layer.children?.map(child =>
            child.id === layerId ? { ...child, visible: !child.visible } : child
          )
        };
      } else if (layer.id === layerId) {
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    }));
  };

  const toggleLayerExpansion = (layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, expanded: !layer.expanded } : layer
    ));
  };

  const renderLayerItem = (layer: LayerItem, parentId?: string, depth = 0) => {
    const hasChildren = layer.children && layer.children.length > 0;
    const indent = depth * 16;

    return (
      <div key={layer.id}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            paddingLeft: `${8 + indent}px`,
            background: selectedLayer === layer.id ? '#e3f2fd' : 'transparent',
            cursor: 'pointer',
            borderRadius: '2px',
            margin: '1px 0'
          }}
          onClick={() => setSelectedLayer(layer.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerExpansion(layer.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                marginRight: '4px',
                fontSize: '10px'
              }}
            >
              {layer.expanded ? '▼' : '▶'}
            </button>
          )}
          
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={(e) => {
              e.stopPropagation();
              toggleLayerVisibility(layer.id, parentId);
            }}
            style={{ marginRight: '6px', marginLeft: hasChildren ? '0' : '16px' }}
          />
          
          <div style={{ 
            width: '12px', 
            height: '12px', 
            marginRight: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {layer.type === 'group' ? '📁' : 
             layer.type === 'raster' ? '🖼️' : '🔷'}
          </div>
          
          <span style={{ 
            fontSize: '13px', 
            flex: 1,
            fontWeight: selectedLayer === layer.id ? '500' : 'normal'
          }}>
            {layer.name}
          </span>
          
          {layer.symbology && (
            <div
              style={{
                width: '16px',
                height: '16px',
                background: layer.symbology.color,
                borderRadius: layer.symbology.type === 'simple' ? '2px' : '50%',
                marginLeft: '8px',
                border: '1px solid #ccc'
              }}
            />
          )}
        </div>
        
        {hasChildren && layer.expanded && layer.children?.map(child =>
          renderLayerItem(child, layer.id, depth + 1)
        )}
      </div>
    );
  };

  const renderContentsPane = () => (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Buscar capas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>
      
      <div>
        <h4 style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#6c757d', 
          margin: '0 0 8px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Capas del Mapa
        </h4>
        
        {layers.map(layer => renderLayerItem(layer))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button
          style={{
            width: '100%',
            padding: '8px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          + Agregar Datos
        </button>
      </div>
    </div>
  );

  const renderGeoprocessingPane = () => (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Buscar herramientas..."
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        />
      </div>
      
      <h4 style={{ 
        fontSize: '12px', 
        fontWeight: '600', 
        color: '#6c757d', 
        margin: '0 0 12px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Herramientas de Análisis
      </h4>
      
      {Object.entries(
        analysisTools.reduce((acc, tool) => {
          if (!acc[tool.category]) acc[tool.category] = [];
          acc[tool.category].push(tool);
          return acc;
        }, {} as Record<string, AnalysisTool[]>)
      ).map(([category, tools]) => (
        <div key={category} style={{ marginBottom: '16px' }}>
          <h5 style={{ 
            fontSize: '11px', 
            fontWeight: '500', 
            color: '#495057', 
            margin: '0 0 6px 0',
            textTransform: 'capitalize'
          }}>
            {category === 'proximity' ? 'Proximidad' :
             category === 'overlay' ? 'Superposición' :
             category === 'statistics' ? 'Estadísticas' : 'Ráster'}
          </h5>
          
          {tools.map(tool => (
            <div
              key={tool.id}
              style={{
                padding: '6px 8px',
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                marginBottom: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'white';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '2px'
              }}>
                <span style={{ fontSize: '14px' }}>{tool.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>
                  {tool.name}
                </span>
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#6c757d',
                marginLeft: '22px'
              }}>
                {tool.description}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderActivePane = () => {
    switch (activePane) {
      case 'contents':
        return renderContentsPane();
      case 'geoprocessing':
        return renderGeoprocessingPane();
      case 'catalog':
        return (
          <div style={{ padding: '12px', textAlign: 'center', color: '#6c757d' }}>
            <p>📂 Catálogo de Datos</p>
            <p style={{ fontSize: '12px' }}>Aquí aparecerán las fuentes de datos disponibles</p>
          </div>
        );
      case 'history':
        return (
          <div style={{ padding: '12px', textAlign: 'center', color: '#6c757d' }}>
            <p>📜 Historial de Geoprocesamiento</p>
            <p style={{ fontSize: '12px' }}>Registro de operaciones realizadas</p>
          </div>
        );
      case 'favorites':
        return (
          <div style={{ padding: '12px', textAlign: 'center', color: '#6c757d' }}>
            <p>⭐ Herramientas Favoritas</p>
            <p style={{ fontSize: '12px' }}>Accesos rápidos a herramientas frecuentes</p>
          </div>
        );
      default:
        return renderContentsPane();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '218px',
      left: '16px',
      width: '360px',
      height: 'calc(100vh - 246px)',
      background: 'white',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Tabs */}
      <div style={{
        background: '#f8f9fa',
        borderBottom: '1px solid #ced4da',
        borderRadius: '6px 6px 0 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            Panel de Contenido
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '2px'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {panes.map(pane => (
            <button
              key={pane.id}
              onClick={() => onPaneChange(pane.id)}
              style={{
                padding: '8px 12px',
                background: activePane === pane.id ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activePane === pane.id ? '2px solid #007bff' : '2px solid transparent',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                color: activePane === pane.id ? '#007bff' : '#6c757d'
              }}
            >
              <span style={{ fontSize: '12px' }}>{pane.icon}</span>
              {pane.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        background: '#fdfdfd'
      }}>
        {renderActivePane()}
      </div>
    </div>
  );
}