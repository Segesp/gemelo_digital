"use client";
import { useState, useEffect } from 'react';

interface TimeSeriesData {
  year: number;
  landUse: number;
  vegetation: number;
  urbanArea: number;
  temperature: number;
  airQuality: number;
  population: number;
}

interface ObservatoryProps {
  isVisible: boolean;
  onClose: () => void;
}

export function LimaUrbanObservatory({ isVisible, onClose }: ObservatoryProps) {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedDataset, setSelectedDataset] = useState('land-use');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<{ startYear: number; endYear: number }>({
    startYear: 2004,
    endYear: 2024
  });

  // Mock data for demonstration - would be replaced with real NASA satellite data
  useEffect(() => {
    const mockData: TimeSeriesData[] = [];
    for (let year = 2004; year <= 2024; year++) {
      mockData.push({
        year,
        landUse: 45 + (year - 2004) * 2.1 + Math.random() * 5, // Gradual urban expansion
        vegetation: 35 - (year - 2004) * 0.8 + Math.random() * 3, // Decreasing vegetation
        urbanArea: 520 + (year - 2004) * 18 + Math.random() * 10, // Urban area growth in km²
        temperature: 18.5 + (year - 2004) * 0.05 + Math.random() * 0.5, // Temperature increase
        airQuality: 85 - (year - 2004) * 1.2 + Math.random() * 8, // Air quality degradation
        population: 9500000 + (year - 2004) * 120000 + Math.random() * 50000 // Population growth
      });
    }
    setTimeSeriesData(mockData);
  }, []);

  const currentData = timeSeriesData.find(d => d.year === selectedYear) || timeSeriesData[timeSeriesData.length - 1];
  const startData = timeSeriesData.find(d => d.year === selectedComparison.startYear) || timeSeriesData[0];
  const endData = timeSeriesData.find(d => d.year === selectedComparison.endYear) || timeSeriesData[timeSeriesData.length - 1];

  const calculateChange = (start: number, end: number): { value: number; percentage: number } => {
    const change = end - start;
    const percentage = (change / start) * 100;
    return { value: change, percentage };
  };

  const datasets = [
    { id: 'land-use', name: 'Uso del Suelo', icon: '🏗️', description: 'Expansión urbana vs áreas agrícolas' },
    { id: 'vegetation', name: 'Cobertura Vegetal', icon: '🌿', description: 'NDVI y áreas verdes urbanas' },
    { id: 'temperature', name: 'Temperatura Superficial', icon: '🌡️', description: 'Islas de calor urbanas' },
    { id: 'air-quality', name: 'Calidad del Aire', icon: '💨', description: 'Contaminación atmosférica' },
    { id: 'nighttime-lights', name: 'Luminosidad Nocturna', icon: '💡', description: 'Actividad económica y urbana' },
    { id: 'water-resources', name: 'Recursos Hídricos', icon: '💧', description: 'Disponibilidad de agua subterránea' }
  ];

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
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              🛰️ Observatorio Urbano de Lima
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Visualización interactiva de 20 años de datos satelitales NASA
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

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Controls */}
          <div style={{
            width: '300px',
            background: '#f8fafc',
            padding: '20px',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Seleccionar Dataset
              </h3>
              {datasets.map(dataset => (
                <button
                  key={dataset.id}
                  onClick={() => setSelectedDataset(dataset.id)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    margin: '4px 0',
                    background: selectedDataset === dataset.id ? '#3b82f6' : 'white',
                    color: selectedDataset === dataset.id ? 'white' : '#374151',
                    border: selectedDataset === dataset.id ? 'none' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{dataset.icon}</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>{dataset.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>{dataset.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Línea de Tiempo
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                  Año: {selectedYear}
                </label>
                <input
                  type="range"
                  min="2004"
                  max="2024"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Comparación Temporal
              </h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                    Año Inicial
                  </label>
                  <select
                    value={selectedComparison.startYear}
                    onChange={(e) => setSelectedComparison(prev => ({ 
                      ...prev, 
                      startYear: parseInt(e.target.value) 
                    }))}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '11px'
                    }}
                  >
                    {timeSeriesData.map(data => (
                      <option key={data.year} value={data.year}>{data.year}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                    Año Final
                  </label>
                  <select
                    value={selectedComparison.endYear}
                    onChange={(e) => setSelectedComparison(prev => ({ 
                      ...prev, 
                      endYear: parseInt(e.target.value) 
                    }))}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      fontSize: '11px'
                    }}
                  >
                    {timeSeriesData.map(data => (
                      <option key={data.year} value={data.year}>{data.year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Stats */}
              {startData && endData && (
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>
                    Cambios Detectados
                  </h4>
                  {[
                    { key: 'urbanArea', label: 'Área Urbana', unit: 'km²', color: '#ef4444' },
                    { key: 'vegetation', label: 'Cobertura Vegetal', unit: '%', color: '#10b981' },
                    { key: 'temperature', label: 'Temperatura', unit: '°C', color: '#f59e0b' },
                    { key: 'airQuality', label: 'Calidad del Aire', unit: 'índice', color: '#8b5cf6' }
                  ].map(({ key, label, unit, color }) => {
                    const change = calculateChange(
                      startData[key as keyof TimeSeriesData] as number,
                      endData[key as keyof TimeSeriesData] as number
                    );
                    return (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                        fontSize: '11px'
                      }}>
                        <span>{label}:</span>
                        <span style={{
                          color: change.value > 0 ? (key === 'vegetation' || key === 'airQuality' ? color : '#ef4444') : color,
                          fontWeight: '500'
                        }}>
                          {change.value > 0 ? '+' : ''}{change.value.toFixed(1)} {unit}
                          ({change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Fuentes de Datos
              </h3>
              <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }}>
                <p><strong>🛰️ Landsat:</strong> Uso del suelo, NDVI, temperatura superficial</p>
                <p><strong>🌍 MODIS:</strong> Calidad del aire, aerosoles</p>
                <p><strong>🏔️ SRTM:</strong> Topografía y modelos de elevación</p>
                <p><strong>💧 GRACE:</strong> Recursos hídricos subterráneos</p>
                <p><strong>💡 VIIRS:</strong> Luminosidad nocturna y actividad económica</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Visualization */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {currentData && (
              <>
                {/* Current Year Stats */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                    Estadísticas de Lima - {selectedYear}
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    {[
                      { key: 'urbanArea', label: 'Área Urbana', value: currentData.urbanArea.toFixed(1), unit: 'km²', icon: '🏙️', color: '#3b82f6' },
                      { key: 'vegetation', label: 'Cobertura Vegetal', value: currentData.vegetation.toFixed(1), unit: '%', icon: '🌿', color: '#10b981' },
                      { key: 'temperature', label: 'Temperatura Media', value: currentData.temperature.toFixed(1), unit: '°C', icon: '🌡️', color: '#f59e0b' },
                      { key: 'airQuality', label: 'Calidad del Aire', value: currentData.airQuality.toFixed(0), unit: 'índice', icon: '💨', color: '#8b5cf6' },
                      { key: 'population', label: 'Población Est.', value: (currentData.population / 1000000).toFixed(1), unit: 'M hab', icon: '👥', color: '#ef4444' }
                    ].map(stat => (
                      <div key={stat.key} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                            {stat.label}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: stat.color
                        }}>
                          {stat.value} <span style={{ fontSize: '14px', fontWeight: '400' }}>{stat.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Series Chart Placeholder */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Evolución Temporal (2004-2024)
                  </h3>
                  <div style={{
                    height: '300px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
                      <div style={{ fontSize: '16px', fontWeight: '500' }}>
                        Gráfico de Series Temporales
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        Dataset: {datasets.find(d => d.id === selectedDataset)?.name}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                        Visualización interactiva de datos satelitales NASA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Satellite Imagery Placeholder */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Imágenes Satelitales - {selectedYear}
                  </h3>
                  <div style={{
                    height: '400px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛰️</div>
                      <div style={{ fontSize: '16px', fontWeight: '500' }}>
                        Visor de Imágenes Satelitales
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        Comparación temporal: {selectedComparison.startYear} vs {selectedComparison.endYear}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                        Integración con archivo de 20 años de Landsat
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LimaUrbanObservatory;