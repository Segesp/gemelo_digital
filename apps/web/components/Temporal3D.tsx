"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface DataPoint {
  longitude: number;
  latitude: number;
  value: number;
  timestamp: string;
}

interface Temporal3DProps {
  data: DataPoint[];
  parameter: string;
  dataset: string;
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

function TimelineAxis({ minTime, maxTime, currentTime }: { minTime: Date, maxTime: Date, currentTime: Date }) {
  const lineRef = useRef<THREE.Group>(null);
  
  return (
    <group position={[0, -5, 0]} ref={lineRef}>
      {/* Timeline base */}
      <Line
        points={[[-50, 0, 0], [50, 0, 0]]}
        color="#666"
        lineWidth={2}
      />
      
      {/* Current time indicator */}
      <mesh position={[
        ((currentTime.getTime() - minTime.getTime()) / (maxTime.getTime() - minTime.getTime()) - 0.5) * 100,
        2,
        0
      ]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Timeline labels */}
      <Text
        position={[-50, -2, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
      >
        {minTime.toLocaleTimeString()}
      </Text>
      
      <Text
        position={[50, -2, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
      >
        {maxTime.toLocaleTimeString()}
      </Text>
      
      <Text
        position={[0, -2, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
      >
        {currentTime.toLocaleTimeString()}
      </Text>
    </group>
  );
}

function TemporalDataPoint({ 
  point, 
  position, 
  isActive, 
  opacity,
  trailPoints 
}: {
  point: DataPoint;
  position: [number, number, number];
  isActive: boolean;
  opacity: number;
  trailPoints: [number, number, number][];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isActive || hovered) {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.2);
      } else {
        meshRef.current.scale.setScalar(0.8);
      }
    }
  });

  const height = Math.max(point.value * 0.1, 1);
  const color = new THREE.Color().setHSL(
    Math.max(0, Math.min(1, 1 - point.value / 50)),
    0.8,
    0.6
  );

  return (
    <group position={position}>
      {/* Trail line */}
      {trailPoints.length > 1 && (
        <Line
          points={trailPoints}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.4}
        />
      )}
      
      {/* Data point */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        position={[0, height / 2, 0]}
        
      >
        <boxGeometry args={[0.6, height, 0.6]} />
        <meshStandardMaterial 
          color={color} 
          transparent
          opacity={opacity}
          emissive={isActive ? color : new THREE.Color(0x000000)}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
      
      {/* Value label for active points */}
      {isActive && (
        <Text
          position={[0, height + 1, 0]}
          fontSize={0.6}
          color="yellow"
          anchorX="center"
          anchorY="middle"
        >
          {point.value.toFixed(1)}
        </Text>
      )}
      
      {/* Hover details */}
      {hovered && (
        <Text
          position={[0, height + 2, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${point.value.toFixed(1)} @ ${new Date(point.timestamp).toLocaleTimeString()}`}
        </Text>
      )}
    </group>
  );
}

function ValueSurface3D({ data, currentTime }: { data: DataPoint[], currentTime: Date }) {
  const surfaceRef = useRef<THREE.Mesh>(null);
  
  const { geometry, material } = useMemo(() => {
    if (data.length === 0) return { geometry: null, material: null };
    
    // Filter data around current time (±1 hour)
    const timeWindow = 60 * 60 * 1000; // 1 hour in ms
    const relevantData = data.filter(point => {
      const pointTime = new Date(point.timestamp).getTime();
      const currentTimeMs = currentTime.getTime();
      return Math.abs(pointTime - currentTimeMs) <= timeWindow;
    });
    
    if (relevantData.length === 0) return { geometry: null, material: null };
    
    // Create interpolated surface
    const resolution = 15;
    const geometry = new THREE.PlaneGeometry(40, 40, resolution - 1, resolution - 1);
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      let totalWeight = 0;
      let weightedSum = 0;
      
      relevantData.forEach(point => {
        const [px, , pz] = latLngTo3D(point.latitude, point.longitude);
        const distance = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
        const weight = 1 / (distance + 1);
        
        totalWeight += weight;
        weightedSum += point.value * weight;
      });
      
      const interpolatedValue = totalWeight > 0 ? weightedSum / totalWeight : 0;
      positions.setY(i, interpolatedValue * 0.03);
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: '#4ade80',
      wireframe: false,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    return { geometry, material };
  }, [data, currentTime]);

  useFrame((state) => {
    if (surfaceRef.current) {
      surfaceRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  if (!geometry || !material) return null;

  return (
    <mesh 
      ref={surfaceRef} 
      geometry={geometry} 
      material={material} 
      position={[0, 1, 0]}
    />
  );
}

export default function Temporal3D({ data, parameter, dataset }: Temporal3DProps) {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSurface, setShowSurface] = useState(true);
  const [showTrails, setShowTrails] = useState(true);

  // Sort data by timestamp
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data]);

  const timeRange = useMemo(() => {
    if (sortedData.length === 0) return { min: new Date(), max: new Date() };
    return {
      min: new Date(sortedData[0].timestamp),
      max: new Date(sortedData[sortedData.length - 1].timestamp)
    };
  }, [sortedData]);

  // Auto-advance time when playing
  useEffect(() => {
    if (!isPlaying || sortedData.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentTimeIndex(prev => (prev + 1) % sortedData.length);
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, sortedData.length]);

  const currentTime = useMemo(() => {
    if (sortedData.length === 0) return new Date();
    return new Date(sortedData[currentTimeIndex]?.timestamp || sortedData[0].timestamp);
  }, [sortedData, currentTimeIndex]);

  // Process data for rendering
  const processedData = useMemo(() => {
    const currentTimeMs = currentTime.getTime();
    const timeWindow = 30 * 60 * 1000; // 30 minutes window
    
    return sortedData.map((point, index) => {
      const [x, y, z] = latLngTo3D(point.latitude, point.longitude);
      const pointTime = new Date(point.timestamp).getTime();
      const timeDiff = Math.abs(pointTime - currentTimeMs);
      const isActive = timeDiff <= timeWindow;
      const opacity = isActive ? 1 : Math.max(0.1, 1 - timeDiff / (60 * 60 * 1000)); // Fade over 1 hour
      
      // Build trail for this point
      const trailPoints: [number, number, number][] = [];
      if (showTrails) {
        for (let i = Math.max(0, index - 5); i <= index; i++) {
          if (i < sortedData.length) {
            const trailPoint = sortedData[i];
            const [tx, ty, tz] = latLngTo3D(trailPoint.latitude, trailPoint.longitude);
            trailPoints.push([tx, ty + trailPoint.value * 0.05, tz]);
          }
        }
      }
      
      return {
        point,
        position: [x, y, z] as [number, number, number],
        isActive,
        opacity,
        trailPoints
      };
    });
  }, [sortedData, currentTime, showTrails]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [40, 30, 40], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} color="#4ade80" intensity={0.5} />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={150}
        />
        
        {/* Render temporal data points */}
        {processedData.map((item, index) => (
          <TemporalDataPoint
            key={index}
            point={item.point}
            position={item.position}
            isActive={item.isActive}
            opacity={item.opacity}
            trailPoints={item.trailPoints}
          />
        ))}
        
        {/* Show interpolated surface */}
        {showSurface && <ValueSurface3D data={sortedData} currentTime={currentTime} />}
        
        {/* Timeline */}
        <TimelineAxis 
          minTime={timeRange.min} 
          maxTime={timeRange.max} 
          currentTime={currentTime} 
        />
      </Canvas>

      {/* Temporal Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        zIndex: 1000,
        minWidth: '300px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>⏰ Análisis Temporal 3D - {parameter}</strong>
        </div>
        
        {/* Playback Controls */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? '#ef4444' : '#22c55e',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'}
          </button>
          
          <button
            onClick={() => setCurrentTimeIndex(0)}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⏮️ Inicio
          </button>
        </div>

        {/* Time Slider */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Tiempo: {currentTime.toLocaleString()}
          </label>
          <input
            type="range"
            min={0}
            max={sortedData.length - 1}
            value={currentTimeIndex}
            onChange={(e) => setCurrentTimeIndex(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Speed Control */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Velocidad: {playbackSpeed}x
          </label>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Options */}
        <div style={{ fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={showSurface}
              onChange={(e) => setShowSurface(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Mostrar superficie interpolada
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showTrails}
              onChange={(e) => setShowTrails(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Mostrar trazas temporales
          </label>
        </div>

        {/* Stats */}
        <div style={{ marginTop: '12px', fontSize: '11px', lineHeight: '1.4' }}>
          <div><strong>Dataset:</strong> {dataset}</div>
          <div><strong>Puntos totales:</strong> {sortedData.length}</div>
          <div><strong>Período:</strong> {timeRange.min.toLocaleDateString()} - {timeRange.max.toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}