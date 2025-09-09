"use client";
import { useState, useEffect } from 'react';

interface TrafficData {
  sectorId: string;
  sectorName: string;
  currentFlow: number; // vehicles per hour
  averageSpeed: number; // km/h
  congestionLevel: 'low' | 'medium' | 'high' | 'critical';
  incidents: number;
  co2Emissions: number; // tons/hour
  noiseLevel: number; // dB
  coordinates: [number, number];
  lastUpdated: string;
}

interface PublicTransport {
  routeId: string;
  routeName: string;
  type: 'bus' | 'metro' | 'brt';
  occupancy: number; // percentage
  onTimePerformance: number; // percentage
  averageWaitTime: number; // minutes
  dailyPassengers: number;
  status: 'operational' | 'delayed' | 'disrupted';
}

interface TransportSystemProps {
  isVisible: boolean;
  onClose: () => void;
}

export function IntelligentTransportSystem({ isVisible, onClose }: TransportSystemProps) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'traffic' | 'public-transport' | 'optimization'>('traffic');
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [publicTransportData, setPublicTransportData] = useState<PublicTransport[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  // Mock data for demonstration
  useEffect(() => {
    setTrafficData([
      {
        sectorId: 'T001',
        sectorName: 'Centro Histórico',
        currentFlow: 1250,
        averageSpeed: 18,
        congestionLevel: 'high',
        incidents: 2,
        co2Emissions: 8.5,
        noiseLevel: 72,
        coordinates: [-77.028, -12.046],
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        sectorId: 'T002',
        sectorName: 'San Isidro - Miraflores',
        currentFlow: 2150,
        averageSpeed: 25,
        congestionLevel: 'medium',
        incidents: 0,
        co2Emissions: 12.3,
        noiseLevel: 68,
        coordinates: [-77.048, -12.095],
        lastUpdated: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      },
      {
        sectorId: 'T003',
        sectorName: 'Av. Javier Prado',
        currentFlow: 3200,
        averageSpeed: 12,
        congestionLevel: 'critical',
        incidents: 4,
        co2Emissions: 18.7,
        noiseLevel: 78,
        coordinates: [-77.015, -12.085],
        lastUpdated: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        sectorId: 'T004',
        sectorName: 'Callao - Aeropuerto',
        currentFlow: 1850,
        averageSpeed: 32,
        congestionLevel: 'low',
        incidents: 0,
        co2Emissions: 9.8,
        noiseLevel: 65,
        coordinates: [-77.118, -12.055],
        lastUpdated: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      },
      {
        sectorId: 'T005',
        sectorName: 'San Juan de Lurigancho',
        currentFlow: 2450,
        averageSpeed: 22,
        congestionLevel: 'medium',
        incidents: 1,
        co2Emissions: 14.2,
        noiseLevel: 70,
        coordinates: [-76.985, -12.135],
        lastUpdated: new Date(Date.now() - 4 * 60 * 1000).toISOString()
      }
    ]);

    setPublicTransportData([
      {
        routeId: 'BRT001',
        routeName: 'Metropolitano Norte-Sur',
        type: 'brt',
        occupancy: 85,
        onTimePerformance: 78,
        averageWaitTime: 6,
        dailyPassengers: 650000,
        status: 'operational'
      },
      {
        routeId: 'M001',
        routeName: 'Metro Línea 1',
        type: 'metro',
        occupancy: 92,
        onTimePerformance: 95,
        averageWaitTime: 3,
        dailyPassengers: 480000,
        status: 'operational'
      },
      {
        routeId: 'BUS101',
        routeName: 'Corredor Azul',
        type: 'bus',
        occupancy: 68,
        onTimePerformance: 65,
        averageWaitTime: 12,
        dailyPassengers: 180000,
        status: 'delayed'
      },
      {
        routeId: 'BUS102',
        routeName: 'Corredor Rojo',
        type: 'bus',
        occupancy: 72,
        onTimePerformance: 70,
        averageWaitTime: 10,
        dailyPassengers: 165000,
        status: 'operational'
      },
      {
        routeId: 'BRT002',
        routeName: 'Metropolitano Este-Oeste',
        type: 'brt',
        occupancy: 45,
        onTimePerformance: 82,
        averageWaitTime: 8,
        dailyPassengers: 95000,
        status: 'disrupted'
      }
    ]);

    setOptimizationResults({
      potentialReduction: {
        travelTime: 25, // percentage
        fuelConsumption: 18,
        co2Emissions: 22,
        congestion: 30
      },
      recommendations: [
        {
          type: 'traffic-lights',
          description: 'Sincronización de semáforos en Av. Javier Prado',
          impact: 'Reducción 15% tiempo de viaje',
          priority: 'high',
          cost: 850000
        },
        {
          type: 'route-optimization',
          description: 'Rutas alternativas para transporte público',
          impact: 'Mejora 20% puntualidad',
          priority: 'medium',
          cost: 320000
        },
        {
          type: 'smart-parking',
          description: 'Sistema de estacionamiento inteligente Centro',
          impact: 'Reducción 12% búsqueda estacionamiento',
          priority: 'medium',
          cost: 1200000
        },
        {
          type: 'dynamic-pricing',
          description: 'Tarifas dinámicas en horas pico',
          impact: 'Redistribución 8% flujo vehicular',
          priority: 'low',
          cost: 180000
        }
      ]
    });
  }, []);

  const getCongestionColor = (level: string): string => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTransportIcon = (type: string): string => {
    switch (type) {
      case 'bus': return '🚌';
      case 'metro': return '🚇';
      case 'brt': return '🚍';
      default: return '🚐';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return '#10b981';
      case 'delayed': return '#f59e0b';
      case 'disrupted': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const selectedSectorData = trafficData.find(s => s.sectorId === selectedSector);

  const totalDailyPassengers = publicTransportData.reduce((sum, route) => sum + route.dailyPassengers, 0);
  const averageOccupancy = publicTransportData.reduce((sum, route) => sum + route.occupancy, 0) / publicTransportData.length;
  const totalCO2Emissions = trafficData.reduce((sum, sector) => sum + sector.co2Emissions, 0);

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
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              🚦 Sistema Inteligente de Transporte
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Monitoreo y optimización del tráfico urbano en tiempo real
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '12px', opacity: 0.9, textAlign: 'right' }}>
              <div>Última actualización: {new Date().toLocaleTimeString()}</div>
              <div>📊 {totalDailyPassengers.toLocaleString()} pasajeros/día</div>
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

        {/* View Mode Selector */}
        <div style={{
          background: '#f8fafc',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {[
            { id: 'traffic', name: 'Tráfico Vehicular', icon: '🚗' },
            { id: 'public-transport', name: 'Transporte Público', icon: '🚌' },
            { id: 'optimization', name: 'Optimización', icon: '⚡' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              style={{
                padding: '8px 16px',
                background: viewMode === mode.id ? '#1e40af' : 'white',
                color: viewMode === mode.id ? 'white' : '#374151',
                border: viewMode === mode.id ? 'none' : '1px solid #d1d5db',
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
            width: '350px',
            background: '#f8fafc',
            padding: '20px',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}>
            {viewMode === 'traffic' && (
              <>
                {/* Summary Stats */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Estado del Tráfico
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Flujo Total
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                        {trafficData.reduce((sum, s) => sum + s.currentFlow, 0).toLocaleString()} veh/h
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Velocidad Promedio
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                        {(trafficData.reduce((sum, s) => sum + s.averageSpeed, 0) / trafficData.length).toFixed(1)} km/h
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Emisiones CO₂
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                        {totalCO2Emissions.toFixed(1)} ton/h
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Incidentes Activos
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                        {trafficData.reduce((sum, s) => sum + s.incidents, 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Traffic Sectors */}
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                    Sectores de Tráfico
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trafficData.map(sector => (
                      <button
                        key={sector.sectorId}
                        onClick={() => setSelectedSector(sector.sectorId)}
                        style={{
                          background: selectedSector === sector.sectorId ? getCongestionColor(sector.congestionLevel) : 'white',
                          color: selectedSector === sector.sectorId ? 'white' : '#374151',
                          border: selectedSector === sector.sectorId ? 'none' : '1px solid #e2e8f0',
                          borderLeft: `4px solid ${getCongestionColor(sector.congestionLevel)}`,
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {sector.sectorName}
                          </span>
                          <span style={{ 
                            fontSize: '10px',
                            background: selectedSector === sector.sectorId ? 'rgba(255,255,255,0.2)' : `${getCongestionColor(sector.congestionLevel)}20`,
                            color: selectedSector === sector.sectorId ? 'white' : getCongestionColor(sector.congestionLevel),
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}>
                            {sector.congestionLevel.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {sector.currentFlow} veh/h • {sector.averageSpeed} km/h
                        </div>
                        {sector.incidents > 0 && (
                          <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.9 }}>
                            ⚠️ {sector.incidents} incidente{sector.incidents > 1 ? 's' : ''}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {viewMode === 'public-transport' && (
              <>
                {/* Transport Summary */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Resumen del Sistema
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Pasajeros Totales/Día
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                        {(totalDailyPassengers / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Ocupación Promedio
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                        {averageOccupancy.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Rutas Operativas
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
                        {publicTransportData.filter(r => r.status === 'operational').length}/{publicTransportData.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transport Routes */}
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                    Rutas de Transporte
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {publicTransportData.map(route => (
                      <div key={route.routeId} style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${getStatusColor(route.status)}`,
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {getTransportIcon(route.type)} {route.routeName}
                          </span>
                          <span style={{ 
                            fontSize: '10px',
                            background: `${getStatusColor(route.status)}20`,
                            color: getStatusColor(route.status),
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}>
                            {route.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px', color: '#6b7280' }}>
                          <div>Ocupación: {route.occupancy}%</div>
                          <div>Puntualidad: {route.onTimePerformance}%</div>
                          <div>Espera: {route.averageWaitTime} min</div>
                          <div>Pasajeros: {(route.dailyPassengers / 1000).toFixed(0)}k/día</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {viewMode === 'optimization' && optimizationResults && (
              <>
                {/* Optimization Potential */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Potencial de Optimización
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {Object.entries(optimizationResults.potentialReduction).map(([key, value]) => {
                      const labels = {
                        travelTime: 'Tiempo de Viaje',
                        fuelConsumption: 'Consumo Combustible',
                        co2Emissions: 'Emisiones CO₂',
                        congestion: 'Congestión'
                      };
                      
                      return (
                        <div key={key} style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            {labels[key as keyof typeof labels]}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
                            -{(value as number)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Actions */}
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                    Acciones Prioritarias
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {optimizationResults.recommendations
                      .filter((rec: any) => rec.priority === 'high')
                      .map((rec: any, index: number) => (
                        <div key={index} style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '10px',
                          fontSize: '11px'
                        }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px', color: '#dc2626' }}>
                            🔥 {rec.description}
                          </div>
                          <div style={{ color: '#6b7280' }}>
                            {rec.impact} • S/ {(rec.cost / 1000).toFixed(0)}k
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {viewMode === 'traffic' && selectedSectorData && (
              <>
                {/* Sector Details */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                      {selectedSectorData.sectorName}
                    </h3>
                    <span style={{ 
                      fontSize: '14px',
                      background: `${getCongestionColor(selectedSectorData.congestionLevel)}20`,
                      color: getCongestionColor(selectedSectorData.congestionLevel),
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      {selectedSectorData.congestionLevel.toUpperCase()}
                    </span>
                  </div>

                  {/* Real-time Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🚗</span>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                          Flujo Vehicular
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                        {selectedSectorData.currentFlow.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        vehículos por hora
                      </div>
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                          Velocidad Promedio
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                        {selectedSectorData.averageSpeed}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        kilómetros por hora
                      </div>
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🌍</span>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                          Emisiones CO₂
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                        {selectedSectorData.co2Emissions}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        toneladas por hora
                      </div>
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🔊</span>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                          Nivel de Ruido
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                        {selectedSectorData.noiseLevel}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        decibeles
                      </div>
                    </div>
                  </div>

                  {/* Incidents */}
                  {selectedSectorData.incidents > 0 && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                        ⚠️ Incidentes Activos ({selectedSectorData.incidents})
                      </h4>
                      <div style={{ fontSize: '12px', color: '#dc2626' }}>
                        Reportes de tráfico lento y posibles accidentes. Monitoreo continuo activo.
                      </div>
                    </div>
                  )}

                  {/* Data Source */}
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    <strong>Fuentes:</strong> Sensores de tráfico, Cámaras VIIRS, Datos GPS de transporte público
                    <br />
                    <strong>Última actualización:</strong> {new Date(selectedSectorData.lastUpdated).toLocaleString()}
                  </div>
                </div>
              </>
            )}

            {viewMode === 'public-transport' && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Estado del Transporte Público
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {publicTransportData.map(route => (
                    <div key={route.routeId} style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {/* Route Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                          {getTransportIcon(route.type)} {route.routeName}
                        </h4>
                        <span style={{ 
                          fontSize: '10px',
                          background: `${getStatusColor(route.status)}20`,
                          color: getStatusColor(route.status),
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {route.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Occupancy Bar */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Ocupación</span>
                          <span style={{ fontSize: '11px', fontWeight: '500' }}>
                            {route.occupancy}%
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
                            width: `${route.occupancy}%`,
                            background: route.occupancy > 90 ? '#ef4444' : route.occupancy > 70 ? '#f59e0b' : '#10b981',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '11px'
                      }}>
                        <div>
                          <div style={{ color: '#6b7280' }}>Puntualidad</div>
                          <div style={{ fontWeight: '600' }}>
                            {route.onTimePerformance}%
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>Tiempo Espera</div>
                          <div style={{ fontWeight: '600' }}>
                            {route.averageWaitTime} min
                          </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ color: '#6b7280' }}>Pasajeros Diarios</div>
                          <div style={{ fontWeight: '600' }}>
                            {route.dailyPassengers.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Recommendations */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                    🚌 Recomendaciones del Sistema
                  </h4>
                  <div style={{ fontSize: '12px', color: '#0369a1', lineHeight: '1.5' }}>
                    <p>• <strong>Corredor Azul:</strong> Optimizar horarios en horas pico para reducir tiempo de espera</p>
                    <p>• <strong>Metropolitano Este-Oeste:</strong> Resolver incidencias técnicas para normalizar operación</p>
                    <p>• <strong>Metro Línea 1:</strong> Incrementar frecuencia en horas valle para distribuir demanda</p>
                    <p>• <strong>Sistema General:</strong> Implementar información en tiempo real para usuarios</p>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'optimization' && optimizationResults && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Plan de Optimización del Transporte
                </h3>

                {/* Optimization Chart */}
                <div style={{
                  height: '250px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #cbd5e1',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      Simulación de Optimización
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Análisis de flujo vehicular y predicción de mejoras
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                    Recomendaciones de Implementación
                  </h4>
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {optimizationResults.recommendations.map((rec: any, index: number) => {
                      const priorityColors = {
                        high: '#dc2626',
                        medium: '#d97706',
                        low: '#059669'
                      };

                      return (
                        <div key={index} style={{
                          background: '#f8fafc',
                          borderRadius: '8px',
                          padding: '16px',
                          border: '1px solid #e2e8f0',
                          borderLeft: `4px solid ${priorityColors[rec.priority as keyof typeof priorityColors]}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                              {rec.description}
                            </h5>
                            <span style={{ 
                              fontSize: '10px',
                              background: `${priorityColors[rec.priority as keyof typeof priorityColors]}20`,
                              color: priorityColors[rec.priority as keyof typeof priorityColors],
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontWeight: '600'
                            }}>
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
                            <strong>Impacto:</strong> {rec.impact}
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#374151' }}>
                            <strong>Inversión estimada:</strong> S/ {(rec.cost / 1000).toFixed(0)}k soles
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Map placeholder for all modes */}
            {!selectedSectorData && viewMode === 'traffic' && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                minHeight: '400px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                  Mapa de Tráfico en Tiempo Real
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
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>
                      Visualización de Tráfico Interactiva
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      Seleccione un sector para ver detalles
                    </div>
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

export default IntelligentTransportSystem;