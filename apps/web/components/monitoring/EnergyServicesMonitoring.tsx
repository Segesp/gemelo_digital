"use client";
import { useState, useEffect } from 'react';

interface EnergyData {
  timestamp: string;
  consumption: number;
  production: number;
  efficiency: number;
  cost: number;
}

interface ServiceData {
  service: string;
  consumption: number;
  capacity: number;
  efficiency: number;
  cost: number;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface MonitoringProps {
  isVisible: boolean;
  onClose: () => void;
}

export function EnergyServicesMonitoring({ isVisible, onClose }: MonitoringProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedService, setSelectedService] = useState('all');
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Mock energy data
    const mockEnergyData: EnergyData[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      mockEnergyData.push({
        timestamp: time.toISOString(),
        consumption: 850 + Math.sin(i * 0.5) * 100 + Math.random() * 50,
        production: 750 + Math.sin(i * 0.3) * 80 + Math.random() * 40,
        efficiency: 85 + Math.random() * 10,
        cost: 0.12 + Math.random() * 0.03
      });
    }
    setEnergyData(mockEnergyData.reverse());

    // Mock services data
    setServicesData([
      {
        service: 'Agua Potable',
        consumption: 1250,
        capacity: 1800,
        efficiency: 87,
        cost: 45600,
        status: 'optimal',
        trend: 'stable'
      },
      {
        service: 'Electricidad',
        consumption: 2850,
        capacity: 3500,
        efficiency: 82,
        cost: 125400,
        status: 'warning',
        trend: 'up'
      },
      {
        service: 'Gas Natural',
        consumption: 890,
        capacity: 1200,
        efficiency: 91,
        cost: 23800,
        status: 'optimal',
        trend: 'down'
      },
      {
        service: 'Alcantarillado',
        consumption: 1150,
        capacity: 1600,
        efficiency: 78,
        cost: 18500,
        status: 'warning',
        trend: 'up'
      },
      {
        service: 'Telecomunicaciones',
        consumption: 450,
        capacity: 800,
        efficiency: 94,
        cost: 15200,
        status: 'optimal',
        trend: 'stable'
      },
      {
        service: 'Gestión de Residuos',
        consumption: 340,
        capacity: 500,
        efficiency: 72,
        cost: 12400,
        status: 'critical',
        trend: 'up'
      }
    ]);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const currentConsumption = energyData[energyData.length - 1]?.consumption || 0;
  const currentProduction = energyData[energyData.length - 1]?.production || 0;
  const currentEfficiency = energyData[energyData.length - 1]?.efficiency || 0;
  const totalServiceCost = servicesData.reduce((sum, service) => sum + service.cost, 0);

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
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              ⚡ Monitoreo Energético y de Servicios
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Seguimiento en tiempo real del consumo de energía y servicios urbanos
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Última actualización: {new Date().toLocaleTimeString()}
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
              Rango Temporal
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px'
              }}
            >
              <option value="1h">Última hora</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Última semana</option>
              <option value="30d">Último mes</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
              Servicio
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px'
              }}
            >
              <option value="all">Todos los servicios</option>
              {servicesData.map(service => (
                <option key={service.service} value={service.service}>
                  {service.service}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Key Metrics */}
          <div style={{
            width: '350px',
            background: '#f8fafc',
            padding: '20px',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}>
            {/* Energy Overview */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Resumen Energético
              </h3>
              <div style={{ 
                display: 'grid', 
                gap: '12px'
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>⚡</span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Consumo Actual
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                    {currentConsumption.toFixed(0)} kW
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>🔋</span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Producción
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                    {currentProduction.toFixed(0)} kW
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>📊</span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Eficiencia
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                    {currentEfficiency.toFixed(1)}%
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>💰</span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Costo Total Servicios
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                    S/ {(totalServiceCost / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Alertas Activas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {servicesData
                  .filter(service => service.status !== 'optimal')
                  .map(service => (
                    <div key={service.service} style={{
                      background: 'white',
                      borderRadius: '6px',
                      padding: '10px',
                      border: `1px solid ${getStatusColor(service.status)}20`,
                      borderLeft: `4px solid ${getStatusColor(service.status)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>
                          {service.service}
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          color: getStatusColor(service.status),
                          fontWeight: '600' 
                        }}>
                          {service.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                        Uso: {((service.consumption / service.capacity) * 100).toFixed(0)}% de capacidad
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Fuentes de Datos
              </h3>
              <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }}>
                <p><strong>📡 Sensores IoT:</strong> Medidores inteligentes en tiempo real</p>
                <p><strong>🛰️ VIIRS:</strong> Luminosidad nocturna para actividad económica</p>
                <p><strong>🏢 Empresas:</strong> Datos de consumo y distribución</p>
                <p><strong>🏛️ Municipal:</strong> Registros administrativos y facturación</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Charts and Services */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {/* Energy Chart */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Consumo Energético - {selectedTimeRange}
              </h3>
              <div style={{
                height: '250px',
                background: '#f8fafc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    Gráfico de Consumo Energético
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Consumo vs Producción en tiempo real
                  </div>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Estado de Servicios Urbanos
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {servicesData.map(service => (
                  <div key={service.service} style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Service Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                        {service.service}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px' }}>{getTrendIcon(service.trend)}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          color: getStatusColor(service.status),
                          fontWeight: '600',
                          background: `${getStatusColor(service.status)}20`,
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}>
                          {service.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Usage Bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          Uso: {service.consumption} / {service.capacity}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>
                          {((service.consumption / service.capacity) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(service.consumption / service.capacity) * 100}%`,
                          background: getStatusColor(service.status),
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>Eficiencia</div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>
                          {service.efficiency}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>Costo Mensual</div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>
                          S/ {(service.cost / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optimization Recommendations */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                  💡 Recomendaciones de Optimización
                </h4>
                <div style={{ fontSize: '12px', color: '#0369a1', lineHeight: '1.5' }}>
                  <p>• <strong>Gestión de Residuos:</strong> Implementar rutas optimizadas para reducir costos 15%</p>
                  <p>• <strong>Electricidad:</strong> Instalar paneles solares en edificios municipales para ahorrar 8%</p>
                  <p>• <strong>Agua Potable:</strong> Detectar y reparar fugas para mejorar eficiencia 5%</p>
                  <p>• <strong>Alcantarillado:</strong> Mantenimiento preventivo para evitar saturación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnergyServicesMonitoring;