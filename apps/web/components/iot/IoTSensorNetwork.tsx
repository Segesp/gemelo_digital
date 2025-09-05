// @ts-nocheck - TypeScript version conflict between three.js packages
"use client";
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, Line, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

// IoT Sensor Network - Real-time Digital Twin Integration
export function IoTSensorNetwork() {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [networkConnections, setNetworkConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Initialize IoT sensor network
    const initialSensors: IoTSensor[] = [
      {
        id: 'air-001',
        type: 'air_quality',
        position: [20, 5, 30],
        status: 'active',
        data: { pm25: 15.2, co2: 420, temperature: 23.5, humidity: 65 },
        lastUpdate: new Date(),
        batteryLevel: 85
      },
      {
        id: 'traffic-002',
        type: 'traffic',
        position: [45, 8, 15],
        status: 'active',
        data: { vehicleCount: 127, avgSpeed: 35.2, congestionLevel: 0.3 },
        lastUpdate: new Date(),
        batteryLevel: 92
      },
      {
        id: 'noise-003',
        type: 'noise',
        position: [10, 6, 50],
        status: 'active',
        data: { decibels: 58.3, avgLevel: 55.1, peakLevel: 72.8 },
        lastUpdate: new Date(),
        batteryLevel: 78
      },
      {
        id: 'energy-004',
        type: 'energy',
        position: [60, 4, 40],
        status: 'active',
        data: { consumption: 245.7, production: 180.3, efficiency: 0.73 },
        lastUpdate: new Date(),
        batteryLevel: 95
      },
      {
        id: 'water-005',
        type: 'water',
        position: [35, 3, 60],
        status: 'active',
        data: { flow: 1250, pressure: 2.8, quality: 0.95 },
        lastUpdate: new Date(),
        batteryLevel: 88
      },
      {
        id: 'parking-006',
        type: 'parking',
        position: [25, 2, 25],
        status: 'active',
        data: { occupancy: 0.67, available: 45, total: 137 },
        lastUpdate: new Date(),
        batteryLevel: 91
      }
    ];

    setSensors(initialSensors);

    // Generate network connections
    const connections: Connection[] = [];
    for (let i = 0; i < initialSensors.length; i++) {
      for (let j = i + 1; j < initialSensors.length; j++) {
        const distance = new THREE.Vector3(...initialSensors[i].position)
          .distanceTo(new THREE.Vector3(...initialSensors[j].position));
        
        if (distance < 40) { // Connect nearby sensors
          connections.push({
            from: initialSensors[i].id,
            to: initialSensors[j].id,
            strength: Math.max(0.1, 1 - distance / 40),
            dataFlow: Math.random() * 100
          });
        }
      }
    }
    
    setNetworkConnections(connections);

    // Simulate real-time data updates
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => ({
        ...sensor,
        data: updateSensorData(sensor),
        lastUpdate: new Date(),
        batteryLevel: Math.max(0, sensor.batteryLevel - Math.random() * 0.1)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {/* Sensor nodes */}
      {sensors.map(sensor => (
        <IoTSensorNode
          key={sensor.id}
          sensor={sensor}
          isSelected={selectedSensor === sensor.id}
          onSelect={() => setSelectedSensor(sensor.id === selectedSensor ? null : sensor.id)}
        />
      ))}

      {/* Network connections */}
      <NetworkConnections sensors={sensors} connections={networkConnections} />

      {/* IoT Dashboard */}
      <IoTDashboard sensors={sensors} />
    </group>
  );
}

// Individual IoT sensor node
function IoTSensorNode({ sensor, isSelected, onSelect }: {
  sensor: IoTSensor;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pulsing, setPulsing] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing animation for active sensors
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 3) * 0.2;
      meshRef.current.scale.setScalar(isSelected ? scale : 1);

      // Status-based coloring
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (sensor.status === 'active') {
        material.color.setHex(0x4ade80); // Green
        material.emissive.setHex(isSelected ? 0x002200 : 0x001100);
      } else if (sensor.status === 'warning') {
        material.color.setHex(0xfbbf24); // Yellow
        material.emissive.setHex(isSelected ? 0x221100 : 0x110800);
      } else {
        material.color.setHex(0xef4444); // Red
        material.emissive.setHex(isSelected ? 0x220000 : 0x110000);
      }
    }
  });

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'air_quality': return '🌬️';
      case 'traffic': return '🚗';
      case 'noise': return '🔊';
      case 'energy': return '⚡';
      case 'water': return '💧';
      case 'parking': return '🅿️';
      default: return '📡';
    }
  };

  return (
    <group position={sensor.position}>
      {/* Sensor sphere */}
      <mesh ref={meshRef} onClick={onSelect} scale={isSelected ? 1.5 : 1}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Sensor antenna */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Data transmission beam */}
      <DataBeam sensor={sensor} />

      {/* Sensor info display */}
      <Billboard position={[0, 3, 0]}>
        <Text
          fontSize={1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {getSensorIcon(sensor.type)}
        </Text>
      </Billboard>

      {/* Detailed info when selected */}
      {isSelected && (
        <Html position={[2, 0, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            fontSize: '12px',
            minWidth: '200px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {getSensorIcon(sensor.type)} {sensor.id.toUpperCase()}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              Estado: <span style={{ 
                color: sensor.status === 'active' ? '#4ade80' : '#ef4444' 
              }}>
                {sensor.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              🔋 Batería: {sensor.batteryLevel.toFixed(1)}%
            </div>

            <div style={{ marginBottom: '8px' }}>
              📡 Última actualización: {sensor.lastUpdate.toLocaleTimeString()}
            </div>

            <div style={{ fontSize: '11px', opacity: 0.8 }}>
              <SensorDataDisplay type={sensor.type} data={sensor.data} />
            </div>
          </div>
        </Html>
      )}

      {/* Battery level indicator */}
      <BatteryIndicator level={sensor.batteryLevel} position={[0, -2, 0]} />
    </group>
  );
}

