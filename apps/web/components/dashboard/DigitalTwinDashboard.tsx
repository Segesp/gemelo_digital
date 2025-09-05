"use client";
import { useState, useEffect } from 'react';

// Digital Twin Dashboard - Central Control Interface
export function DigitalTwinDashboard({ activeMode, onModeChange }: {
  activeMode: string;
  onModeChange: (mode: 'design' | 'simulation' | 'analytics' | 'collaboration' | 'ar' | 'vr') => void;
}) {
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Simulate real-time metrics
    const interval = setInterval(() => {
      setRealTimeMetrics({
        population: 125847 + Math.floor(Math.random() * 100),
        buildings: 1247,
        energy: {
          consumption: 2.45 + Math.random() * 0.5,
          production: 1.8 + Math.random() * 0.3,
          efficiency: 73 + Math.random() * 10
        },
        traffic: {
          flow: 89 + Math.random() * 20,
          avgSpeed: 32 + Math.random() * 8,
          incidents: Math.floor(Math.random() * 3)
        },
        environment: {
          airQuality: 78 + Math.random() * 15,
          temperature: 22 + Math.random() * 5,
          humidity: 65 + Math.random() * 10
        },
        economy: {
          gdp: 2.47,
          unemployment: 4.2 + Math.random() * 1,
          budget: 15.6
        }
      });

      // Generate random notifications
      if (Math.random() < 0.1) {
        const newNotification = {
          id: Date.now(),
          type: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
          message: [
            'Nuevo sensor IoT conectado en Zona Norte',
            'Incremento de tráfico detectado en Centro',
            'Actualización de energía renovable disponible',
            'Simulación de emergencia completada',
            'Nueva propuesta urbana agregada'
          ][Math.floor(Math.random() * 5)],
          timestamp: new Date()
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const modes = [
    { id: 'design', icon: '🏗️', label: 'Diseño', description: 'Construcción y planificación' },
    { id: 'simulation', icon: '⚡', label: 'Simulación', description: 'Análisis dinámico' },
    { id: 'analytics', icon: '📊', label: 'Analíticas', description: 'Datos e insights' },
    { id: 'collaboration', icon: '👥', label: 'Colaboración', description: 'Trabajo en equipo' },
    { id: 'ar', icon: '📱', label: 'AR/VR', description: 'Realidad aumentada' },
    { id: 'vr', icon: '🥽', label: 'Inmersivo', description: 'Experiencia VR' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      height: isExpanded ? '120px' : '60px',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(26,32,44,0.95) 100%)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      color: 'white',
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>
      {/* Main Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        height: '60px'
      }}>
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🏙️ Gemelo Digital Avanzado
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              padding: '5px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{
          display: 'flex',
          gap: '10px',
          background: 'rgba(255,255,255,0.05)',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id as any)}
              style={{
                background: activeMode === mode.id 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '8px 15px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.7 }}>Población</div>
            <div style={{ fontWeight: 'bold', color: '#4ade80' }}>
              {realTimeMetrics.population?.toLocaleString()}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.7 }}>Edificios</div>
            <div style={{ fontWeight: 'bold', color: '#60a5fa' }}>
              {realTimeMetrics.buildings}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ opacity: 0.7 }}>Energía</div>
            <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>
              {realTimeMetrics.energy?.efficiency.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <div style={{
          padding: '0 30px 15px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 300px',
          gap: '20px',
          height: '60px'
        }}>
          {/* Energy Metrics */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#fbbf24' }}>
              ⚡ Sistema Energético
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>Consumo: {realTimeMetrics.energy?.consumption.toFixed(1)} GW</div>
              <div>Producción: {realTimeMetrics.energy?.production.toFixed(1)} GW</div>
            </div>
          </div>

          {/* Traffic Metrics */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#60a5fa' }}>
              🚦 Sistema de Tráfico
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>Flujo: {realTimeMetrics.traffic?.flow.toFixed(0)}%</div>
              <div>Vel. Prom: {realTimeMetrics.traffic?.avgSpeed.toFixed(0)} km/h</div>
            </div>
          </div>

          {/* Environmental Metrics */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#4ade80' }}>
              🌱 Sistema Ambiental
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>Aire: {realTimeMetrics.environment?.airQuality.toFixed(0)}/100</div>
              <div>Temp: {realTimeMetrics.environment?.temperature.toFixed(1)}°C</div>
            </div>
          </div>

          {/* Notifications Panel */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '10px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              🔔 Notificaciones Recientes
            </div>
            <div style={{ maxHeight: '35px', overflowY: 'auto' }}>
              {notifications.slice(0, 2).map(notif => (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '2px',
                    opacity: 0.8
                  }}
                >
                  <span>
                    {notif.type === 'info' && '💙'}
                    {notif.type === 'warning' && '⚠️'}
                    {notif.type === 'error' && '🔴'}
                  </span>
                  <span style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {notif.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '2px',
        background: 'linear-gradient(90deg, #4ade80 0%, #60a5fa 50%, #fbbf24 100%)',
        opacity: 0.6
      }} />
    </div>
  );
}

// Smart City Analytics Component
export function SmartCityAnalytics() {
  const [activeMetric, setActiveMetric] = useState<'traffic' | 'energy' | 'environment' | 'population'>('traffic');
  const [realTimeData, setRealTimeData] = useState<any>({});
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData({
        traffic: {
          avgSpeed: 35 + Math.random() * 10,
          congestionLevel: Math.random() * 100,
          accidents: Math.floor(Math.random() * 5),
          publicTransportUsage: 60 + Math.random() * 20,
          co2Emissions: 145 + Math.random() * 30
        },
        energy: {
          totalConsumption: 850 + Math.random() * 100,
          renewablePercentage: 35 + Math.random() * 15,
          peakDemand: 1200 + Math.random() * 200,
          gridEfficiency: 85 + Math.random() * 10,
          carbonFootprint: 892 + Math.random() * 50
        },
        environment: {
          airQuality: 75 + Math.random() * 20,
          noiseLevel: 45 + Math.random() * 15,
          greenCoverage: 28 + Math.random() * 5,
          waterQuality: 87 + Math.random() * 10,
          biodiversityIndex: 0.73 + Math.random() * 0.1
        },
        population: {
          currentPopulation: 125000 + Math.floor(Math.random() * 1000),
          growthRate: 2.1 + Math.random() * 0.5,
          density: 2400 + Math.random() * 100,
          satisfaction: 78 + Math.random() * 15,
          employmentRate: 94 + Math.random() * 4
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: isMinimized ? '60px' : '400px',
      height: isMinimized ? '60px' : '320px',
      background: 'rgba(0,0,0,0.95)',
      borderRadius: '15px',
      padding: isMinimized ? '0' : '20px',
      color: 'white',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 1000,
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMinimized ? '0' : '15px'
      }}>
        {!isMinimized && (
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📊 Analytics Avanzado
          </h3>
        )}
        
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            position: isMinimized ? 'absolute' : 'static',
            top: isMinimized ? '15px' : 'auto',
            right: isMinimized ? '15px' : 'auto'
          }}
        >
          {isMinimized ? '📊' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Metric Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '15px'
          }}>
            {(['traffic', 'energy', 'environment', 'population'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                style={{
                  background: activeMetric === metric 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '10px',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
              >
                {metric === 'traffic' && '🚦 Tráfico'}
                {metric === 'energy' && '⚡ Energía'}
                {metric === 'environment' && '🌱 Ambiente'}
                {metric === 'population' && '👥 Población'}
              </button>
            ))}
          </div>

          {/* Real-time Metrics Display */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            padding: '15px',
            fontSize: '12px',
            lineHeight: '1.6',
            minHeight: '180px'
          }}>
            {activeMetric === 'traffic' && realTimeData.traffic && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#60a5fa' }}>
                  🚦 Sistema de Tráfico Inteligente
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div>🚗 Velocidad promedio</div>
                    <div style={{ color: '#4ade80', fontWeight: 'bold' }}>
                      {realTimeData.traffic.avgSpeed.toFixed(1)} km/h
                    </div>
                  </div>
                  <div>
                    <div>🚦 Congestión</div>
                    <div style={{ color: realTimeData.traffic.congestionLevel > 70 ? '#ef4444' : '#fbbf24' }}>
                      {realTimeData.traffic.congestionLevel.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div>🚨 Incidentes</div>
                    <div style={{ color: realTimeData.traffic.accidents > 2 ? '#ef4444' : '#4ade80' }}>
                      {realTimeData.traffic.accidents}
                    </div>
                  </div>
                  <div>
                    <div>🚌 Transporte público</div>
                    <div style={{ color: '#60a5fa' }}>
                      {realTimeData.traffic.publicTransportUsage.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(96,165,250,0.1)', borderRadius: '6px' }}>
                  💨 Emisiones CO2: {realTimeData.traffic.co2Emissions.toFixed(0)} kg/h
                </div>
              </div>
            )}

            {activeMetric === 'energy' && realTimeData.energy && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#fbbf24' }}>
                  ⚡ Sistema Energético Inteligente
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div>⚡ Consumo total</div>
                    <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                      {realTimeData.energy.totalConsumption.toFixed(0)} MW
                    </div>
                  </div>
                  <div>
                    <div>🌱 Energía renovable</div>
                    <div style={{ color: '#4ade80' }}>
                      {realTimeData.energy.renewablePercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div>📈 Demanda pico</div>
                    <div style={{ color: '#ef4444' }}>
                      {realTimeData.energy.peakDemand.toFixed(0)} MW
                    </div>
                  </div>
                  <div>
                    <div>🔧 Eficiencia red</div>
                    <div style={{ color: realTimeData.energy.gridEfficiency > 85 ? '#4ade80' : '#fbbf24' }}>
                      {realTimeData.energy.gridEfficiency.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(251,191,36,0.1)', borderRadius: '6px' }}>
                  🌍 Huella carbono: {realTimeData.energy.carbonFootprint.toFixed(0)} tons/día
                </div>
              </div>
            )}

            {activeMetric === 'environment' && realTimeData.environment && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#4ade80' }}>
                  🌱 Sistema Ambiental
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div>🌬️ Calidad del aire</div>
                    <div style={{ color: realTimeData.environment.airQuality > 80 ? '#4ade80' : '#fbbf24' }}>
                      {realTimeData.environment.airQuality.toFixed(0)}/100
                    </div>
                  </div>
                  <div>
                    <div>🔊 Nivel de ruido</div>
                    <div style={{ color: realTimeData.environment.noiseLevel > 60 ? '#ef4444' : '#4ade80' }}>
                      {realTimeData.environment.noiseLevel.toFixed(0)} dB
                    </div>
                  </div>
                  <div>
                    <div>🌳 Cobertura verde</div>
                    <div style={{ color: '#4ade80' }}>
                      {realTimeData.environment.greenCoverage.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div>💧 Calidad agua</div>
                    <div style={{ color: '#60a5fa' }}>
                      {realTimeData.environment.waterQuality.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(74,222,128,0.1)', borderRadius: '6px' }}>
                  🦋 Índice biodiversidad: {realTimeData.environment.biodiversityIndex.toFixed(2)}
                </div>
              </div>
            )}

            {activeMetric === 'population' && realTimeData.population && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#a78bfa' }}>
                  👥 Demographics Inteligentes
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div>👥 Población actual</div>
                    <div style={{ color: '#a78bfa', fontWeight: 'bold' }}>
                      {realTimeData.population.currentPopulation.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div>📈 Tasa crecimiento</div>
                    <div style={{ color: '#4ade80' }}>
                      {realTimeData.population.growthRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div>🏠 Densidad</div>
                    <div style={{ color: '#fbbf24' }}>
                      {realTimeData.population.density.toFixed(0)} hab/km²
                    </div>
                  </div>
                  <div>
                    <div>💼 Empleo</div>
                    <div style={{ color: realTimeData.population.employmentRate > 90 ? '#4ade80' : '#fbbf24' }}>
                      {realTimeData.population.employmentRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(167,139,250,0.1)', borderRadius: '6px' }}>
                  😊 Satisfacción ciudadana: {realTimeData.population.satisfaction.toFixed(0)}%
                </div>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div style={{
            marginTop: '10px',
            padding: '8px',
            background: 'rgba(102,126,234,0.1)',
            borderRadius: '6px',
            fontSize: '10px',
            border: '1px solid rgba(102,126,234,0.2)'
          }}>
            🤖 <strong>IA Insight:</strong> {getAIInsight(activeMetric, realTimeData[activeMetric])}
          </div>
        </>
      )}
    </div>
  );
}

// Helper function for AI insights
function getAIInsight(metric: string, data: any): string {
  if (!data) return 'Recopilando datos...';

  switch (metric) {
    case 'traffic':
      if (data.congestionLevel > 70) {
        return 'Congestión alta detectada. Recomienda rutas alternativas y optimizar semáforos.';
      } else if (data.avgSpeed < 30) {
        return 'Velocidad baja en vías principales. Considera mejoras en infraestructura vial.';
      }
      return 'Flujo de tráfico dentro de parámetros normales. Monitoreo continuo activo.';

    case 'energy':
      if (data.renewablePercentage < 40) {
        return 'Oportunidad de incrementar energía renovable. Evalúa instalación de paneles solares.';
      } else if (data.gridEfficiency < 80) {
        return 'Eficiencia de red subóptima. Recomienda mantenimiento y actualización de infraestructura.';
      }
      return 'Sistema energético funcionando eficientemente. Continúa optimizaciones.';

    case 'environment':
      if (data.airQuality < 70) {
        return 'Calidad del aire necesita atención. Implementa medidas para reducir emisiones.';
      } else if (data.greenCoverage < 25) {
        return 'Cobertura verde insuficiente. Planifica más áreas verdes y parques urbanos.';
      }
      return 'Indicadores ambientales saludables. Mantén políticas de sostenibilidad.';

    case 'population':
      if (data.satisfaction < 70) {
        return 'Satisfacción ciudadana baja. Evalúa servicios públicos y calidad de vida.';
      } else if (data.employmentRate < 90) {
        return 'Oportunidad de crear más empleos. Incentiva desarrollo económico local.';
      }
      return 'Métricas poblacionales positivas. Comunidad próspera y en crecimiento.';

    default:
      return 'Análisis en progreso...';
  }
}