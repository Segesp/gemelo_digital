"use client";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

interface DataPoint {
  longitude: number;
  latitude: number;
  value: number;
  timestamp: string;
}

interface Scene3DProps {
  data: DataPoint[];
  parameter: string;
  dataset: string;
}

// Convert lat/lng to 3D coordinates (simplified projection)
function latLngTo3D(lat: number, lng: number, radius = 50): [number, number, number] {
  // Center on Chancay coordinates: -77.27, -11.57
  const centerLat = -11.57;
  const centerLng = -77.27;
  
  // Simple planar projection relative to center
  const x = (lng - centerLng) * 1000; // Scale factor for visibility
  const z = (lat - centerLat) * 1000;
  const y = 0; // Ground level
  
  return [x, y, z];
}

function DataPoints({ data, parameter }: { data: DataPoint[], parameter: string }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  const points = useMemo(() => {
    return data.map((point, index) => {
      const [x, y, z] = latLngTo3D(point.latitude, point.longitude);
      const height = Math.max(point.value * 0.1, 1); // Scale value to height
      const color = new THREE.Color().setHSL(
        Math.max(0, Math.min(1, 1 - point.value / 50)), // Hue based on value
        0.8,
        0.6
      );
      
      return (
        <mesh key={index} position={[x, height / 2, z]}>
          <boxGeometry args={[0.5, height, 0.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    });
  }, [data]);

  return <group ref={meshRef}>{points}</group>;
}

function ChancayPort3D() {
  // Simplified 3D representation of Chancay port
  return (
    <group>
      {/* Main port area */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[20, 1, 15]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      
      {/* Pier structures */}
      <mesh position={[-5, 0.2, 0]}>
        <boxGeometry args={[2, 0.4, 10]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      <mesh position={[5, 0.2, 0]}>
        <boxGeometry args={[2, 0.4, 10]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Container storage areas */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[i * 3 - 7.5, 2, -8]}>
          <boxGeometry args={[2, 4, 2]} />
          <meshStandardMaterial color="#e53e3e" />
        </mesh>
      ))}
      
      {/* Cranes */}
      {Array.from({ length: 3 }, (_, i) => (
        <group key={i} position={[i * 8 - 8, 0, 0]}>
          <mesh position={[0, 8, 0]}>
            <boxGeometry args={[0.5, 16, 0.5]} />
            <meshStandardMaterial color="#f7fafc" />
          </mesh>
          <mesh position={[0, 12, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[12, 0.3, 0.3]} />
            <meshStandardMaterial color="#f7fafc" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Animate ocean waves
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200, 50, 50]} />
      <meshStandardMaterial 
        color="#3182ce" 
        transparent 
        opacity={0.7}
        wireframe={false}
      />
    </mesh>
  );
}

function Scene3DContent({ data, parameter, dataset }: Scene3DProps) {
  const { camera } = useThree();

  return (
    <>
      <PerspectiveCamera makeDefault position={[30, 25, 30]} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.2}
      />
      
      <Environment preset="sunset" />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <Grid 
        position={[0, -0.1, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#666"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#888"
        fadeDistance={100}
        fadeStrength={1}
      />
      
      <Ocean />
      <ChancayPort3D />
      <DataPoints data={data} parameter={parameter} />
    </>
  );
}

export default function Scene3D({ data, parameter, dataset }: Scene3DProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene3DContent data={data} parameter={parameter} dataset={dataset} />
        </Suspense>
      </Canvas>
      
      {/* 3D Controls Info */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div><strong>Vista 3D - {dataset}</strong></div>
        <div>🖱️ Click y arrastra para rotar</div>
        <div>🔍 Scroll para zoom</div>
        <div>📊 Datos: {parameter}</div>
      </div>
    </div>
  );
}