// Data transmission beam effect
function DataBeam({ sensor }: { sensor: IoTSensor }) {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (beamRef.current && sensor.status === 'active') {
      const time = state.clock.getElapsedTime();
      beamRef.current.position.y = 2 + Math.sin(time * 4) * 0.5;
      beamRef.current.scale.y = 1 + Math.sin(time * 6) * 0.3;
      
      const material = beamRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(time * 8) * 0.2;
    }
  });

  if (sensor.status !== 'active') return null;

  return (
    <mesh ref={beamRef} position={[0, 3, 0]}>
      <cylinderGeometry args={[0.3, 0.1, 2]} />
      <meshBasicMaterial
        color="#4ade80"
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

// Battery level indicator
function BatteryIndicator({ level, position }: { level: number; position: [number, number, number] }) {
  const color = level > 50 ? '#4ade80' : level > 20 ? '#fbbf24' : '#ef4444';
  
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.2, 0.3, 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      <mesh position={[-(1.2 - (level / 100) * 1.2) / 2, 0, 0.05]}>
        <boxGeometry args={[(level / 100) * 1.2, 0.25, 0.05]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      <Billboard position={[0, 0.5, 0]}>
        <Text
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {level.toFixed(0)}%
        </Text>
      </Billboard>
    </group>
  );
}

// Network connections visualization
function NetworkConnections({ sensors, connections }: {
  sensors: IoTSensor[];
  connections: Connection[];
}) {
  return (
    <group>
      {connections.map((connection, index) => {
        const fromSensor = sensors.find(s => s.id === connection.from);
        const toSensor = sensors.find(s => s.id === connection.to);
        
        if (!fromSensor || !toSensor) return null;

        return (
          <NetworkLine
            key={index}
            from={fromSensor.position}
            to={toSensor.position}
            strength={connection.strength}
            dataFlow={connection.dataFlow}
          />
        );
      })}
    </group>
  );
}

// Individual network connection line
function NetworkLine({ from, to, strength, dataFlow }: {
  from: [number, number, number];
  to: [number, number, number];
  strength: number;
  dataFlow: number;
}) {
  const lineRef = useRef<THREE.BufferGeometry>(null);

  useFrame((state) => {
    if (lineRef.current) {
      const time = state.clock.getElapsedTime();
      const positions = lineRef.current.attributes.position.array as Float32Array;
      
      // Animate the connection line
      for (let i = 0; i < positions.length; i += 3) {
        const t = (i / 3) / (positions.length / 3 - 1);
        const wave = Math.sin(time * 3 + t * Math.PI * 2) * 0.5;
        positions[i + 1] += wave * 0.1; // Y offset for wave effect
      }
      
      lineRef.current.attributes.position.needsUpdate = true;
    }
  });

  const points = [];
  const segments = 20;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 2; // Arc effect
    const z = from[2] + (to[2] - from[2]) * t;
    points.push(new THREE.Vector3(x, y, z));
  }

  return (
    <Line
      points={points}
      color={`hsl(${120 + strength * 60}, 70%, 50%)`}
      lineWidth={strength * 3 + 1}
      transparent
      opacity={0.6}
    />
  );
}

