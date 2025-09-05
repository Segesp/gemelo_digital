"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line, Sphere, Text, OrbitControls, Environment, Grid } from '@react-three/drei';
import { useMemo, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';

interface DataPoint {
  longitude: number;
  latitude: number;
  value: number;
  timestamp: string;
}

interface Analysis3DProps {
  data: DataPoint[];
  parameter: string;
  onPointSelect?: (point: DataPoint) => void;
}

// Convert coordinates
function latLngTo3D(lat: number, lng: number): [number, number, number] {
  const centerLat = -11.57;
  const centerLng = -77.27;
  const x = (lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180) / 500;
  const z = (lat - centerLat) * 110540 / 500;
  const y = 0;
  return [x, y, z];
}

function InteractiveDataPoint({ 
  point, 
  position, 
  color, 
  height,
  onSelect,
  isSelected
}: { 
  point: DataPoint;
  position: [number, number, number];
  color: THREE.Color;
  height: number;
  onSelect?: (point: DataPoint) => void;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.setScalar(1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect?.(point)}
        position={[0, height / 2, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.4, 0.6, height, 8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={isSelected ? color.clone().multiplyScalar(0.4) : 
                   hovered ? color.clone().multiplyScalar(0.2) : undefined}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.3 : 0}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <Sphere 
        args={[0.2]} 
        position={[0, height + 0.5, 0]}
      >
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </Sphere>
      
      <Text
        position={[0, height + 1.2, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {point.value.toFixed(1)}
      </Text>
      
      {hovered && (
        <Html position={[0, height + 2, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            minWidth: '160px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <strong style={{ color: '#60a5fa' }}>📊 {point.value.toFixed(2)}</strong>
            </div>
            <div>📍 Lat: {point.latitude.toFixed(4)}</div>
            <div>📍 Lng: {point.longitude.toFixed(4)}</div>
            <div>⏰ {new Date(point.timestamp).toLocaleString()}</div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
              Click para seleccionar
            </div>
          </div>
        </Html>
      )}
      
      {isSelected && (
        <Line
          points={[
            [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [-1, 0, -1]
          ]}
          color="#fbbf24"
          lineWidth={3}
        />
      )}
    </group>
  );
}

function AnalysisStats({ data, selectedPoint }: { data: DataPoint[], selectedPoint: DataPoint | null }) {
  const stats = useMemo(() => {
    if (data.length === 0) return { average: 0, min: 0, max: 0, count: 0, deviation: 0 };
    
    const values = data.map(p => p.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const deviation = Math.sqrt(
      values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length
    );
    
    return { average, min, max, count: data.length, deviation };
  }, [data]);

  return (
    <Html position={[0, 15, 0]} center>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        fontSize: '14px',
        minWidth: '280px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px' }}>
          📊 Análisis Estadístico
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Promedio</div>
            <div style={{ color: '#059669', fontWeight: 'bold' }}>{stats.average.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Desv. Estándar</div>
            <div style={{ color: '#dc2626', fontWeight: 'bold' }}>{stats.deviation.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Mínimo</div>
            <div style={{ color: '#2563eb', fontWeight: 'bold' }}>{stats.min.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Máximo</div>
            <div style={{ color: '#ea580c', fontWeight: 'bold' }}>{stats.max.toFixed(2)}</div>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
          <div style={{ color: '#64748b', fontSize: '12px' }}>Total de Puntos</div>
          <div style={{ color: '#1e293b', fontWeight: 'bold' }}>{stats.count}</div>
        </div>
        
        {selectedPoint && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Punto Seleccionado</div>
            <div style={{ color: '#7c3aed', fontWeight: 'bold' }}>
              {selectedPoint.value.toFixed(2)} | {new Date(selectedPoint.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}

function Analysis3DContent({ data, parameter, onPointSelect }: Analysis3DProps) {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  const handlePointSelect = (point: DataPoint) => {
    setSelectedPoint(point);
    onPointSelect?.(point);
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const maxValue = Math.max(...data.map(p => p.value));
    const minValue = Math.min(...data.map(p => p.value));
    
    return data.map(point => {
      const [x, y, z] = latLngTo3D(point.latitude, point.longitude);
      const normalizedValue = maxValue > minValue ? 
        (point.value - minValue) / (maxValue - minValue) : 0.5;
      const height = Math.max(normalizedValue * 12 + 1, 0.5);
      
      const color = new THREE.Color().setHSL(
        (1 - normalizedValue) * 0.6,
        0.8,
        0.5
      );
      
      return { ...point, position: [x, y, z] as [number, number, number], height, color };
    });
  }, [data]);

  return (
    <>
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.05}
        enableDamping
      />
      
      <Environment preset="dawn" />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 20, 15]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <Grid 
        position={[0, -0.5, 0]}
        args={[100, 100]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#666"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#888"
        fadeDistance={50}
        fadeStrength={1}
      />

      {processedData.map((point, index) => (
        <InteractiveDataPoint
          key={index}
          point={point}
          position={point.position}
          color={point.color}
          height={point.height}
          onSelect={handlePointSelect}
          isSelected={selectedPoint === point}
        />
      ))}
      
      <AnalysisStats data={data} selectedPoint={selectedPoint} />
    </>
  );
}

export default function Analysis3D({ data, parameter, onPointSelect }: Analysis3DProps) {
  return (
    <div className="canvas-container">
      <Canvas shadows camera={{ position: [25, 20, 25], fov: 60 }}>
        <Suspense fallback={null}>
          <Analysis3DContent data={data} parameter={parameter} onPointSelect={onPointSelect} />
        </Suspense>
      </Canvas>
      
      <div className="stats-overlay">
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#7c3aed' }}>📊 Vista Análisis 3D - {parameter}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          <div>🖱️ <strong>Click:</strong> Seleccionar punto de datos</div>
          <div>👆 <strong>Hover:</strong> Ver detalles del punto</div>
          <div>🔄 <strong>Rotación:</strong> Arrastrar para rotar vista</div>
          <div>📈 <strong>Análisis:</strong> Estadísticas en tiempo real</div>
          <div style={{ marginTop: '8px', padding: '4px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '4px' }}>
            <strong>🎯 Funciones:</strong> Análisis interactivo con estadísticas en tiempo real
          </div>
        </div>
      </div>
    </div>
  );
}