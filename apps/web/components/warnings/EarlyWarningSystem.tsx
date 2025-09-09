"use client";
import { useState, useEffect } from 'react';

interface Warning {
  id: string;
  type: 'earthquake' | 'flood' | 'landslide' | 'tsunami' | 'air-quality' | 'heat-wave';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  probability: number; // 0-100
  timeframe: string;
  affectedPopulation: number;
  recommendations: string[];
  timestamp: string;
  source: string;
  status: 'active' | 'monitoring' | 'resolved';
}

interface EarlyWarningProps {
  isVisible: boolean;
  onClose: () => void;
}

export function EarlyWarningSystem({ isVisible, onClose }: EarlyWarningProps) {
  const [activeWarnings, setActiveWarnings] = useState<Warning[]>([]);
  const [selectedWarning, setSelectedWarning] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockWarnings: Warning[] = [
      {
        id: 'ew-001',
        type: 'earthquake',
        severity: 'medium',
        title: 'Incremento en Actividad Sísmica',
        description: 'Detectado aumento en microsismos en la zona sur de Lima. Monitoreo continuo activo.',
        location: 'Distrito de Villa El Salvador - San Bartolo',
        coordinates: [-77.025, -12.215],
        probability: 35,
        timeframe: 'Próximas 72 horas',
        affectedPopulation: 85000,
        recommendations: [
          'Verificar plan de evacuación familiar',
          'Mantener kit de emergencia preparado',
          'Identificar zonas seguras en edificaciones'
        ],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source: 'IGP - Instituto Geofísico del Perú',
        status: 'active'
      },
      {
        id: 'ew-002',
        type: 'flood',
        severity: 'high',
        title: 'Riesgo de Huaicos en Quebradas',
        description: 'Condiciones meteorológicas favorables para formación de huaicos en quebradas de Chosica.',
        location: 'Distrito de Lurigancho-Chosica',
        coordinates: [-76.708, -11.942],
        probability: 78,
        timeframe: 'Próximas 24-48 horas',
        affectedPopulation: 42000,
        recommendations: [
          'Evitar transitar por quebradas secas',
          'Mantenerse alerta a avisos municipales',
          'Preparar rutas de evacuación hacia zonas altas',
          'Asegurar suministros de agua y alimentos'
        ],
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        source: 'SENAMHI - Servicio Nacional de Meteorología',
        status: 'active'
      },
      {
        id: 'ew-003',
        type: 'air-quality',
        severity: 'critical',
        title: 'Calidad del Aire Peligrosa',
        description: 'Niveles de PM2.5 superan los límites seguros. Condiciones atmosféricas desfavorables.',
        location: 'Centro de Lima - La Victoria',
        coordinates: [-77.028, -12.046],
        probability: 95,
        timeframe: 'Próximas 12 horas',
        affectedPopulation: 320000,
        recommendations: [
          'Evitar actividades al aire libre',
          'Usar mascarillas N95 si debe salir',
          'Mantener ventanas cerradas',
          'Grupos sensibles deben permanecer en interiores'
        ],
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        source: 'DIGESA - Dirección General de Salud Ambiental',
        status: 'active'
      },
      {
        id: 'ew-004',
        type: 'heat-wave',
        severity: 'medium',
        title: 'Ola de Calor Extremo',
        description: 'Temperaturas superiores a 32°C esperadas. Incremento del efecto isla de calor urbana.',
        location: 'Distritos de San Juan de Lurigancho - Ate',
        coordinates: [-76.985, -12.135],
        probability: 85,
        timeframe: 'Próximos 5 días',
        affectedPopulation: 180000,
        recommendations: [
          'Mantenerse hidratado constantemente',
          'Evitar exposición solar entre 11am-4pm',
          'Buscar espacios con aire acondicionado',
          'Atención especial a adultos mayores y niños'
        ],
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        source: 'SENAMHI - Análisis de Temperatura Superficial LST',
        status: 'monitoring'
      },
      {
        id: 'ew-005',
        type: 'landslide',
        severity: 'low',
        title: 'Inestabilidad de Taludes',
        description: 'Detectada saturación de suelos en laderas. Riesgo bajo pero requiere monitoreo.',
        location: 'Distrito de San Juan de Miraflores',
        coordinates: [-77.015, -12.158],
        probability: 25,
        timeframe: 'Próximas 2 semanas',
        affectedPopulation: 12000,
        recommendations: [
          'Reportar grietas o movimientos de suelo',
          'Evitar construcciones en laderas',
          'Mantener drenajes libres de obstrucciones'
        ],
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        source: 'INGEMMET - Instituto Geológico Minero y Metalúrgico',
        status: 'monitoring'
      }
    ];

    setActiveWarnings(mockWarnings);
  }, []);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'earthquake': return '🌍';
      case 'flood': return '🌊';
      case 'landslide': return '⛰️';
      case 'tsunami': return '🌊';
      case 'air-quality': return '💨';
      case 'heat-wave': return '🌡️';
      default: return '⚠️';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'earthquake': return 'Sismo';
      case 'flood': return 'Inundación';
      case 'landslide': return 'Deslizamiento';
      case 'tsunami': return 'Tsunami';
      case 'air-quality': return 'Calidad del Aire';
      case 'heat-wave': return 'Ola de Calor';
      default: return 'Alerta';
    }
  };

  const filteredWarnings = activeWarnings.filter(warning => {
    if (filterSeverity !== 'all' && warning.severity !== filterSeverity) return false;
    if (filterType !== 'all' && warning.type !== filterType) return false;
    return true;
  });

  const selectedWarningData = activeWarnings.find(w => w.id === selectedWarning);

  const severityCounts = {
    critical: activeWarnings.filter(w => w.severity === 'critical').length,
    high: activeWarnings.filter(w => w.severity === 'high').length,
    medium: activeWarnings.filter(w => w.severity === 'medium').length,
    low: activeWarnings.filter(w => w.severity === 'low').length
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.8)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '95%',
        height: '90%',
        maxWidth: '1400px',
        maxHeight: '900px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              🚨 Sistema de Alerta Temprana
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Monitoreo en tiempo real de riesgos y desastres naturales
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px'
            }}>
              🔴 {severityCounts.critical + severityCounts.high} Alertas Activas
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Alert Summary Bar */}
        <div style={{
          background: '#fef2f2',
          padding: '12px 24px',
          borderBottom: '1px solid #fecaca',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          {[
            { severity: 'critical', label: 'Críticas', count: severityCounts.critical },
            { severity: 'high', label: 'Altas', count: severityCounts.high },
            { severity: 'medium', label: 'Medias', count: severityCounts.medium },
            { severity: 'low', label: 'Bajas', count: severityCounts.low }
          ].map(item => (
            <div key={item.severity} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getSeverityColor(item.severity)
              }} />
              <span style={{ color: getSeverityColor(item.severity) }}>
                {item.count} {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: '#f8fafc',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
              Severidad
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px'
              }}
            >
              <option value="all">Todas</option>
              <option value="critical">Críticas</option>
              <option value="high">Altas</option>
              <option value="medium">Medias</option>
              <option value="low">Bajas</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
              Tipo de Amenaza
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px'
              }}
            >
              <option value="all">Todos</option>
              <option value="earthquake">Sismos</option>
              <option value="flood">Inundaciones</option>
              <option value="landslide">Deslizamientos</option>
              <option value="air-quality">Calidad del Aire</option>
              <option value="heat-wave">Olas de Calor</option>
            </select>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              🔄 Actualizar Datos
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Warnings List */}
          <div style={{
            width: '400px',
            background: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Alertas Activas ({filteredWarnings.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredWarnings.map(warning => (
                  <button
                    key={warning.id}
                    onClick={() => setSelectedWarning(warning.id)}
                    style={{
                      background: selectedWarning === warning.id ? 'white' : 'white',
                      border: selectedWarning === warning.id 
                        ? `2px solid ${getSeverityColor(warning.severity)}` 
                        : '1px solid #e2e8f0',
                      borderLeft: `4px solid ${getSeverityColor(warning.severity)}`,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left',
                      boxShadow: selectedWarning === warning.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {/* Warning Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>{getTypeIcon(warning.type)}</span>
                        <span style={{ 
                          fontSize: '10px',
                          background: `${getSeverityColor(warning.severity)}20`,
                          color: getSeverityColor(warning.severity),
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: '600'
                        }}>
                          {warning.severity.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>
                        {new Date(warning.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Warning Content */}
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600' }}>
                      {warning.title}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
                      {warning.description}
                    </p>
                    
                    {/* Warning Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#374151' }}>
                        📍 {warning.location}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '500', color: getSeverityColor(warning.severity) }}>
                        {warning.probability}% probabilidad
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Warning Details */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {selectedWarningData ? (
              <>
                {/* Warning Details */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                      {getTypeIcon(selectedWarningData.type)} {selectedWarningData.title}
                    </h3>
                    <span style={{ 
                      fontSize: '12px',
                      background: `${getSeverityColor(selectedWarningData.severity)}20`,
                      color: getSeverityColor(selectedWarningData.severity),
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      SEVERIDAD {selectedWarningData.severity.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', marginBottom: '20px' }}>
                    {selectedWarningData.description}
                  </p>

                  {/* Key Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Probabilidad
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: getSeverityColor(selectedWarningData.severity) }}>
                        {selectedWarningData.probability}%
                      </div>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Marco Temporal
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {selectedWarningData.timeframe}
                      </div>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Población Afectada
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
                        {(selectedWarningData.affectedPopulation / 1000).toFixed(0)}k habitantes
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                      📍 Ubicación
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                      {selectedWarningData.location}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                      Coordenadas: {selectedWarningData.coordinates[1].toFixed(3)}, {selectedWarningData.coordinates[0].toFixed(3)}
                    </p>
                  </div>

                  {/* Source */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                      📡 Fuente de Datos
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
                      {selectedWarningData.source}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                      Última actualización: {new Date(selectedWarningData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    🛡️ Recomendaciones de Seguridad
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedWarningData.recommendations.map((recommendation, index) => (
                      <div key={index} style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        padding: '12px',
                        fontSize: '13px',
                        color: '#166534'
                      }}>
                        <span style={{ fontWeight: '600' }}>•</span> {recommendation}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div style={{
                  background: '#fef2f2',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #fecaca'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                    📞 Contactos de Emergencia
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#dc2626'
                  }}>
                    <div>
                      <strong>Emergencias Generales:</strong><br />
                      🚨 911 / 116
                    </div>
                    <div>
                      <strong>Bomberos:</strong><br />
                      🚒 116
                    </div>
                    <div>
                      <strong>Serenazgo:</strong><br />
                      👮 (01) 315-1212
                    </div>
                    <div>
                      <strong>INDECI:</strong><br />
                      📋 (01) 200-1111
                    </div>
                    <div>
                      <strong>Cruz Roja:</strong><br />
                      ⛑️ (01) 266-0481
                    </div>
                    <div>
                      <strong>Defensa Civil:</strong><br />
                      🏛️ (01) 224-7777
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚨</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    Seleccione una alerta para ver detalles
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Sistema de monitoreo activo las 24 horas
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EarlyWarningSystem;