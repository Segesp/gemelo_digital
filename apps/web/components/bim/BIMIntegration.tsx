"use client";
import { useState } from 'react';

// BIM Integration for industry-standard formats
export function BIMIntegration() {
  const [supportedFormats] = useState([
    { name: 'IFC', description: 'Industry Foundation Classes', icon: '🏗️' },
    { name: 'DXF', description: 'AutoCAD Drawing Exchange', icon: '📐' },
    { name: 'GLTF', description: '3D Scene Format', icon: '🎨' },
    { name: 'FBX', description: 'Autodesk 3D Format', icon: '🔧' },
    { name: 'COLLADA', description: 'Collaborative 3D Asset', icon: '🌐' }
  ]);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      top: '140px',
      left: '20px',
      width: isExpanded ? '350px' : '60px',
      height: isExpanded ? '300px' : '60px',
      background: 'rgba(0,0,0,0.9)',
      borderRadius: '15px',
      color: 'white',
      transition: 'all 0.3s ease',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          width: '30px',
          height: '30px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '50%',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        🏗️
      </button>

      {isExpanded && (
        <div style={{ padding: '60px 20px 20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>
            🏗️ Integración BIM
          </div>

          <div style={{ marginBottom: '20px', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Formatos Soportados:
            </div>
            
            {supportedFormats.map(format => (
              <div key={format.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                marginBottom: '5px'
              }}>
                <span style={{ fontSize: '16px' }}>{format.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{format.name}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>
                    {format.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button style={{
              background: 'rgba(74,222,128,0.2)',
              border: '1px solid rgba(74,222,128,0.4)',
              borderRadius: '6px',
              color: 'white',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '11px'
            }}>
              📥 Importar
            </button>
            
            <button style={{
              background: 'rgba(96,165,250,0.2)',
              border: '1px solid rgba(96,165,250,0.4)',
              borderRadius: '6px',
              color: 'white',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '11px'
            }}>
              📤 Exportar
            </button>
          </div>

          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(102,126,234,0.1)',
            borderRadius: '6px',
            fontSize: '10px',
            border: '1px solid rgba(102,126,234,0.2)'
          }}>
            💡 <strong>Tip:</strong> Integración completa con software CAD profesional
          </div>
        </div>
      )}
    </div>
  );
}