// IoT Dashboard overlay
function IoTDashboard({ sensors }: { sensors: IoTSensor[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOverallHealth = () => {
    const activeSensors = sensors.filter(s => s.status === 'active').length;
    return (activeSensors / sensors.length) * 100;
  };

  const getAverageSignal = () => {
    const avgBattery = sensors.reduce((sum, s) => sum + s.batteryLevel, 0) / sensors.length;
    return avgBattery;
  };

  return (
    <Html position={[0, 0, 0]}>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: isExpanded ? '300px' : '60px',
        height: isExpanded ? '400px' : '60px',
        background: 'rgba(0,0,0,0.9)',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        zIndex: 1001
      }}>
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '30px',
            height: '30px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📡
        </button>

        {isExpanded && (
          <div style={{ padding: '60px 20px 20px' }}>
            <h3 style={{ margin: '0 0 15px', fontSize: '16px' }}>
              🌐 Red IoT
            </h3>

            <div style={{ fontSize: '12px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                📊 Salud de la red: {getOverallHealth().toFixed(0)}%
              </div>
              <div style={{ marginBottom: '8px' }}>
                🔋 Batería promedio: {getAverageSignal().toFixed(1)}%
              </div>
              <div>
                📡 Sensores activos: {sensors.filter(s => s.status === 'active').length}/{sensors.length}
              </div>
            </div>

            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '11px'
            }}>
              {sensors.map(sensor => (
                <div
                  key={sensor.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    marginBottom: '5px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '5px',
                    border: `1px solid ${sensor.status === 'active' ? '#4ade80' : '#ef4444'}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {sensor.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div style={{ opacity: 0.7 }}>
                      {sensor.id}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: sensor.status === 'active' ? '#4ade80' : '#ef4444'
                    }}>
                      {sensor.status === 'active' ? '🟢' : '🔴'}
                    </div>
                    <div>{sensor.batteryLevel.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}

// Helper functions
function updateSensorData(sensor: IoTSensor): any {
  switch (sensor.type) {
    case 'air_quality':
      return {
        pm25: Math.max(0, sensor.data.pm25 + (Math.random() - 0.5) * 2),
        co2: Math.max(300, sensor.data.co2 + (Math.random() - 0.5) * 20),
        temperature: Math.max(0, sensor.data.temperature + (Math.random() - 0.5) * 1),
        humidity: Math.max(0, Math.min(100, sensor.data.humidity + (Math.random() - 0.5) * 5))
      };
    
    case 'traffic':
      return {
        vehicleCount: Math.max(0, sensor.data.vehicleCount + Math.floor((Math.random() - 0.5) * 20)),
        avgSpeed: Math.max(0, sensor.data.avgSpeed + (Math.random() - 0.5) * 5),
        congestionLevel: Math.max(0, Math.min(1, sensor.data.congestionLevel + (Math.random() - 0.5) * 0.1))
      };
    
    case 'noise':
      return {
        decibels: Math.max(30, sensor.data.decibels + (Math.random() - 0.5) * 5),
        avgLevel: Math.max(30, sensor.data.avgLevel + (Math.random() - 0.5) * 2),
        peakLevel: Math.max(40, sensor.data.peakLevel + (Math.random() - 0.5) * 10)
      };
    
    case 'energy':
      return {
        consumption: Math.max(0, sensor.data.consumption + (Math.random() - 0.5) * 20),
        production: Math.max(0, sensor.data.production + (Math.random() - 0.5) * 15),
        efficiency: Math.max(0, Math.min(1, sensor.data.efficiency + (Math.random() - 0.5) * 0.05))
      };
    
    case 'water':
      return {
        flow: Math.max(0, sensor.data.flow + (Math.random() - 0.5) * 100),
        pressure: Math.max(0, sensor.data.pressure + (Math.random() - 0.5) * 0.2),
        quality: Math.max(0, Math.min(1, sensor.data.quality + (Math.random() - 0.5) * 0.02))
      };
    
    case 'parking':
      return {
        ...sensor.data,
        occupancy: Math.max(0, Math.min(1, sensor.data.occupancy + (Math.random() - 0.5) * 0.1)),
        available: Math.max(0, sensor.data.total - Math.floor(sensor.data.total * sensor.data.occupancy))
      };
    
    default:
      return sensor.data;
  }
}

function SensorDataDisplay({ type, data }: { type: string; data: any }) {
  switch (type) {
    case 'air_quality':
      return (
        <div>
          <div>PM2.5: {data.pm25.toFixed(1)} μg/m³</div>
          <div>CO2: {data.co2.toFixed(0)} ppm</div>
          <div>Temperatura: {data.temperature.toFixed(1)}°C</div>
          <div>Humedad: {data.humidity.toFixed(0)}%</div>
        </div>
      );
    
    case 'traffic':
      return (
        <div>
          <div>Vehículos: {data.vehicleCount}</div>
          <div>Velocidad promedio: {data.avgSpeed.toFixed(1)} km/h</div>
          <div>Congestión: {(data.congestionLevel * 100).toFixed(0)}%</div>
        </div>
      );
    
    case 'noise':
      return (
        <div>
          <div>Nivel actual: {data.decibels.toFixed(1)} dB</div>
          <div>Promedio: {data.avgLevel.toFixed(1)} dB</div>
          <div>Pico máximo: {data.peakLevel.toFixed(1)} dB</div>
        </div>
      );
    
    case 'energy':
      return (
        <div>
          <div>Consumo: {data.consumption.toFixed(1)} kW</div>
          <div>Producción: {data.production.toFixed(1)} kW</div>
          <div>Eficiencia: {(data.efficiency * 100).toFixed(1)}%</div>
        </div>
      );
    
    case 'water':
      return (
        <div>
          <div>Flujo: {data.flow.toFixed(0)} L/min</div>
          <div>Presión: {data.pressure.toFixed(1)} bar</div>
          <div>Calidad: {(data.quality * 100).toFixed(1)}%</div>
        </div>
      );
    
    case 'parking':
      return (
        <div>
          <div>Ocupación: {(data.occupancy * 100).toFixed(0)}%</div>
          <div>Disponibles: {data.available}</div>
          <div>Total: {data.total}</div>
        </div>
      );
    
    default:
      return <div>Datos no disponibles</div>;
  }
}

// TypeScript interfaces
interface IoTSensor {
  id: string;
  type: 'air_quality' | 'traffic' | 'noise' | 'energy' | 'water' | 'parking';
  position: [number, number, number];
  status: 'active' | 'inactive' | 'warning';
  data: any;
  lastUpdate: Date;
  batteryLevel: number;
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  dataFlow: number;
}