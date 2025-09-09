"use client";
import { useState, useEffect } from 'react';
import proj4 from 'proj4';

// Define common coordinate systems for Peru/South America
const COORDINATE_SYSTEMS = {
  'WGS84': {
    name: 'WGS 84 (Geographic)',
    code: 'EPSG:4326',
    proj4def: '+proj=longlat +datum=WGS84 +no_defs',
    units: 'degrees',
    description: 'Sistema de coordenadas geográficas mundial'
  },
  'WGS84_WEB_MERCATOR': {
    name: 'WGS 84 / Pseudo-Mercator',
    code: 'EPSG:3857',
    proj4def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
    units: 'meters',
    description: 'Sistema usado por Google Maps, OpenStreetMap'
  },
  'PERU_UTM_18S': {
    name: 'PSAD56 / UTM Zone 18S',
    code: 'EPSG:24878',
    proj4def: '+proj=utm +zone=18 +south +datum=PSAD56 +units=m +no_defs',
    units: 'meters',
    description: 'Sistema UTM para Perú (zona 18S)'
  },
  'PERU_UTM_19S': {
    name: 'PSAD56 / UTM Zone 19S', 
    code: 'EPSG:24879',
    proj4def: '+proj=utm +zone=19 +south +datum=PSAD56 +units=m +no_defs',
    units: 'meters',
    description: 'Sistema UTM para Perú (zona 19S)'
  },
  'WGS84_UTM_18S': {
    name: 'WGS 84 / UTM Zone 18S',
    code: 'EPSG:32718',
    proj4def: '+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs',
    units: 'meters',
    description: 'Sistema UTM WGS84 para Perú (zona 18S)'
  },
  'WGS84_UTM_19S': {
    name: 'WGS 84 / UTM Zone 19S',
    code: 'EPSG:32719',
    proj4def: '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs',
    units: 'meters',
    description: 'Sistema UTM WGS84 para Perú (zona 19S)'
  }
};

interface CoordinateSystemManagerProps {
  isVisible: boolean;
  onClose: () => void;
  currentCoordinates: { lat: number; lng: number };
  onCoordinateSystemChange: (systemCode: string) => void;
  currentSystem: string;
}

interface ConvertedCoordinate {
  system: string;
  x: number;
  y: number;
  formatted: string;
}

