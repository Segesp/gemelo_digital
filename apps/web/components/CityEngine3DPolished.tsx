// @ts-nocheck - TypeScript version conflict between three.js packages
"use client";
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Html, Box, Line, Sphere, Stats } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';

import { InstancedBuildings, GPUTerrain, PerformanceMonitor } from './PerformanceOptimizations';
import { AdvancedLighting, AdvancedPostProcessing, WeatherEffects, DynamicSkybox } from './AdvancedLighting';
import { ModernToolbar, CityMetricsDashboard, BuildingPalette } from './ModernUI';
import { useCityEngineStore, useBuildings, useRoads, useViewSettings } from '../utils/cityEngineStore';

// Enhanced main component with all polished technologies
export default function CityEngine3DInteractivePolished() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [50, 50, 50], fov: 60 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          shadowMapType: THREE.PCFSoftShadowMap
        }}
      >
        <Suspense fallback={<LoadingIndicator />}>
          {/* Advanced lighting system */}
          <AdvancedLighting />
          
          {/* Dynamic environment */}
          <DynamicSkybox weather="clear" />
          <WeatherEffects weather="clear" />
          
          {/* Camera controls with enhanced settings */}
          <CameraSystem />
          
          {/* Main city scene with performance optimizations */}
          <CityScene />
          
          {/* Advanced post-processing effects */}
          <AdvancedPostProcessing />
          
          {/* Performance monitoring */}
          <Stats />
        </Suspense>
      </Canvas>
      
      {/* Modern UI overlay */}
      <UIOverlay />
    </div>
  );
}

// Enhanced camera system with multiple modes
function CameraSystem() {
  const { cameraMode } = useViewSettings();
  const { camera } = useThree();
  
  useEffect(() => {
    // Adjust camera settings based on mode
    switch (cameraMode) {
      case 'orbit':
        camera.position.set(50, 50, 50);
        break;
      case 'flythrough':
        camera.position.set(0, 20, 0);
        break;
      case 'first_person':
        camera.position.set(0, 2, 0);
        break;
    }
  }, [cameraMode, camera]);
  
  return (
    <>
      <OrbitControls
        enabled={cameraMode === 'orbit'}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={500}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0, 0]}
      />
      <PerspectiveCamera makeDefault fov={60} />
    </>
  );
}

// Main city scene with all components
function CityScene() {
  const buildings = useBuildings();
  const roads = useRoads();
  const { terrain } = useCityEngineStore();
  const { quality } = useViewSettings();
  
  return (
    <group>
      {/* Enhanced terrain system */}
      <GPUTerrain
        heightmap={terrain.heightmap}
        size={terrain.size}
        resolution={terrain.resolution}
        material={terrain.material}
      />
      
      {/* Performance-optimized building system */}
      <InstancedBuildings 
        buildings={buildings}
        maxInstances={quality === 'low' ? 500 : quality === 'medium' ? 1000 : 2000}
      />
      
      {/* Enhanced road system */}
      <RoadSystem roads={roads} />
      
      {/* Interactive tools */}
      <InteractiveTools />
      
      {/* Grid for alignment */}
      <Grid
        args={[1000, 1000]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={500}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
    </group>
  );
}

// Enhanced road system with basic rendering
function RoadSystem({ roads }: { roads: any[] }) {
  return (
    <group>
      {roads.map(road => (
        <BasicRoadRenderer key={road.id} road={road} />
      ))}
    </group>
  );
}

function BasicRoadRenderer({ road }: { road: any }) {
  if (!road.points || road.points.length < 2) return null;
  
  return (
    <group>
      {road.points.map((point: any, index: number) => {
        if (index >= road.points.length - 1) return null;
        const nextPoint = road.points[index + 1];
        
        const start = new THREE.Vector3(...point);
        const end = new THREE.Vector3(...nextPoint);
        const distance = start.distanceTo(end);
        const midPoint = start.clone().add(end).multiplyScalar(0.5);
        
        return (
          <mesh key={index} position={midPoint.toArray()}>
            <boxGeometry args={[distance, 0.2, 4]} />
            <meshStandardMaterial color="#404040" />
          </mesh>
        );
      })}
    </group>
  );
}

// Interactive tools for city building
function InteractiveTools() {
  const { selectedTool } = useCityEngineStore();
  const [isPlacing, setIsPlacing] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);
  
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (selectedTool === 'build' && !isPlacing) {
      const point = event.intersections[0]?.point;
      if (point) {
        setPreviewPosition([point.x, point.y, point.z]);
      }
    }
  }, [selectedTool, isPlacing]);
  
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (selectedTool === 'build') {
      const point = event.intersections[0]?.point;
      if (point) {
        // Place building logic here
        setIsPlacing(true);
        setTimeout(() => setIsPlacing(false), 100);
      }
    }
  }, [selectedTool]);
  
  return (
    <group>
      {/* Invisible interaction plane */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Building preview */}
      {previewPosition && selectedTool === 'build' && (
        <BuildingPreview position={previewPosition} />
      )}
      
      {/* Measurement tools */}
      <MeasurementTools />
    </group>
  );
}

function BuildingPreview({ position }: { position: [number, number, number] }) {
  const { selectedBuildingTemplate } = useCityEngineStore();
  
  if (!selectedBuildingTemplate) return null;
  
  return (
    <group position={position}>
      <Box args={[8, 6, 10]} position={[0, 3, 0]}>
        <meshStandardMaterial
          color="#667eea"
          transparent
          opacity={0.6}
          wireframe
        />
      </Box>
      <Html position={[0, 8, 0]}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          Click to place building
        </div>
      </Html>
    </group>
  );
}

function MeasurementTools() {
  const { selectedTool } = useCityEngineStore();
  
  if (selectedTool !== 'measure') return null;
  
  return (
    <group>
      {/* Measurement tool implementation */}
    </group>
  );
}

// Loading indicator
function LoadingIndicator() {
  return (
    <Html center>
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '16px'
      }}>
        <div>🏗️ Cargando City Engine Avanzado...</div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          Inicializando tecnologías profesionales de planificación urbana
        </div>
      </div>
    </Html>
  );
}

// UI overlay system
function UIOverlay() {
  return (
    <>
      <ModernToolbar />
      <CityMetricsDashboard />
      <BuildingPalette />
      <PerformanceMonitor />
      <KeyboardShortcuts />
    </>
  );
}

// Keyboard shortcuts handler
function KeyboardShortcuts() {
  const { setSelectedTool } = useCityEngineStore();
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'b':
          setSelectedTool('build');
          break;
        case 'r':
          setSelectedTool('road');
          break;
        case 't':
          setSelectedTool('terrain');
          break;
        case 'g':
          setSelectedTool('vegetation');
          break;
        case 'm':
          setSelectedTool('measure');
          break;
        case 'z':
          setSelectedTool('zone');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setSelectedTool]);
  
  return null;
}