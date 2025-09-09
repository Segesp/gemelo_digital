"use client";
import { useState, useEffect } from 'react';

interface ReportMetric {
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  category: 'environmental' | 'urban' | 'infrastructure' | 'population' | 'economic';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  sections: string[];
  recipients: string[];
  format: 'pdf' | 'online' | 'both';
}

interface CityReportsProps {
  isVisible: boolean;
  onClose: () => void;
}

export function CityReportsGenerator({ isVisible, onClose }: CityReportsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportPeriod, setReportPeriod] = useState('2024-Q4');
  const [reportMetrics, setReportMetrics] = useState<ReportMetric[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setReportTemplates([
      {
        id: 'monthly-executive',
        name: 'Reporte Ejecutivo Mensual',
        description: 'Resumen ejecutivo con indicadores clave de la ciudad',
        frequency: 'monthly',
        sections: ['Resumen Ejecutivo', 'Calidad del Aire', 'Movilidad', 'Servicios Públicos', 'Recomendaciones'],
        recipients: ['Alcalde', 'Gerentes Municipales', 'Concejo Municipal'],
        format: 'both'
      },
      {
        id: 'quarterly-environmental',
        name: 'Informe Ambiental Trimestral',
        description: 'Análisis detallado del estado ambiental de Lima',
        frequency: 'quarterly',
        sections: ['Estado Ambiental', 'Calidad del Aire', 'Cobertura Verde', 'Temperatura Urbana', 'Recursos Hídricos'],
        recipients: ['MINAM', 'Gerencia Ambiental', 'Organizaciones Ambientales'],
        format: 'pdf'
      },
      {
        id: 'semiannual-urban',
        name: 'Reporte de Desarrollo Urbano',
        description: 'Evolución del crecimiento urbano y planificación territorial',
        frequency: 'semiannual',
        sections: ['Expansión Urbana', 'Densidad Poblacional', 'Infraestructura', 'Transporte', 'Proyecciones'],
        recipients: ['MVCS', 'Planificadores Urbanos', 'Desarrolladores'],
        format: 'both'
      },
      {
        id: 'annual-comprehensive',
        name: 'Informe Anual Integral',
        description: 'Reporte completo del estado de la ciudad de Lima',
        frequency: 'annual',
        sections: ['Resumen Anual', 'Indicadores Ambientales', 'Desarrollo Urbano', 'Servicios', 'Economía', 'Proyecciones'],
        recipients: ['Ciudadanía', 'Gobierno Central', 'Organismos Internacionales'],
        format: 'online'
      }
    ]);

    setReportMetrics([
      // Environmental
      {
        key: 'air_quality_index',
        label: 'Índice de Calidad del Aire',
        currentValue: 87,
        previousValue: 82,
        unit: 'ICA',
        trend: 'down',
        target: 95,
        category: 'environmental'
      },
      {
        key: 'green_coverage',
        label: 'Cobertura Verde per Cápita',
        currentValue: 3.2,
        previousValue: 3.0,
        unit: 'm²/hab',
        trend: 'up',
        target: 9.0,
        category: 'environmental'
      },
      {
        key: 'temperature_reduction',
        label: 'Reducción Isla de Calor',
        currentValue: 1.8,
        previousValue: 1.5,
        unit: '°C',
        trend: 'up',
        target: 3.0,
        category: 'environmental'
      },
      // Urban Development
      {
        key: 'urban_expansion',
        label: 'Expansión Urbana',
        currentValue: 98.5,
        previousValue: 96.2,
        unit: 'km²',
        trend: 'up',
        category: 'urban'
      },
      {
        key: 'population_density',
        label: 'Densidad Poblacional',
        currentValue: 3156,
        previousValue: 3098,
        unit: 'hab/km²',
        trend: 'up',
        category: 'urban'
      },
      // Infrastructure
      {
        key: 'water_coverage',
        label: 'Cobertura de Agua Potable',
        currentValue: 94.8,
        previousValue: 94.2,
        unit: '%',
        trend: 'up',
        target: 98.0,
        category: 'infrastructure'
      },
      {
        key: 'electricity_coverage',
        label: 'Cobertura Eléctrica',
        currentValue: 98.9,
        previousValue: 98.7,
        unit: '%',
        trend: 'up',
        target: 99.5,
        category: 'infrastructure'
      },
      {
        key: 'transport_efficiency',
        label: 'Eficiencia del Transporte',
        currentValue: 67,
        previousValue: 64,
        unit: 'índice',
        trend: 'up',
        target: 80,
        category: 'infrastructure'
      },
      // Economic
      {
        key: 'economic_activity',
        label: 'Actividad Económica Nocturna',
        currentValue: 142,
        previousValue: 138,
        unit: 'índice',
        trend: 'up',
        category: 'economic'
      }
    ]);
  }, []);

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);

  const getMetricsByCategory = (category: string) => {
    return reportMetrics.filter(m => m.category === category);
  };

  const calculateChange = (current: number, previous: number): { value: number; percentage: number } => {
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return { value: change, percentage };
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'environmental': return '🌿';
      case 'urban': return '🏙️';
      case 'infrastructure': return '🏗️';
      case 'population': return '👥';
      case 'economic': return '💰';
      default: return '📊';
    }
  };

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
      alert('Reporte generado exitosamente. Se ha enviado a los destinatarios configurados.');
    }, 3000);
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
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              📊 Generador de Reportes de Ciudad
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Reportes automáticos basados en datos satelitales y análisis urbano
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

        {/* Controls */}
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
              Plantilla de Reporte
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                minWidth: '200px'
              }}
            >
              <option value="">Seleccionar plantilla...</option>
              {reportTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
              Período
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px'
              }}
            >
              <option value="2024-Q4">Q4 2024</option>
              <option value="2024-Q3">Q3 2024</option>
              <option value="2024-H2">H2 2024</option>
              <option value="2024">Año 2024</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              disabled={!selectedTemplate}
              style={{
                padding: '8px 16px',
                background: previewMode ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                fontWeight: '500',
                opacity: selectedTemplate ? 1 : 0.5
              }}
            >
              👁️ {previewMode ? 'Vista Normal' : 'Vista Previa'}
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={!selectedTemplate || generatingReport}
              style={{
                padding: '8px 16px',
                background: selectedTemplate && !generatingReport ? '#7c3aed' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedTemplate && !generatingReport ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {generatingReport ? '⏳' : '📄'} 
              {generatingReport ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
          <div style={{
            width: previewMode ? '300px' : '400px',
            background: '#f8fafc',
            padding: '20px',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}>
            {!previewMode && (
              <>
                {/* Template Info */}
                {selectedTemplateData && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                      Información de Plantilla
                    </h3>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                        {selectedTemplateData.name}
                      </h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6b7280' }}>
                        {selectedTemplateData.description}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                        <div><strong>Frecuencia:</strong> {selectedTemplateData.frequency}</div>
                        <div><strong>Formato:</strong> {selectedTemplateData.format}</div>
                        <div><strong>Destinatarios:</strong> {selectedTemplateData.recipients.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Metrics Summary */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Indicadores Clave
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reportMetrics.slice(0, 6).map(metric => {
                      const change = calculateChange(metric.currentValue, metric.previousValue);
                      return (
                        <div key={metric.key} style={{
                          background: 'white',
                          borderRadius: '6px',
                          padding: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '500' }}>
                              {getCategoryIcon(metric.category)} {metric.label}
                            </span>
                            <span style={{ fontSize: '10px' }}>
                              {getTrendIcon(metric.trend)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>
                              {metric.currentValue} {metric.unit}
                            </span>
                            <span style={{ 
                              fontSize: '10px',
                              color: change.value > 0 ? '#10b981' : '#ef4444',
                              fontWeight: '500'
                            }}>
                              {change.value > 0 ? '+' : ''}{change.value.toFixed(1)} ({change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          {metric.target && (
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                              Meta: {metric.target} {metric.unit}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Report History */}
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                    Reportes Recientes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { date: '2024-11-01', type: 'Reporte Ejecutivo Mensual', status: 'Enviado' },
                      { date: '2024-10-01', type: 'Informe Ambiental Trimestral', status: 'Enviado' },
                      { date: '2024-09-01', type: 'Reporte Ejecutivo Mensual', status: 'Enviado' },
                      { date: '2024-07-01', type: 'Reporte de Desarrollo Urbano', status: 'Enviado' }
                    ].map((report, index) => (
                      <div key={index} style={{
                        background: 'white',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px'
                      }}>
                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                          {report.type}
                        </div>
                        <div style={{ color: '#6b7280' }}>
                          {report.date} • {report.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {previewMode && selectedTemplateData && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                  Estructura del Reporte
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedTemplateData.sections.map((section, index) => (
                    <div key={index} style={{
                      background: 'white',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {index + 1}. {section}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {!previewMode ? (
              <>
                {/* Metrics by Category */}
                {['environmental', 'urban', 'infrastructure', 'economic'].map(category => {
                  const categoryMetrics = getMetricsByCategory(category);
                  if (categoryMetrics.length === 0) return null;

                  const categoryNames = {
                    environmental: 'Indicadores Ambientales',
                    urban: 'Desarrollo Urbano',
                    infrastructure: 'Infraestructura',
                    economic: 'Actividad Económica'
                  };

                  return (
                    <div key={category} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                        {getCategoryIcon(category)} {categoryNames[category as keyof typeof categoryNames]}
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '16px'
                      }}>
                        {categoryMetrics.map(metric => {
                          const change = calculateChange(metric.currentValue, metric.previousValue);
                          const progress = metric.target ? (metric.currentValue / metric.target) * 100 : null;
                          
                          return (
                            <div key={metric.key} style={{
                              background: '#f8fafc',
                              borderRadius: '8px',
                              padding: '16px',
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>
                                  {metric.label}
                                </h4>
                                <span style={{ fontSize: '14px' }}>
                                  {getTrendIcon(metric.trend)}
                                </span>
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                                {metric.currentValue} {metric.unit}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                                Período anterior: {metric.previousValue} {metric.unit}
                                <span style={{ 
                                  color: change.value > 0 ? '#10b981' : '#ef4444',
                                  fontWeight: '500',
                                  marginLeft: '8px'
                                }}>
                                  ({change.value > 0 ? '+' : ''}{change.percentage.toFixed(1)}%)
                                </span>
                              </div>
                              {metric.target && (
                                <>
                                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>
                                    Meta: {metric.target} {metric.unit}
                                  </div>
                                  <div style={{
                                    height: '4px',
                                    background: '#e5e7eb',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${Math.min(progress || 0, 100)}%`,
                                      background: progress && progress >= 90 ? '#10b981' : progress && progress >= 70 ? '#f59e0b' : '#ef4444',
                                      borderRadius: '2px'
                                    }} />
                                  </div>
                                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                                    {progress?.toFixed(1)}% de la meta
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {/* Report Preview */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  minHeight: '600px'
                }}>
                  <div style={{ borderBottom: '2px solid #7c3aed', paddingBottom: '16px', marginBottom: '24px' }}>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
                      {selectedTemplateData?.name}
                    </h1>
                    <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                      Período: {reportPeriod} | Generado: {new Date().toLocaleDateString()}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      Gemelo Digital de Lima - Sistema de Reportes Automatizados
                    </p>
                  </div>

                  {/* Executive Summary */}
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                      Resumen Ejecutivo
                    </h2>
                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#374151', marginBottom: '16px' }}>
                      Durante el período {reportPeriod}, Lima ha mostrado avances significativos en varios indicadores urbanos. 
                      La calidad del aire ha mejorado un 6.1% comparado con el período anterior, mientras que la cobertura verde 
                      per cápita ha aumentado a 3.2 m²/hab. El desarrollo urbano continúa con una expansión controlada de 98.5 km², 
                      manteniendo un balance entre crecimiento y sostenibilidad.
                    </p>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>87</div>
                        <div style={{ fontSize: '11px', color: '#166534' }}>Índice Calidad Aire</div>
                      </div>
                      <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>3.2</div>
                        <div style={{ fontSize: '11px', color: '#1e40af' }}>m² Verde/Habitante</div>
                      </div>
                      <div style={{
                        background: '#fef7ff',
                        border: '1px solid #e9d5ff',
                        borderRadius: '6px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#7c2d92' }}>98.5</div>
                        <div style={{ fontSize: '11px', color: '#7c2d92' }}>km² Área Urbana</div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Chart */}
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                      Evolución de Indicadores Clave
                    </h2>
                    <div style={{
                      height: '200px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #cbd5e1'
                    }}>
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                        <div style={{ fontSize: '12px' }}>Gráfico de Tendencias</div>
                        <div style={{ fontSize: '10px', marginTop: '4px' }}>
                          Calidad del aire, cobertura verde y desarrollo urbano
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                      Recomendaciones
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        'Continuar ampliando la red de corredores verdes para alcanzar 9 m²/hab de cobertura verde',
                        'Implementar medidas adicionales para mejorar la calidad del aire en zonas industriales',
                        'Fortalecer el monitoreo satelital para el control del crecimiento urbano no planificado',
                        'Desarrollar proyectos de infraestructura verde para mitigar el efecto isla de calor'
                      ].map((recommendation, index) => (
                        <div key={index} style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '4px',
                          padding: '10px',
                          fontSize: '12px',
                          color: '#0369a1'
                        }}>
                          <strong>{index + 1}.</strong> {recommendation}
                        </div>
                      ))}
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

export default CityReportsGenerator;