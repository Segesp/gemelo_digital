"use client";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, Sphere, Text } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
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

// Convert lat/lng to 3D coordinates
function latLngTo3D(lat: number, lng: number): [number, number, number] {
  const centerLat = -11.57;
  const centerLng = -77.27;
  const x = (lng - centerLng) * 1000;
  const z = (lat - centerLat) * 1000;
  const y = 0;
  return [x, y, z];
}

function InteractiveDataPoint({ 
  point, 
  position, 
  color, 
  height,
  onSelect 
}: { 
  point: DataPoint;
  position: [number, number, number];
  color: THREE.Color;
  height: number;
  onSelect?: (point: DataPoint) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
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
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={hovered ? color : new THREE.Color(0x000000)}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      
      {/* Value label */}
      <Text
        position={[0, height + 1, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {point.value.toFixed(1)}
      </Text>
      
      {/* Hover info */}
      {hovered && (
        <Html position={[0, height + 2, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            minWidth: '120px'
          }}>
            <div><strong>Valor: {point.value}</strong></div>
            <div>Lat: {point.latitude.toFixed(4)}</div>
            <div>Lng: {point.longitude.toFixed(4)}</div>
            <div>Tiempo: {new Date(point.timestamp).toLocaleTimeString()}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function DataConnections({ data }: { data: DataPoint[] }) {
  const lines = useMemo(() => {
    if (data.length < 2) return [];
    
    const connections: [number, number, number][][] = [];
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (let i = 0; i < sortedData.length - 1; i++) {
      const current = latLngTo3D(sortedData[i].latitude, sortedData[i].longitude);
      const next = latLngTo3D(sortedData[i + 1].latitude, sortedData[i + 1].longitude);
      
      // Add height based on value
      current[1] = sortedData[i].value * 0.1;
      next[1] = sortedData[i + 1].value * 0.1;
      
      connections.push([current, next]);
    }
    
    return connections;
  }, [data]);

  return (
    <>
      {lines.map((line, index) => (
        <Line
          key={index}
          points={line}
          color="#61dafb"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  );
}

function ValueSurface({ data }: { data: DataPoint[] }) {
  const surfaceRef = useRef<THREE.Mesh>(null);
  
  const { geometry, material } = useMemo(() => {
    if (data.length === 0) return { geometry: null, material: null };
    
    // Create a grid for interpolated surface
    const resolution = 20;
    const geometry = new THREE.PlaneGeometry(50, 50, resolution - 1, resolution - 1);
    const positions = geometry.attributes.position;
    
    // Interpolate values to grid
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Find nearest data points and interpolate
      let totalWeight = 0;
      let weightedSum = 0;
      
      data.forEach(point => {
        const [px, , pz] = latLngTo3D(point.latitude, point.longitude);
        const distance = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
        const weight = 1 / (distance + 1); // Inverse distance weighting
        
        totalWeight += weight;
        weightedSum += point.value * weight;
      });
      
      const interpolatedValue = totalWeight > 0 ? weightedSum / totalWeight : 0;
      positions.setY(i, interpolatedValue * 0.05); // Scale height
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: '#4ade80',
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    
    return { geometry, material };
  }, [data]);

  if (!geometry || !material) return null;

  return (
    <mesh ref={surfaceRef} geometry={geometry} material={material} />
  );
}

function HeatmapAnalysis({ data }: { data: DataPoint[] }) {
  const circles = useMemo(() => {
    return data.map((point, index) => {
      const [x, y, z] = latLngTo3D(point.latitude, point.longitude);
      const intensity = point.value / 50; // Normalize intensity
      const radius = Math.max(intensity * 5, 0.5);
      
      return (
        <Sphere
          key={index}
          position={[x, 0.1, z]}
          args={[radius, 16, 16]}
        >
          <meshStandardMaterial
            color={new THREE.Color().setHSL(1 - intensity, 0.8, 0.6)}
            transparent
            opacity={0.6}
          />
        </Sphere>
      );
    });
  }, [data]);

  return <>{circles}</>;
}

export default function Analysis3D({ data, parameter, onPointSelect }: Analysis3DProps) {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'points' | 'surface' | 'heatmap' | 'connections'>('points');

  const processedData = useMemo(() => {
    return data.map(point => {
      const [x, y, z] = latLngTo3D(point.latitude, point.longitude);
      const height = Math.max(point.value * 0.1, 1);
      const color = new THREE.Color().setHSL(
        Math.max(0, Math.min(1, 1 - point.value / 50)),
        0.8,
        0.6
      );
      
      return { point, position: [x, y, z] as [number, number, number], height, color };
    });
  }, [data]);

  const handlePointSelect = (point: DataPoint) => {
    setSelectedPoint(point);
    onPointSelect?.(point);
  };

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length);
    
    return { avg, min, max, stdDev, count: data.length };
  }, [data]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Analysis Mode Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '8px' }}><strong>Análisis 3D - {parameter}</strong></div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Modo de visualización:</label>
          <select 
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value as any)}
            style={{ 
              background: '#374151', 
              color: 'white', 
              border: '1px solid #6b7280',
              borderRadius: '4px',
              padding: '4px',
              width: '100%'
            }}
          >
            <option value="points">Puntos de datos</option>
            <option value="surface">Superficie interpolada</option>
            <option value="heatmap">Mapa de calor</option>
            <option value="connections">Conexiones temporales</option>
          </select>
        </div>

        {stats && (
          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
            <div><strong>Estadísticas:</strong></div>
            <div>Puntos: {stats.count}</div>
            <div>Promedio: {stats.avg.toFixed(2)}</div>
            <div>Min/Max: {stats.min.toFixed(1)} / {stats.max.toFixed(1)}</div>
            <div>Desv. Est: {stats.stdDev.toFixed(2)}</div>
          </div>
        )}

        {selectedPoint && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
            fontSize: '11px'
          }}>
            <div><strong>Punto seleccionado:</strong></div>
            <div>Valor: {selectedPoint.value}</div>
            <div>Coordenadas: {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}</div>
            <div>Tiempo: {new Date(selectedPoint.timestamp).toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [30, 25, 30], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />
        
        {analysisMode === 'points' && (
          <>
            {processedData.map((item, index) => (
              <InteractiveDataPoint
                key={index}
                point={item.point}
                position={item.position}
                color={item.color}
                height={item.height}
                onSelect={handlePointSelect}
              />
            ))}
          </>
        )}
        
        {analysisMode === 'surface' && <ValueSurface data={data} />}
        {analysisMode === 'heatmap' && <HeatmapAnalysis data={data} />}
        {analysisMode === 'connections' && <DataConnections data={data} />}
      </Canvas>
    </div>
  );
}