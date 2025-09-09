"use client";
import { useState, useEffect } from 'react';

interface GreenCorridorProps {
  id: string;
  name: string;
  length: number; // in meters
  width: number; // in meters
  connectivity: number; // 0-100 score
  biodiversity: number; // 0-100 score
  accessibility: number; // 0-100 score
  airQualityImprovement: number; // estimated improvement percentage
  temperatureReduction: number; // estimated temperature reduction in °C
  cost: number; // estimated cost in soles
  beneficiaries: number; // estimated population benefited
  status: 'planned' | 'in-progress' | 'completed';
  type: 'pedestrian' | 'cyclist' | 'mixed' | 'ecological';
}

interface PlanningProps {
  isVisible: boolean;
  onClose: () => void;
}

export function GreenCorridorsPlanning({ isVisible, onClose }: PlanningProps) {
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [planningMode, setPlanningMode] = useState<'view' | 'design' | 'analyze'>('view');
  const [corridors, setCorridors] = useState<GreenCorridorProps[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  // Mock data for demonstration
  useEffect(() => {
    setCorridors([
      {
        id: 'gc-001',
        name: 'Corredor Verde Metropolitano',
        length: 4500,
        width: 12,
        connectivity: 85,
        biodiversity: 72,
        accessibility: 90,
        airQualityImprovement: 15,
        temperatureReduction: 1.8,
        cost: 2800000,
        beneficiaries: 45000,
        status: 'planned',
        type: 'mixed'
      },
      {
        id: 'gc-002',
        name: 'Ruta Ecológica del Rímac',
        length: 6200,
        width: 8,
        connectivity: 78,
        biodiversity: 88,
        accessibility: 75,
        airQualityImprovement: 22,
        temperatureReduction: 2.3,
        cost: 3400000,
        beneficiaries: 62000,
        status: 'in-progress',
        type: 'ecological'
      },
      {
        id: 'gc-003',
        name: 'Ciclovía Verde Callao-Centro',
        length: 3800,
        width: 6,
        connectivity: 92,
        biodiversity: 65,
        accessibility: 95,
        airQualityImprovement: 12,
        temperatureReduction: 1.2,
        cost: 1900000,
        beneficiaries: 38000,
        status: 'completed',
        type: 'cyclist'
      },
      {
        id: 'gc-004',
        name: 'Sendero Peatonal Barranco',
        length: 2100,
        width: 4,
        connectivity: 68,
        biodiversity: 91,
        accessibility: 88,
        airQualityImprovement: 18,
        temperatureReduction: 1.5,
        cost: 950000,
        beneficiaries: 21000,
        status: 'planned',
        type: 'pedestrian'
      }
    ]);

    // Mock analysis results
    setAnalysisResults({
      totalLength: 16600,
      totalCost: 9050000,
      totalBeneficiaries: 166000,
      averageAirQualityImprovement: 16.75,
      averageTemperatureReduction: 1.7,
      connectivityScore: 80.75,
      biodiversityScore: 79,
      accessibilityScore: 87
    });
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'planned': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'pedestrian': return '🚶';
      case 'cyclist': return '🚴';
      case 'mixed': return '🚶🚴';
      case 'ecological': return '🌿';
      default: return '🛤️';
    }
  };

  const selectedCorridorData = corridors.find(c => c.id === selectedCorridor);

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
          background: 'linear-gradient(135deg, #059669, #34d399)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              🌳 Planificación de Corredores Verdes
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Diseño y análisis de corredores verdes para peatones y ciclistas
            </p>
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

        {/* Mode Selector */}
        <div style={{
          background: '#f8fafc',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {[
            { id: 'view', name: 'Vista General', icon: '👁️' },
            { id: 'design', name: 'Diseñar Corredor', icon: '✏️' },
            { id: 'analyze', name: 'Análisis de Impacto', icon: '📊' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setPlanningMode(mode.id as any)}
              style={{
                padding: '8px 16px',
                background: planningMode === mode.id ? '#10b981' : 'white',
                color: planningMode === mode.id ? 'white' : '#374151',
                border: planningMode === mode.id ? 'none' : '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {mode.icon} {mode.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
          <div style={{
            width: planningMode === 'view' ? '350px' : '300px',
            background: '#f8fafc',
            padding: '20px',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}>
            {planningMode === 'view' && (
              <>
                {/* Summary Stats */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Resumen del Sistema
                  </h3>
                  {analysisResults && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          Longitud Total
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                          {(analysisResults.totalLength / 1000).toFixed(1)} km
                        </div>
                      </div>
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          Beneficiarios
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
                          {(analysisResults.totalBeneficiaries / 1000).toFixed(0)}k hab.
                        </div>
                      </div>
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          Inversión Total
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#8b5cf6' }}>
                          S/ {(analysisResults.totalCost / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          Reducción Temperatura
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          -{analysisResults.averageTemperatureReduction.toFixed(1)}°C
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Corridors List */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                    Corredores Verdes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {corridors.map(corridor => (
                      <button
                        key={corridor.id}
                        onClick={() => setSelectedCorridor(corridor.id)}
                        style={{
                          background: selectedCorridor === corridor.id ? '#10b981' : 'white',
                          color: selectedCorridor === corridor.id ? 'white' : '#374151',
                          border: selectedCorridor === corridor.id ? 'none' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {getTypeIcon(corridor.type)} {corridor.name}
                          </span>
                          <span style={{ 
                            fontSize: '10px',
                            background: selectedCorridor === corridor.id ? 'rgba(255,255,255,0.2)' : `${getStatusColor(corridor.status)}20`,
                            color: selectedCorridor === corridor.id ? 'white' : getStatusColor(corridor.status),
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}>
                            {corridor.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {(corridor.length / 1000).toFixed(1)} km • {(corridor.beneficiaries / 1000).toFixed(0)}k beneficiarios
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {planningMode === 'design' && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                  Diseñar Nuevo Corredor
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Nombre del Corredor
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Corredor Verde Miraflores"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Tipo de Corredor
                    </label>
                    <select style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '12px'
                    }}>
                      <option value="mixed">🚶🚴 Mixto (Peatonal + Ciclista)</option>
                      <option value="pedestrian">🚶 Solo Peatonal</option>
                      <option value="cyclist">🚴 Solo Ciclista</option>
                      <option value="ecological">🌿 Corredor Ecológico</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Ancho (metros)
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      defaultValue="8"
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                      3m - 20m
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>
                      Elementos de Diseño
                    </h4>
                    {[
                      'Áreas verdes nativas',
                      'Iluminación LED',
                      'Mobiliario urbano',
                      'Estaciones de descanso',
                      'Señalización ecológica',
                      'Sistema de riego'
                    ].map(element => (
                      <label key={element} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        marginBottom: '4px'
                      }}>
                        <input type="checkbox" defaultChecked />
                        {element}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {planningMode === 'analyze' && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                  Parámetros de Análisis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Tipo de Análisis
                    </label>
                    <select style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '12px'
                    }}>
                      <option value="connectivity">Conectividad Ecológica</option>
                      <option value="accessibility">Accesibilidad Peatonal</option>
                      <option value="air-quality">Mejora Calidad del Aire</option>
                      <option value="temperature">Reducción Temperatura</option>
                      <option value="biodiversity">Biodiversidad</option>
                      <option value="cost-benefit">Costo-Beneficio</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                      Radio de Análisis (metros)
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      defaultValue="500"
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                      100m - 2km
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>
                      Datos de Entrada
                    </h4>
                    <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }}>
                      <p>• <strong>NDVI:</strong> Cobertura vegetal actual</p>
                      <p>• <strong>LST:</strong> Temperatura superficial</p>
                      <p>• <strong>Densidad poblacional:</strong> Censos y registros</p>
                      <p>• <strong>Red vial:</strong> Infraestructura existente</p>
                      <p>• <strong>Calidad del aire:</strong> Estaciones de monitoreo</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Map and Details */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {planningMode === 'view' && selectedCorridorData && (
              <>
                {/* Corridor Details */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                      {getTypeIcon(selectedCorridorData.type)} {selectedCorridorData.name}
                    </h3>
                    <span style={{ 
                      fontSize: '12px',
                      background: `${getStatusColor(selectedCorridorData.status)}20`,
                      color: getStatusColor(selectedCorridorData.status),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      {selectedCorridorData.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    {[
                      { label: 'Longitud', value: `${(selectedCorridorData.length / 1000).toFixed(1)} km`, icon: '📏' },
                      { label: 'Ancho', value: `${selectedCorridorData.width} m`, icon: '↔️' },
                      { label: 'Beneficiarios', value: `${(selectedCorridorData.beneficiaries / 1000).toFixed(0)}k`, icon: '👥' },
                      { label: 'Inversión', value: `S/ ${(selectedCorridorData.cost / 1000000).toFixed(1)}M`, icon: '💰' },
                      { label: 'Mejora Aire', value: `+${selectedCorridorData.airQualityImprovement}%`, icon: '💨' },
                      { label: 'Reducción Temp.', value: `-${selectedCorridorData.temperatureReduction}°C`, icon: '🌡️' }
                    ].map(metric => (
                      <div key={metric.label} style={{
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{metric.icon}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                          {metric.label}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scores */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                      Indicadores de Desempeño
                    </h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {[
                        { label: 'Conectividad', value: selectedCorridorData.connectivity, color: '#3b82f6' },
                        { label: 'Biodiversidad', value: selectedCorridorData.biodiversity, color: '#10b981' },
                        { label: 'Accesibilidad', value: selectedCorridorData.accessibility, color: '#f59e0b' }
                      ].map(score => (
                        <div key={score.label}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}>
                            <span style={{ fontSize: '12px', fontWeight: '500' }}>{score.label}</span>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>{score.value}/100</span>
                          </div>
                          <div style={{
                            height: '6px',
                            background: '#e5e7eb',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${score.value}%`,
                              background: score.color,
                              borderRadius: '3px'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Map/Visualization Area */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              minHeight: '400px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                {planningMode === 'view' && 'Mapa de Corredores Verdes'}
                {planningMode === 'design' && 'Herramienta de Diseño'}
                {planningMode === 'analyze' && 'Análisis de Impacto'}
              </h3>
              <div style={{
                height: '400px',
                background: '#f8fafc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                    {planningMode === 'view' && '🗺️'}
                    {planningMode === 'design' && '✏️'}
                    {planningMode === 'analyze' && '📊'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {planningMode === 'view' && 'Visualización Interactiva de Corredores'}
                    {planningMode === 'design' && 'Herramienta de Diseño de Rutas'}
                    {planningMode === 'analyze' && 'Análisis Espacial y Modelado'}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {planningMode === 'view' && 'Mapa base con corredores existentes y planificados'}
                    {planningMode === 'design' && 'Dibuje el trazado del nuevo corredor verde'}
                    {planningMode === 'analyze' && 'Visualización de resultados de análisis NDVI y LST'}
                  </div>
                </div>
              </div>

              {planningMode === 'analyze' && analysisResults && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                    🌿 Beneficios Ambientales Estimados
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#166534'
                  }}>
                    <div>
                      <strong>Captura de CO₂:</strong> ~{(analysisResults.totalLength * 0.5).toFixed(0)} ton/año
                    </div>
                    <div>
                      <strong>Biodiversidad:</strong> +{analysisResults.biodiversityScore}% especies nativas
                    </div>
                    <div>
                      <strong>Filtración de aire:</strong> {(analysisResults.averageAirQualityImprovement * 1.2).toFixed(1)}% mejor
                    </div>
                    <div>
                      <strong>Regulación hídrica:</strong> {(analysisResults.totalLength * 0.8).toFixed(0)} m³/h
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GreenCorridorsPlanning;