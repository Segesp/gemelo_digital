"use client";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Html } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState } from 'react';
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

// Convert lat/lng to 3D coordinates (improved projection)
function latLngTo3D(lat: number, lng: number): [number, number, number] {
  const centerLat = -11.57;
  const centerLng = -77.27;
  
  // More accurate planar projection for better spatial representation
  const x = (lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180) / 1000; // Convert to km
  const z = (lat - centerLat) * 110540 / 1000; // Convert to km
  const y = 0;
  
  return [x, y, z];
}

function InteractiveDataPoint({ 
  point, 
  position, 
  height, 
  color, 
  onHover 
}: { 
  point: DataPoint; 
  position: [number, number, number]; 
  height: number; 
  color: THREE.Color;
  onHover: (point: DataPoint | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.2 + Math.sin(Date.now() * 0.01) * 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerEnter={() => {
          setHovered(true);
          onHover(point);
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        <cylinderGeometry args={[0.3, 0.5, height, 8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={hovered ? color.clone().multiplyScalar(0.3) : undefined}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Value label */}
      <Text
        position={[0, height + 1, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        visible={hovered}
      >
        {point.value.toFixed(1)}
      </Text>
      
      {/* Connection line to ground */}
      <mesh position={[0, height / 4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, height / 2]} />
        <meshBasicMaterial color="#666" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function DataPoints({ data, parameter, onHover }: { 
  data: DataPoint[], 
  parameter: string,
  onHover: (point: DataPoint | null) => void 
}) {
  const groupRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const maxValue = Math.max(...data.map(p => p.value));
    const minValue = Math.min(...data.map(p => p.value));
    
    return data.map((point, index) => {
      const [x, y, z] = latLngTo3D(point.latitude, point.longitude);
      const normalizedValue = maxValue > minValue ? 
        (point.value - minValue) / (maxValue - minValue) : 0.5;
      const height = Math.max(normalizedValue * 15 + 2, 1);
      
      // Color based on value with better gradient
      const color = new THREE.Color().setHSL(
        (1 - normalizedValue) * 0.7, // Blue to red gradient
        0.8,
        0.6
      );
      
      return (
        <InteractiveDataPoint
          key={index}
          point={point}
          position={[x, y, z]}
          height={height}
          color={color}
          onHover={onHover}
        />
      );
    });
  }, [data, onHover]);

  return <group ref={groupRef}>{points}</group>;
}

function EnhancedChancayPort3D() {
  return (
    <group>
      {/* Main port platform */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[25, 1, 20]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      
      {/* Port buildings */}
      <mesh position={[-8, 2.5, -6]} castShadow>
        <boxGeometry args={[4, 5, 3]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      <mesh position={[8, 1.5, -6]} castShadow>
        <boxGeometry args={[3, 3, 4]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Pier structures with improved detail */}
      <mesh position={[-10, 0.2, 2]} receiveShadow>
        <boxGeometry args={[3, 0.4, 15]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      
      <mesh position={[10, 0.2, 2]} receiveShadow>
        <boxGeometry args={[3, 0.4, 15]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      
      {/* Container storage areas with variety */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[i * 2.5 - 8.75, 2 + Math.random() * 0.5, -10]} castShadow>
          <boxGeometry args={[2, 3 + Math.random() * 2, 2]} />
          <meshStandardMaterial color={['#e53e3e', '#38a169', '#3182ce', '#d69e2e'][i % 4]} />
        </mesh>
      ))}
      
      {/* Port cranes with detailed structure */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i} position={[i * 6 - 9, 0, 5]}>
          {/* Main mast */}
          <mesh position={[0, 10, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.5, 20]} />
            <meshStandardMaterial color="#f7fafc" />
          </mesh>
          
          {/* Horizontal boom */}
          <mesh position={[6, 15, 0]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[12, 0.4, 0.4]} />
            <meshStandardMaterial color="#f7fafc" />
          </mesh>
          
          {/* Counter-boom */}
          <mesh position={[-3, 15, 0]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[6, 0.4, 0.4]} />
            <meshStandardMaterial color="#f7fafc" />
          </mesh>
          
          {/* Operator cabin */}
          <mesh position={[0, 12, 0]} castShadow>
            <boxGeometry args={[2, 1.5, 1.5]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
        </group>
      ))}
      
      {/* Port labels */}
      <Text
        position={[0, 8, -15]}
        fontSize={2}
        color="#1a202c"
        anchorX="center"
        anchorY="middle"
      >
        Puerto de Chancay
      </Text>
    </group>
  );
}

function AnimatedOcean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Create wave effect
          pos.z += sin(pos.x * 0.1 + time) * 0.5;
          pos.z += sin(pos.y * 0.1 + time * 0.7) * 0.3;
          
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec2 uv = vUv;
          
          // Create water color with waves
          vec3 waterColor = vec3(0.1, 0.4, 0.8);
          vec3 deepWater = vec3(0.0, 0.2, 0.6);
          
          float wave = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time * 0.7) * 0.1;
          vec3 color = mix(deepWater, waterColor, 0.5 + wave);
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      uniforms: {
        time: { value: 0 }
      },
      transparent: true
    });
  }, []);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 300, 100, 100]} />
      <shaderMaterial ref={materialRef} attach="material" {...shaderMaterial} />
    </mesh>
  );
}

function Scene3DContent({ data, parameter, dataset }: Scene3DProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  return (
    <>
      <PerspectiveCamera makeDefault position={[40, 30, 40]} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={15}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.05}
        enableDamping
      />
      
      <Environment preset="dawn" />
      
      {/* Improved lighting setup */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Secondary lighting */}
      <pointLight position={[-20, 15, -20]} intensity={0.5} color="#ffa500" />
      
      <Grid 
        position={[0, -0.1, 0]}
        args={[300, 300]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#444"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#666"
        fadeDistance={150}
        fadeStrength={1}
      />
      
      <AnimatedOcean />
      <EnhancedChancayPort3D />
      <DataPoints data={data} parameter={parameter} onHover={setHoveredPoint} />
      
      {/* Hover info display */}
      {hoveredPoint && (
        <Html position={latLngTo3D(hoveredPoint.latitude, hoveredPoint.longitude).map((v, i) => i === 1 ? v + 20 : v) as [number, number, number]}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            minWidth: '120px'
          }}>
            <div><strong>{parameter}</strong></div>
            <div>Valor: {hoveredPoint.value.toFixed(2)}</div>
            <div>Lat: {hoveredPoint.latitude.toFixed(4)}</div>
            <div>Lng: {hoveredPoint.longitude.toFixed(4)}</div>
            <div>Tiempo: {new Date(hoveredPoint.timestamp).toLocaleTimeString()}</div>
          </div>
        </Html>
      )}
    </>
  );
}

export default function Scene3D({ data, parameter, dataset }: Scene3DProps) {
  return (
    <div className="canvas-container">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene3DContent data={data} parameter={parameter} dataset={dataset} />
        </Suspense>
      </Canvas>
      
      {/* Enhanced 3D Controls Info */}
      <div className="stats-overlay">
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#1e40af' }}>🏗️ Vista 3D Escena - {dataset}</strong>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          <div>🖱️ <strong>Rotación:</strong> Click izquierdo + arrastrar</div>
          <div>🔍 <strong>Zoom:</strong> Rueda del ratón</div>
          <div>👆 <strong>Pan:</strong> Click derecho + arrastrar</div>
          <div>📊 <strong>Parámetro:</strong> {parameter}</div>
          <div>📈 <strong>Puntos:</strong> {data.length}</div>
          <div style={{ marginTop: '8px', padding: '4px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }}>
            <strong>💡 Tip:</strong> Pasa el cursor sobre los cilindros para ver detalles
          </div>
        </div>
      </div>
    </div>
  );
}