export function CoordinateSystemManager({ 
  isVisible, 
  onClose, 
  currentCoordinates, 
  onCoordinateSystemChange,
  currentSystem 
}: CoordinateSystemManagerProps) {
  const [inputCoordinates, setInputCoordinates] = useState('');
  const [sourceSystem, setSourceSystem] = useState('WGS84');
  const [targetSystem, setTargetSystem] = useState('PERU_UTM_18S');
  const [convertedCoordinates, setConvertedCoordinates] = useState<ConvertedCoordinate[]>([]);
  const [conversionResult, setConversionResult] = useState<{ x: number; y: number } | null>(null);

  // Initialize proj4 definitions
  useEffect(() => {
    Object.values(COORDINATE_SYSTEMS).forEach(system => {
      proj4.defs(system.code, system.proj4def);
    });
  }, []);

  // Format coordinates for display
  const formatCoordinate = (x: number, y: number, system: string): string => {
    const sysInfo = Object.values(COORDINATE_SYSTEMS).find(s => s.code === system);
    
    if (sysInfo?.units === 'degrees') {
      // Format as DMS for geographic coordinates
      const formatDMS = (decimal: number, isLatitude: boolean): string => {
        const abs = Math.abs(decimal);
        const degrees = Math.floor(abs);
        const minutes = Math.floor((abs - degrees) * 60);
        const seconds = Math.round(((abs - degrees) * 60 - minutes) * 60 * 100) / 100;
        
        const direction = decimal >= 0 ? 
          (isLatitude ? 'N' : 'E') : 
          (isLatitude ? 'S' : 'W');
        
        return `${degrees}°${minutes}'${seconds}"${direction}`;
      };
      
      return `${formatDMS(y, true)}, ${formatDMS(x, false)}`;
    } else {
      // Format as metric coordinates
      return `X: ${x.toFixed(2)}m, Y: ${y.toFixed(2)}m`;
    }
  };

  // Convert current coordinates to all systems
  useEffect(() => {
    if (!currentCoordinates) return;

    const converted: ConvertedCoordinate[] = [];

    Object.entries(COORDINATE_SYSTEMS).forEach(([key, system]) => {
      try {
        const result = proj4('EPSG:4326', system.code, [currentCoordinates.lng, currentCoordinates.lat]);
        
        converted.push({
          system: system.name,
          x: result[0],
          y: result[1],
          formatted: formatCoordinate(result[0], result[1], system.code)
        });
      } catch (error) {
        console.warn(`Error converting to ${system.name}:`, error);
      }
    });

    setConvertedCoordinates(converted);
  }, [currentCoordinates]);

  // Convert user input coordinates
  const convertInputCoordinates = () => {
    if (!inputCoordinates.trim()) return;

    try {
      // Parse input coordinates (assume comma-separated x,y or lng,lat)
      const parts = inputCoordinates.split(',').map(s => parseFloat(s.trim()));
      if (parts.length !== 2 || parts.some(isNaN)) {
        alert('Formato inválido. Use: x,y o lng,lat');
        return;
      }

      const [x, y] = parts;
      const sourceCode = COORDINATE_SYSTEMS[sourceSystem as keyof typeof COORDINATE_SYSTEMS].code;
      const targetCode = COORDINATE_SYSTEMS[targetSystem as keyof typeof COORDINATE_SYSTEMS].code;
      
      const result = proj4(sourceCode, targetCode, [x, y]);
      setConversionResult({ x: result[0], y: result[1] });
    } catch (error) {
      alert('Error en la conversión: ' + error);
    }
  };

  // Copy coordinates to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 1001
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f9fafb',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          🌐 Sistemas de Coordenadas
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '4px 8px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Current Position Display */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            📍 Coordenadas Actuales
          </h3>
          <div style={{
            background: '#f3f4f6',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Sistema actual: {COORDINATE_SYSTEMS[currentSystem as keyof typeof COORDINATE_SYSTEMS]?.name || currentSystem}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              Lat: {currentCoordinates.lat.toFixed(6)}, Lng: {currentCoordinates.lng.toFixed(6)}
            </div>
          </div>

          {/* Conversions Table */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {convertedCoordinates.map((coord, index) => (
              <div 
                key={index}
                style={{
                  padding: '8px 12px',
                  borderBottom: index < convertedCoordinates.length - 1 ? '1px solid #e5e7eb' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {coord.system}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {coord.formatted}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${coord.x},${coord.y}`)}
                  style={{
                    padding: '2px 6px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                  title="Copiar coordenadas"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coordinate Conversion Tool */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            🔄 Convertir Coordenadas
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                Sistema origen:
              </label>
              <select
                value={sourceSystem}
                onChange={(e) => setSourceSystem(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {Object.entries(COORDINATE_SYSTEMS).map(([key, system]) => (
                  <option key={key} value={key}>{system.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                Sistema destino:
              </label>
              <select
                value={targetSystem}
                onChange={(e) => setTargetSystem(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {Object.entries(COORDINATE_SYSTEMS).map(([key, system]) => (
                  <option key={key} value={key}>{system.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Coordenadas (x,y o lng,lat):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputCoordinates}
                onChange={(e) => setInputCoordinates(e.target.value)}
                placeholder="Ej: -77.0428, -12.0464"
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <button
                onClick={convertInputCoordinates}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Convertir
              </button>
            </div>
          </div>

          {conversionResult && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '4px' }}>
                Resultado de conversión:
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'monospace' }}>
                X: {conversionResult.x.toFixed(6)}, Y: {conversionResult.y.toFixed(6)}
              </div>
              <button
                onClick={() => copyToClipboard(`${conversionResult.x},${conversionResult.y}`)}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                📋 Copiar resultado
              </button>
            </div>
          )}
        </div>

        {/* System Information */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            ℹ️ Información del Sistema
          </h3>
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px'
          }}>
            {Object.entries(COORDINATE_SYSTEMS).map(([key, system]) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                  {system.name} ({system.code})
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                  {system.description}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                  {system.proj4def}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinateSystemManager;