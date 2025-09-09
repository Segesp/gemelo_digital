// @ts-nocheck - TypeScript version conflict between three.js packages
"use client";
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Html, Box, Line, Sphere, Stats } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';

import { ProfessionalRoadBuilder, ProfessionalMeasurementTools, ProfessionalExportTools } from './ProfessionalUrbanToolsFixed';
import { InstancedBuildings, GPUTerrain, PerformanceMonitor } from './PerformanceOptimizations';
import { AdvancedLighting, AdvancedPostProcessing, WeatherEffects, DynamicSkybox } from './AdvancedLighting';
import { ModernToolbar, CityMetricsDashboard, BuildingPalette } from './ModernUI';
import { useCityEngineStore, useBuildings, useRoads, useViewSettings } from '../utils/cityEngineStore';

// Enhanced interfaces for professional 3D interaction
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface BuildingData {
  id: string;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  type: 'residential' | 'commercial' | 'industrial' | 'port' | 'civic' | 'recreation';
  color: string;
  rotation: number;
  properties: {
    floors: number;
    buildingName: string;
    units?: number;
    capacity?: number;
    employees?: number;
    serviceRadius?: number;
    value: number;
    yearBuilt: number;
    condition: number;
  };
  economics: {
    constructionCost: number;
    maintenanceCost: number;
    revenue?: number;
    operatingCosts?: number;
    propertyTax: number;
  };
  environment: {
    pollutionGenerated: number;
    noiseLevel: number;
    energyEfficiency: number;
    powerConsumption: number;
    waterConsumption: number;
  };
}

interface BuildingTemplate {
  id: string;
  name: string;
  type: BuildingData['type'];
  description: string;
  baseWidth: number;
  baseDepth: number;
  baseHeight: number;
  color: string;
  icon: string;
  cost: number;
  economics: {
    maintenanceCost: number;
    revenue?: number;
    operatingCosts?: number;
    propertyTaxRate: number;
    jobsCreated?: number;
  };
  environment: {
    pollutionRate: number;
    noiseLevel: number;
    powerConsumption: number;
    waterConsumption: number;
    greenContribution?: number;
  };
  requirements?: {
    nearRoad?: boolean;
    minPopulation?: number;
    zoneTypes?: string[];
  };
  services?: {
    type: string;
    radius: number;
    capacity: number;
  };
}

interface Road {
  id: string;
  type: 'street' | 'avenue' | 'highway' | 'pedestrian';
  points: [number, number, number][];
  width: number;
  color: string;
  capacity: number;
  speedLimit: number;
}

interface InteractionMode {
  mode: 'select' | 'place' | 'road' | 'measure' | 'demolish' | 'edit' | 'terrain' | 'vegetation';
  selectedTemplate?: BuildingTemplate;
  roadType?: Road['type'];
  terrainTool?: 'raise' | 'lower' | 'flatten' | 'water' | 'texture';
  vegetationType?: 'trees' | 'grass' | 'park' | 'garden';
}

interface MeasurementData {
  points: [number, number, number][];
  distance?: number;
  area?: number;
  angle?: number;
}

// Professional building templates with detailed specifications
const PROFESSIONAL_BUILDING_TEMPLATES: BuildingTemplate[] = [
  // Residential Buildings
  {
    id: 'single_family_house',
    name: 'Casa Unifamiliar',
    type: 'residential',
    description: 'Casa unifamiliar moderna de 1-2 pisos con jardín',
    baseWidth: 8,
    baseDepth: 10,
    baseHeight: 6,
    color: '#8b5cf6',
    icon: '🏠',
    cost: 150000,
    economics: {
      maintenanceCost: 2000,
      propertyTaxRate: 0.015,
    },
    environment: {
      pollutionRate: 2,
      noiseLevel: 15,
      powerConsumption: 8,
      waterConsumption: 12,
      greenContribution: 15
    },
    requirements: {
      nearRoad: true,
      zoneTypes: ['residential', 'mixed']
    }
  },
  {
    id: 'apartment_building',
    name: 'Edificio de Apartamentos',
    type: 'residential',
    description: 'Edificio residencial de media altura (4-8 pisos)',
    baseWidth: 12,
    baseDepth: 15,
    baseHeight: 20,
    color: '#7c3aed',
    icon: '🏢',
    cost: 800000,
    economics: {
      maintenanceCost: 8000,
      propertyTaxRate: 0.02,
    },
    environment: {
      pollutionRate: 5,
      noiseLevel: 25,
      powerConsumption: 25,
      waterConsumption: 40,
      greenContribution: 5
    },
    requirements: {
      nearRoad: true,
      minPopulation: 500,
      zoneTypes: ['residential', 'mixed']
    }
  },
  // Commercial Buildings
  {
    id: 'retail_store',
    name: 'Tienda Comercial',
    type: 'commercial',
    description: 'Local comercial de una planta para retail',
    baseWidth: 10,
    baseDepth: 12,
    baseHeight: 4,
    color: '#10b981',
    icon: '🏪',
    cost: 120000,
    economics: {
      maintenanceCost: 3000,
      revenue: 8000,
      operatingCosts: 4000,
      propertyTaxRate: 0.025,
      jobsCreated: 5
    },
    environment: {
      pollutionRate: 3,
      noiseLevel: 30,
      powerConsumption: 15,
      waterConsumption: 8
    },
    requirements: {
      nearRoad: true,
      zoneTypes: ['commercial', 'mixed']
    }
  },
  {
    id: 'office_tower',
    name: 'Torre de Oficinas',
    type: 'commercial',
    description: 'Edificio corporativo de oficinas de gran altura',
    baseWidth: 20,
    baseDepth: 20,
    baseHeight: 60,
    color: '#059669',
    icon: '🏬',
    cost: 5000000,
    economics: {
      maintenanceCost: 25000,
      revenue: 100000,
      operatingCosts: 40000,
      propertyTaxRate: 0.03,
      jobsCreated: 200
    },
    environment: {
      pollutionRate: 8,
      noiseLevel: 35,
      powerConsumption: 80,
      waterConsumption: 60
    },
    requirements: {
      nearRoad: true,
      minPopulation: 2000,
      zoneTypes: ['commercial', 'mixed']
    }
  },
  // Industrial Buildings
  {
    id: 'warehouse',
    name: 'Almacén Industrial',
    type: 'industrial',
    description: 'Almacén logístico para distribución',
    baseWidth: 25,
    baseDepth: 40,
    baseHeight: 8,
    color: '#dc2626',
    icon: '🏭',
    cost: 400000,
    economics: {
      maintenanceCost: 5000,
      revenue: 15000,
      operatingCosts: 8000,
      propertyTaxRate: 0.02,
      jobsCreated: 25
    },
    environment: {
      pollutionRate: 12,
      noiseLevel: 45,
      powerConsumption: 35,
      waterConsumption: 20
    },
    requirements: {
      nearRoad: true,
      zoneTypes: ['industrial']
    }
  },
  // Civic Buildings
  {
    id: 'hospital',
    name: 'Hospital',
    type: 'civic',
    description: 'Centro de salud con servicios médicos especializados',
    baseWidth: 30,
    baseDepth: 25,
    baseHeight: 15,
    color: '#ef4444',
    icon: '🏥',
    cost: 2000000,
    economics: {
      maintenanceCost: 50000,
      operatingCosts: 80000,
      propertyTaxRate: 0,
    },
    environment: {
      pollutionRate: 5,
      noiseLevel: 25,
      powerConsumption: 60,
      waterConsumption: 100
    },
    services: {
      type: 'health',
      radius: 50,
      capacity: 1000
    },
    requirements: {
      nearRoad: true,
      zoneTypes: ['civic', 'mixed']
    }
  },
  {
    id: 'school',
    name: 'Escuela',
    type: 'civic',
    description: 'Institución educativa para educación primaria y secundaria',
    baseWidth: 25,
    baseDepth: 20,
    baseHeight: 12,
    color: '#f59e0b',
    icon: '🏫',
    cost: 800000,
    economics: {
      maintenanceCost: 20000,
      operatingCosts: 30000,
      propertyTaxRate: 0,
    },
    environment: {
      pollutionRate: 2,
      noiseLevel: 40,
      powerConsumption: 25,
      waterConsumption: 40
    },
    services: {
      type: 'education',
      radius: 30,
      capacity: 500
    },
    requirements: {
      nearRoad: true,
      zoneTypes: ['civic', 'residential', 'mixed']
    }
  }
];

// Professional 3D Building Component with enhanced rendering
function Professional3DBuilding({ 
  building, 
  isSelected, 
  isHovered,
  onClick,
  showServiceRadius = false 
}: {
  building: BuildingData;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (building: BuildingData) => void;
  showServiceRadius?: boolean;
}) {
  const buildingRef = useRef<THREE.Group>(null);
  const [animationTime, setAnimationTime] = useState(0);

  useFrame((state, delta) => {
    setAnimationTime(prev => prev + delta);
    
    if (buildingRef.current && isSelected) {
      // Subtle selection animation
      buildingRef.current.position.y = Math.sin(animationTime * 2) * 0.1;
    } else if (buildingRef.current) {
      buildingRef.current.position.y = 0;
    }
  });

  const buildingMaterials = useMemo(() => {
    const template = PROFESSIONAL_BUILDING_TEMPLATES.find(t => t.type === building.type);
    return {
      main: new THREE.MeshStandardMaterial({
        color: isSelected ? '#ffff00' : isHovered ? '#ffffff' : building.color,
        opacity: 0.9,
        transparent: true,
        roughness: 0.3,
        metalness: 0.1
      }),
      accent: new THREE.MeshStandardMaterial({
        color: isSelected ? '#ffff88' : '#ffffff',
        opacity: 0.8,
        transparent: true,
        roughness: 0.5,
        metalness: 0.3
      }),
      foundation: new THREE.MeshStandardMaterial({
        color: '#8b7355',
        roughness: 0.8,
        metalness: 0.1
      })
    };
  }, [building.color, building.type, isSelected, isHovered]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick(building);
  }, [building, onClick]);

  return (
    <group 
      ref={buildingRef}
      position={building.position}
      rotation={[0, building.rotation, 0]}
      onClick={handleClick}
      userData={{ buildingId: building.id, type: 'building' }}
    >
      {/* Foundation */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[building.width + 1, 1, building.depth + 1]} />
        <primitive object={buildingMaterials.foundation} />
      </mesh>

      {/* Main building structure */}
      <mesh position={[0, building.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <primitive object={buildingMaterials.main} />
      </mesh>

      {/* Building details based on type */}
      {building.type === 'residential' && building.height > 10 && (
        <>
          {/* Balconies */}
          {Array.from({ length: Math.floor(building.height / 3) }).map((_, i) => (
            <mesh key={i} position={[building.width / 2 + 0.5, 3 + i * 3, 0]} castShadow>
              <boxGeometry args={[1, 0.2, building.depth * 0.8]} />
              <primitive object={buildingMaterials.accent} />
            </mesh>
          ))}
        </>
      )}

      {building.type === 'commercial' && building.height > 15 && (
        <>
          {/* Glass facade effect */}
          <mesh position={[building.width / 2 + 0.1, building.height / 2, 0]}>
            <boxGeometry args={[0.2, building.height * 0.9, building.depth * 0.9]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.3} />
          </mesh>
        </>
      )}

      {building.type === 'industrial' && (
        <>
          {/* Industrial chimney */}
          <mesh position={[building.width / 3, building.height + 5, building.depth / 3]} castShadow>
            <cylinderGeometry args={[1, 1.5, 10]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        </>
      )}

      {building.type === 'civic' && building.properties.buildingName?.includes('Hospital') && (
        <>
          {/* Red cross symbol */}
          <mesh position={[0, building.height + 1, 0]}>
            <boxGeometry args={[2, 0.5, 0.5]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0, building.height + 1, 0]}>
            <boxGeometry args={[0.5, 2, 0.5]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        </>
      )}

      {/* Service radius visualization */}
      {showServiceRadius && building.properties.serviceRadius && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[building.properties.serviceRadius * 0.8, building.properties.serviceRadius, 32]} />
          <meshBasicMaterial 
            color={building.type === 'civic' ? '#00ff00' : '#0088ff'} 
            transparent 
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Building information display */}
      {isHovered && (
        <Html position={[0, building.height + 3, 0]} center>
          <div className="bg-black bg-opacity-90 text-white p-3 rounded-lg text-sm max-w-xs">
            <h4 className="font-bold text-yellow-400">{building.properties.buildingName}</h4>
            <div className="space-y-1 mt-2">
              <div>🏗️ Pisos: {building.properties.floors}</div>
              <div>💰 Valor: ${building.properties.value?.toLocaleString()}</div>
              <div>⚡ Condición: {building.properties.condition}%</div>
              {building.properties.units && (
                <div>🏠 Unidades: {building.properties.units}</div>
              )}
              {building.properties.employees && (
                <div>👥 Empleados: {building.properties.employees}</div>
              )}
              {building.properties.serviceRadius && (
                <div>📡 Radio servicio: {building.properties.serviceRadius}m</div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Professional Road Component with realistic materials and markings
function Professional3DRoad({ road }: { road: Road }) {
  const points = useMemo(() => {
    return road.points.map(point => new THREE.Vector3(...point));
  }, [road.points]);

  const roadGeometry = useMemo(() => {
    if (points.length < 2) return new THREE.BufferGeometry();
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, road.width / 2, 8, false);
    return tubeGeometry;
  }, [points, road.width]);

  const roadMaterial = useMemo(() => {
    const baseColor = road.type === 'highway' ? '#2a2a2a' : 
                     road.type === 'avenue' ? '#353535' : 
                     road.type === 'pedestrian' ? '#8b7355' : '#404040';
    
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1
    });
  }, [road.type]);

  // Road markings geometry
  const markingsGeometry = useMemo(() => {
    if (points.length < 2) return new THREE.BufferGeometry();
    
    const curve = new THREE.CatmullRomCurve3(points);
    const lineGeometry = new THREE.TubeGeometry(curve, 40, 0.05, 3, false);
    return lineGeometry;
  }, [points]);

  return (
    <group>
      {/* Main road surface */}
      <mesh geometry={roadGeometry} material={roadMaterial} receiveShadow>
        {/* Road surface details */}
      </mesh>
      
      {/* Road markings - center line */}
      {road.type !== 'pedestrian' && (
        <mesh geometry={markingsGeometry} position={[0, 0.01, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Lane dividers for highways */}
      {road.type === 'highway' && (
        <>
          <mesh geometry={markingsGeometry} position={[road.width * 0.25, 0.01, 0]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh geometry={markingsGeometry} position={[-road.width * 0.25, 0.01, 0]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </>
      )}
      
      {/* Street lights for major roads */}
      {(road.type === 'avenue' || road.type === 'highway') && points.map((point, index) => (
        index % 3 === 0 && (
          <group key={index} position={[point.x + road.width, point.y, point.z]}>
            {/* Street light pole */}
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 6]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
            {/* Light fixture */}
            <mesh position={[0, 6, 0]}>
              <sphereGeometry args={[0.3]} />
              <meshBasicMaterial color="#ffffaa" />
            </mesh>
            {/* Actual light */}
            <pointLight position={[0, 6, 0]} color="#ffffaa" intensity={0.3} distance={15} />
          </group>
        )
      ))}
    </group>
  );
}

// Measurement tool component
function MeasurementTool({ measurements }: { measurements: MeasurementData[] }) {
  return (
    <group>
      {measurements.map((measurement, index) => (
        <group key={index}>
          {measurement.points.map((point, pointIndex) => (
            <Sphere key={pointIndex} position={point} args={[0.2]}>
              <meshBasicMaterial color="#ff0000" />
            </Sphere>
          ))}
          
          {measurement.points.length > 1 && measurement.points.map((point, pointIndex) => {
            if (pointIndex < measurement.points.length - 1) {
              const nextPoint = measurement.points[pointIndex + 1];
              return (
                <Line
                  key={`line-${pointIndex}`}
                  points={[point, nextPoint]}
                  color="#ff0000"
                  lineWidth={2}
                />
              );
            }
            return null;
          })}
          
          {measurement.distance && measurement.points.length === 2 && (
            <Html position={[
              (measurement.points[0][0] + measurement.points[1][0]) / 2,
              2,
              (measurement.points[0][2] + measurement.points[1][2]) / 2
            ]} center>
              <div className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                {measurement.distance.toFixed(2)}m
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

// Professional Terrain System with Real-time Modification
function TerrainEditor({ 
  mode, 
  onTerrainModify 
}: { 
  mode: InteractionMode;
  onTerrainModify: (position: [number, number, number], operation: string, radius: number) => void;
}) {
  const terrainRef = useRef<THREE.Mesh>(null);
  const [heightmapData, setHeightmapData] = useState<Float32Array | null>(null);
  
  // Create heightmap-based terrain with real modification capability
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(200, 200, 100, 100);
    geometry.rotateX(-Math.PI / 2);
    
    // Initialize with some basic terrain features
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < positions.length; i += 3) {
      // Add some hills and valleys
      const x = positions[i - 1];
      const z = positions[i + 1];
      positions[i] = Math.sin(x / 20) * 2 + Math.cos(z / 15) * 1.5;
    }
    
    // Store initial heightmap data
    setHeightmapData(new Float32Array(positions));
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  
  // Real-time terrain modification
  const modifyTerrain = useCallback((position: [number, number, number], operation: string, radius: number) => {
    if (!terrainRef.current || !heightmapData) return;
    
    const geometry = terrainRef.current.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const [clickX, clickY, clickZ] = position;
    
    // Find affected vertices within radius
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      const distance = Math.sqrt((x - clickX) ** 2 + (z - clickZ) ** 2);
      
      if (distance <= radius) {
        const influence = Math.max(0, 1 - distance / radius); // Smooth falloff
        
        switch (operation) {
          case 'raise':
            positions[i + 1] += influence * 2;
            break;
          case 'lower':
            positions[i + 1] -= influence * 2;
            break;
          case 'flatten':
            positions[i + 1] = positions[i + 1] * (1 - influence * 0.5);
            break;
          case 'water':
            positions[i + 1] = Math.min(positions[i + 1], -1 * influence);
            break;
        }
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [heightmapData]);
  
  const terrainMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#2d5016',
      roughness: 0.8,
      metalness: 0.1,
      wireframe: mode.mode === 'terrain'
    });
  }, [mode.mode]);
  
  const handleTerrainClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (mode.mode === 'terrain' && mode.terrainTool) {
      const point = event.point;
      modifyTerrain([point.x, point.y, point.z], mode.terrainTool, 5);
      onTerrainModify([point.x, point.y, point.z], mode.terrainTool, 5);
    }
  }, [mode, modifyTerrain, onTerrainModify]);
  
  return (
    <mesh 
      ref={terrainRef}
      geometry={terrainGeometry} 
      material={terrainMaterial}
      receiveShadow
      onClick={handleTerrainClick}
    />
  );
}

// Vegetation System
function VegetationSystem({ 
  vegetation 
}: { 
  vegetation: Array<{ position: [number, number, number]; type: string; }>;
}) {
  return (
    <group>
      {vegetation.map((item, index) => (
        <group key={index} position={item.position}>
          {item.type === 'trees' && (
            <>
              {/* Tree trunk */}
              <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.3, 0.4, 4]} />
                <meshStandardMaterial color="#8b4513" />
              </mesh>
              {/* Tree crown */}
              <mesh position={[0, 5, 0]}>
                <sphereGeometry args={[2]} />
                <meshStandardMaterial color="#228b22" />
              </mesh>
            </>
          )}
          {item.type === 'grass' && (
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2, 2]} />
              <meshStandardMaterial color="#32cd32" transparent opacity={0.7} />
            </mesh>
          )}
          {item.type === 'park' && (
            <>
              {/* Grass area */}
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#32cd32" />
              </mesh>
              {/* Park bench */}
              <mesh position={[2, 0.5, 2]}>
                <boxGeometry args={[1.5, 0.8, 0.4]} />
                <meshStandardMaterial color="#8b4513" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

// Advanced Building Editor Panel
function AdvancedBuildingEditor({ 
  building, 
  onUpdate, 
  onClose 
}: {
  building: BuildingData;
  onUpdate: (building: BuildingData) => void;
  onClose: () => void;
}) {
  const [editedBuilding, setEditedBuilding] = useState<BuildingData>(building);
  
  const handlePropertyChange = (section: string, property: string, value: any) => {
    setEditedBuilding(prev => {
      const updated = { ...prev };
      (updated as any)[section] = {
        ...(updated as any)[section],
        [property]: value
      };
      return updated;
    });
  };
  
  return (
    <Html position={[building.position[0], building.height + 5, building.position[2]]} center>
      <div className="bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg max-w-md border border-blue-500">
        <h3 className="text-lg font-bold mb-3 text-blue-400">
          ✏️ Editor Avanzado: {building.properties.buildingName}
        </h3>
        
        {/* Basic Properties */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-300">🏗️ Propiedades Básicas:</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Nombre:</label>
              <input
                type="text"
                value={editedBuilding.properties.buildingName}
                onChange={(e) => handlePropertyChange('properties', 'buildingName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Altura (m):</label>
              <input
                type="number"
                value={editedBuilding.height}
                onChange={(e) => setEditedBuilding(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Rotación (°):</label>
              <input
                type="range"
                min="0"
                max="360"
                value={editedBuilding.rotation * (180 / Math.PI)}
                onChange={(e) => setEditedBuilding(prev => ({ ...prev, rotation: parseInt(e.target.value) * (Math.PI / 180) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Economic Properties */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-green-400">💰 Economía:</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Valor ($):</label>
              <input
                type="number"
                value={editedBuilding.properties.value}
                onChange={(e) => handlePropertyChange('properties', 'value', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Mantenimiento anual ($):</label>
              <input
                type="number"
                value={editedBuilding.economics.maintenanceCost}
                onChange={(e) => handlePropertyChange('economics', 'maintenanceCost', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Environmental Properties */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-green-400">🌍 Ambiente:</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Eficiencia energética (%):</label>
              <input
                type="range"
                min="0"
                max="100"
                value={editedBuilding.environment.energyEfficiency}
                onChange={(e) => handlePropertyChange('environment', 'energyEfficiency', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{editedBuilding.environment.energyEfficiency}%</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onUpdate(editedBuilding)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm"
          >
            💾 Guardar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-sm"
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </Html>
  );
}
function BuildingPreview({ 
  position, 
  template, 
  isValidPlacement 
}: { 
  position: [number, number, number];
  template: BuildingTemplate;
  isValidPlacement: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, template.baseHeight / 2, 0]}>
        <boxGeometry args={[template.baseWidth, template.baseHeight, template.baseDepth]} />
        <meshStandardMaterial 
          color={isValidPlacement ? template.color : '#ff0000'}
          transparent 
          opacity={0.6}
          wireframe
        />
      </mesh>
      
      {/* Enhanced placement indicator */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[template.baseWidth / 2, template.baseWidth / 2 + 1, 16]} />
        <meshBasicMaterial 
          color={isValidPlacement ? '#00ff00' : '#ff0000'}
          transparent 
          opacity={0.7}
        />
      </mesh>
      
      {/* Validation status indicator */}
      <Html position={[0, template.baseHeight + 2, 0]} center>
        <div className={`px-3 py-1 rounded text-xs font-semibold ${
          isValidPlacement 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {isValidPlacement ? '✅ Válido' : '❌ No válido'}
        </div>
      </Html>
      
      {/* Cost indicator */}
      <Html position={[0, template.baseHeight + 4, 0]} center>
        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
          💰 ${template.cost.toLocaleString()}
        </div>
      </Html>
    </group>
  );
}

// Professional UI Panel Component
function ProfessionalControlPanel({
  mode,
  setMode,
  selectedTemplate,
  setSelectedTemplate,
  buildings,
  roads,
  measurements,
  clearMeasurements,
  showServiceRadius,
  setShowServiceRadius,
  onExport,
  roadPoints
}: {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  selectedTemplate: BuildingTemplate | null;
  setSelectedTemplate: (template: BuildingTemplate | null) => void;
  buildings: BuildingData[];
  roads: Road[];
  measurements: MeasurementData[];
  clearMeasurements: () => void;
  showServiceRadius: boolean;
  setShowServiceRadius: (show: boolean) => void;
  onExport: (type: string) => void;
  roadPoints: [number, number, number][];
}) {
  const [selectedCategory, setSelectedCategory] = useState<BuildingData['type'] | 'all'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = ['all', 'residential', 'commercial', 'industrial', 'civic'] as const;
  
  const filteredTemplates = PROFESSIONAL_BUILDING_TEMPLATES.filter(template => 
    selectedCategory === 'all' || template.type === selectedCategory
  );

  // Calculate city statistics with real-time economic simulation
  const cityStats = useMemo(() => {
    const population = buildings.reduce((sum, b) => {
      if (b.type === 'residential') {
        return sum + (b.properties.units || 0) * 2.3; // Average occupancy rate
      }
      return sum;
    }, 0);

    const jobs = buildings.reduce((sum, b) => {
      return sum + (b.properties.employees || 0);
    }, 0);

    const totalValue = buildings.reduce((sum, b) => sum + b.properties.value, 0);
    
    // Calculate municipal economics
    const totalRevenue = buildings.reduce((sum, b) => {
      return sum + (b.economics.revenue || 0) + b.economics.propertyTax;
    }, 0);
    
    const totalOperatingCosts = buildings.reduce((sum, b) => {
      return sum + b.economics.maintenanceCost + (b.economics.operatingCosts || 0);
    }, 0);
    
    const municipalBudget = totalRevenue - totalOperatingCosts;
    
    // Calculate sustainability metrics
    const totalPollution = buildings.reduce((sum, b) => sum + b.environment.pollutionGenerated, 0);
    const avgEnergyEfficiency = buildings.length > 0 ? 
      buildings.reduce((sum, b) => sum + b.environment.energyEfficiency, 0) / buildings.length : 0;
    
    // Employment rate calculation
    const employmentRate = population > 0 ? Math.min((jobs / population) * 100, 100) : 0;
    
    return { 
      population: Math.round(population), 
      jobs, 
      totalValue, 
      buildingCount: buildings.length,
      municipalBudget: Math.round(municipalBudget),
      totalRevenue: Math.round(totalRevenue),
      totalOperatingCosts: Math.round(totalOperatingCosts),
      totalPollution: Math.round(totalPollution),
      avgEnergyEfficiency: Math.round(avgEnergyEfficiency),
      employmentRate: Math.round(employmentRate)
    };
  }, [buildings]);

  return (
    <Html position={[0, 0, 0]} transform={false}>
      <div className="fixed top-4 left-4 z-50 bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg max-w-sm max-h-[90vh] overflow-y-auto border border-gray-600">
        <h3 className="text-lg font-bold mb-3 text-blue-400 flex items-center">
          <span className="mr-2">🏗️</span>
          Professional City Engine
        </h3>
        
        {/* Mode Selection */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-300">🛠️ Herramientas:</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode({ mode: 'select' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'select' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🔍 Seleccionar
            </button>
            <button
              onClick={() => setMode({ mode: 'place' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'place' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🏗️ Construir
            </button>
            <button
              onClick={() => setMode({ mode: 'road', roadType: 'street' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'road' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🛣️ Carreteras
            </button>
            <button
              onClick={() => setMode({ mode: 'measure' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'measure' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              📏 Medir
            </button>
            <button
              onClick={() => setMode({ mode: 'demolish' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'demolish' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              💥 Demoler
            </button>
            <button
              onClick={() => setMode({ mode: 'edit' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'edit' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => setMode({ mode: 'terrain', terrainTool: 'raise' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'terrain' ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🏔️ Terreno
            </button>
            <button
              onClick={() => setMode({ mode: 'vegetation', vegetationType: 'trees' })}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                mode.mode === 'vegetation' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🌳 Vegetación
            </button>
          </div>
        </div>

        {/* Building Templates */}
        {mode.mode === 'place' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-300">🏢 Categorías:</h4>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm mb-3"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Todos' : 
                   cat === 'residential' ? 'Residencial' :
                   cat === 'commercial' ? 'Comercial' :
                   cat === 'industrial' ? 'Industrial' :
                   cat === 'civic' ? 'Cívico' : cat}
                </option>
              ))}
            </select>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'bg-blue-600 border-blue-400' 
                      : 'bg-gray-800 hover:bg-gray-700 border-gray-600'
                  } border`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{template.icon}</span>
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                      <div className="text-xs text-green-400 mt-1">
                        ${template.cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Road Construction Tools */}
        {mode.mode === 'road' && (
          <div className="mb-4 p-3 bg-gray-800 rounded border border-orange-600">
            <h4 className="text-sm font-semibold mb-2 text-orange-400">🛣️ Herramientas de Carreteras:</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setMode({ mode: 'road', roadType: 'street' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.roadType === 'street' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🛣️ Calle (30km/h)
              </button>
              <button
                onClick={() => setMode({ mode: 'road', roadType: 'avenue' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.roadType === 'avenue' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🛤️ Avenida (50km/h)
              </button>
              <button
                onClick={() => setMode({ mode: 'road', roadType: 'highway' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.roadType === 'highway' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🛥️ Autopista (80km/h)
              </button>
              <button
                onClick={() => setMode({ mode: 'road', roadType: 'pedestrian' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.roadType === 'pedestrian' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🚶 Peatonal
              </button>
            </div>
            <div className="text-xs text-gray-400">
              Haz clic para agregar puntos de ruta. Mínimo 2 puntos para crear carretera.
            </div>
            {roadPoints.length > 0 && (
              <div className="mt-2 text-xs text-orange-400">
                Puntos: {roadPoints.length} | {roadPoints.length >= 2 ? 'Listo para construir' : 'Necesita más puntos'}
              </div>
            )}
          </div>
        )}

        {/* Terrain Tools */}
        {mode.mode === 'terrain' && (
          <div className="mb-4 p-3 bg-gray-800 rounded border border-amber-600">
            <h4 className="text-sm font-semibold mb-2 text-amber-400">🏔️ Herramientas de Terreno:</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setMode({ mode: 'terrain', terrainTool: 'raise' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.terrainTool === 'raise' ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                ⬆️ Elevar
              </button>
              <button
                onClick={() => setMode({ mode: 'terrain', terrainTool: 'lower' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.terrainTool === 'lower' ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                ⬇️ Bajar
              </button>
              <button
                onClick={() => setMode({ mode: 'terrain', terrainTool: 'flatten' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.terrainTool === 'flatten' ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                📏 Aplanar
              </button>
              <button
                onClick={() => setMode({ mode: 'terrain', terrainTool: 'water' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.terrainTool === 'water' ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                💧 Agua
              </button>
            </div>
            <div className="text-xs text-gray-400">
              Haz clic en el terreno para modificar la elevación
            </div>
          </div>
        )}

        {/* Vegetation Tools */}
        {mode.mode === 'vegetation' && (
          <div className="mb-4 p-3 bg-gray-800 rounded border border-emerald-600">
            <h4 className="text-sm font-semibold mb-2 text-emerald-400">🌳 Herramientas de Vegetación:</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setMode({ mode: 'vegetation', vegetationType: 'trees' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.vegetationType === 'trees' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🌲 Árboles
              </button>
              <button
                onClick={() => setMode({ mode: 'vegetation', vegetationType: 'grass' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.vegetationType === 'grass' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🌱 Césped
              </button>
              <button
                onClick={() => setMode({ mode: 'vegetation', vegetationType: 'park' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.vegetationType === 'park' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🏞️ Parques
              </button>
              <button
                onClick={() => setMode({ mode: 'vegetation', vegetationType: 'garden' })}
                className={`px-3 py-2 text-xs rounded ${
                  mode.vegetationType === 'garden' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                🌻 Jardines
              </button>
            </div>
            <div className="text-xs text-gray-400">
              Haz clic para plantar vegetación
            </div>
          </div>
        )}
        {mode.mode === 'measure' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-purple-400">📏 Herramientas de Medición:</h4>
            <div className="space-y-2">
              <div className="text-xs text-gray-400">
                Haz clic en dos puntos para medir distancia
              </div>
              {measurements.length > 0 && (
                <>
                  <div className="text-xs">
                    <div>📐 Mediciones: {measurements.length}</div>
                  </div>
                  <button
                    onClick={clearMeasurements}
                    className="w-full bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-xs"
                  >
                    🗑️ Limpiar Mediciones
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Visualization Options */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-300">👁️ Visualización:</h4>
          <div className="space-y-2">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={showServiceRadius}
                onChange={(e) => setShowServiceRadius(e.target.checked)}
                className="mr-2"
              />
              Mostrar radios de servicio
            </label>
          </div>
        </div>

        {/* City Statistics with Real-time Economics */}
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
          <h4 className="text-sm font-semibold mb-2 text-yellow-400">📊 Estadísticas de la Ciudad:</h4>
          <div className="text-xs space-y-1">
            <div>🏗️ Edificios: {cityStats.buildingCount}</div>
            <div>👥 Población: {cityStats.population.toLocaleString()}</div>
            <div>💼 Empleos: {cityStats.jobs.toLocaleString()}</div>
            <div>📈 Tasa empleo: {cityStats.employmentRate}%</div>
            <div>💰 Valor total: ${cityStats.totalValue.toLocaleString()}</div>
            <div>🛣️ Carreteras: {roads.length}</div>
          </div>
        </div>

        {/* Municipal Economics */}
        <div className="mb-4 p-3 bg-gray-800 rounded border border-green-600">
          <h4 className="text-sm font-semibold mb-2 text-green-400">💰 Economía Municipal:</h4>
          <div className="text-xs space-y-1">
            <div>💵 Ingresos: ${cityStats.totalRevenue.toLocaleString()}/año</div>
            <div>💸 Gastos: ${cityStats.totalOperatingCosts.toLocaleString()}/año</div>
            <div className={`font-semibold ${cityStats.municipalBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              🏛️ Presupuesto: ${cityStats.municipalBudget.toLocaleString()}/año
            </div>
          </div>
        </div>

        {/* Environmental Metrics */}
        <div className="mb-4 p-3 bg-gray-800 rounded border border-emerald-600">
          <h4 className="text-sm font-semibold mb-2 text-emerald-400">🌍 Sostenibilidad:</h4>
          <div className="text-xs space-y-1">
            <div>🏭 Contaminación: {cityStats.totalPollution} unidades</div>
            <div>⚡ Eficiencia energética: {cityStats.avgEnergyEfficiency}%</div>
            <div className={`${cityStats.totalPollution < 50 ? 'text-green-400' : cityStats.totalPollution < 100 ? 'text-yellow-400' : 'text-red-400'}`}>
              🌱 Estado ambiental: {cityStats.totalPollution < 50 ? 'Excelente' : cityStats.totalPollution < 100 ? 'Moderado' : 'Crítico'}
            </div>
          </div>
        </div>

        {/* Export Tools */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-300">📤 Exportar:</h4>
          <div className="space-y-2">
            <button
              onClick={() => onExport('screenshot')}
              className="w-full bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-xs"
            >
              📸 Captura Profesional
            </button>
            <button
              onClick={() => onExport('model')}
              className="w-full bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-xs"
            >
              🏗️ Modelo 3D Profesional
            </button>
            <button
              onClick={() => onExport('cad')}
              className="w-full bg-orange-600 hover:bg-orange-500 px-3 py-2 rounded text-xs"
            >
              📐 Archivo CAD (DXF)
            </button>
            <button
              onClick={() => onExport('report')}
              className="w-full bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-xs"
            >
              📊 Reporte Urbano
            </button>
          </div>
        </div>
      </div>
    </Html>
  );
}

// Main Interactive Scene Component
function InteractiveCityScene() {
  const { camera, gl, scene } = useThree();
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null);
  const [mode, setMode] = useState<InteractionMode>({ mode: 'select' });
  const [selectedTemplate, setSelectedTemplate] = useState<BuildingTemplate | null>(null);
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [showServiceRadius, setShowServiceRadius] = useState(false);
  const [roadPoints, setRoadPoints] = useState<[number, number, number][]>([]);
  const [vegetation, setVegetation] = useState<Array<{ position: [number, number, number]; type: string; }>>([]);
  const [editingBuilding, setEditingBuilding] = useState<BuildingData | null>(null);
  
  // Professional tools
  const roadBuilder = useRef<ProfessionalRoadBuilder | null>(null);
  const measurementTools = useRef<ProfessionalMeasurementTools | null>(null);
  
  // Initialize professional tools
  useEffect(() => {
    roadBuilder.current = new ProfessionalRoadBuilder(scene, camera, gl);
  // Ajuste: el constructor de ProfessionalMeasurementTools solo recibe la escena
  measurementTools.current = new ProfessionalMeasurementTools(scene);
  }, [scene, camera, gl]);

  // Mouse interaction handling
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (mode.mode === 'place' && selectedTemplate) {
      const intersectionPoint = event.point;
      if (intersectionPoint) {
        // Snap to grid
        const snapSize = 1;
        const snappedX = Math.round(intersectionPoint.x / snapSize) * snapSize;
        const snappedZ = Math.round(intersectionPoint.z / snapSize) * snapSize;
        setHoverPosition([snappedX, 0, snappedZ]);
      }
    }
  }, [mode, selectedTemplate]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    const intersectionPoint = event.point;
    
    if (mode.mode === 'place' && selectedTemplate && intersectionPoint) {
      // Place building
      const snapSize = 1;
      const snappedX = Math.round(intersectionPoint.x / snapSize) * snapSize;
      const snappedZ = Math.round(intersectionPoint.z / snapSize) * snapSize;
      
      const newBuilding: BuildingData = {
        id: `building_${Date.now()}`,
        position: [snappedX, 0, snappedZ],
        width: selectedTemplate.baseWidth,
        depth: selectedTemplate.baseDepth,
        height: selectedTemplate.baseHeight,
        type: selectedTemplate.type,
        color: selectedTemplate.color,
        rotation: 0,
        properties: {
          floors: Math.floor(selectedTemplate.baseHeight / 3),
          buildingName: selectedTemplate.name,
          value: selectedTemplate.cost,
          yearBuilt: new Date().getFullYear(),
          condition: 100,
          units: selectedTemplate.type === 'residential' ? Math.floor(selectedTemplate.baseHeight / 3) * 2 : undefined,
          capacity: selectedTemplate.type === 'commercial' ? selectedTemplate.baseWidth * selectedTemplate.baseDepth * 2 : undefined,
          employees: selectedTemplate.economics.jobsCreated || 0,
          serviceRadius: selectedTemplate.services?.radius || 0
        },
        economics: {
          constructionCost: selectedTemplate.cost,
          maintenanceCost: selectedTemplate.economics.maintenanceCost,
          revenue: selectedTemplate.economics.revenue || 0,
          operatingCosts: selectedTemplate.economics.operatingCosts || 0,
          propertyTax: selectedTemplate.cost * selectedTemplate.economics.propertyTaxRate
        },
        environment: {
          pollutionGenerated: selectedTemplate.environment.pollutionRate,
          noiseLevel: selectedTemplate.environment.noiseLevel,
          energyEfficiency: 100 - selectedTemplate.environment.powerConsumption,
          powerConsumption: selectedTemplate.environment.powerConsumption,
          waterConsumption: selectedTemplate.environment.waterConsumption
        }
      };
      
      setBuildings(prev => [...prev, newBuilding]);
      setHoverPosition(null);
    } else if (mode.mode === 'measure' && intersectionPoint) {
      // Add measurement point
      const newPoint: [number, number, number] = [intersectionPoint.x, intersectionPoint.y, intersectionPoint.z];
      
      setMeasurements(prev => {
        const lastMeasurement = prev[prev.length - 1];
        if (!lastMeasurement || lastMeasurement.points.length === 2) {
          // Start new measurement
          return [...prev, { points: [newPoint] }];
        } else {
          // Complete measurement
          const updatedMeasurement = {
            ...lastMeasurement,
            points: [...lastMeasurement.points, newPoint],
            distance: Math.sqrt(
              Math.pow(newPoint[0] - lastMeasurement.points[0][0], 2) +
              Math.pow(newPoint[1] - lastMeasurement.points[0][1], 2) +
              Math.pow(newPoint[2] - lastMeasurement.points[0][2], 2)
            )
          };
          return [...prev.slice(0, -1), updatedMeasurement];
        }
      });
    } else if (mode.mode === 'road' && intersectionPoint) {
      // Add road point
      const newPoint: [number, number, number] = [intersectionPoint.x, 0.05, intersectionPoint.z];
      setRoadPoints(prev => [...prev, newPoint]);
      
      // Create road when we have enough points
      if (roadPoints.length >= 1) {
        const newRoad: Road = {
          id: `road_${Date.now()}`,
          type: mode.roadType || 'street',
          points: [...roadPoints, newPoint],
          width: mode.roadType === 'highway' ? 4 : mode.roadType === 'avenue' ? 3 : 2,
          color: '#555555',
          capacity: mode.roadType === 'highway' ? 300 : mode.roadType === 'avenue' ? 200 : 100,
          speedLimit: mode.roadType === 'highway' ? 80 : mode.roadType === 'avenue' ? 50 : 30
        };
        
        setRoads(prev => [...prev, newRoad]);
        setRoadPoints([]);
      }
    } else if (mode.mode === 'vegetation' && mode.vegetationType && intersectionPoint) {
      // Add vegetation
      const newVegetation = {
        position: [intersectionPoint.x, intersectionPoint.y, intersectionPoint.z] as [number, number, number],
        type: mode.vegetationType
      };
      setVegetation(prev => [...prev, newVegetation]);
    }
  }, [mode, selectedTemplate, roadPoints]);

  const handleBuildingClick = useCallback((building: BuildingData) => {
    if (mode.mode === 'select') {
      setSelectedBuilding(building);
    } else if (mode.mode === 'demolish') {
      setBuildings(prev => prev.filter(b => b.id !== building.id));
      if (selectedBuilding?.id === building.id) {
        setSelectedBuilding(null);
      }
    } else if (mode.mode === 'edit') {
      setEditingBuilding(building);
    }
  }, [mode, selectedBuilding]);

  const clearMeasurements = useCallback(() => {
    setMeasurements([]);
  }, []);

  const handleExport = useCallback((type: string) => {
    const cityData = { buildings, roads, measurements, vegetation };
    
    switch (type) {
      case 'screenshot':
        const canvas = gl.domElement;
        const link = document.createElement('a');
        link.download = 'professional_city_screenshot.png';
        link.href = canvas.toDataURL();
        link.click();
        break;
      case 'model':
        ProfessionalExportTools.exportToProfessionalJSON(cityData, 'professional_city_model.json');
        break;
      case 'cad':
        ProfessionalExportTools.exportToCAD(buildings, roads, 'city_design.dxf');
        break;
      case 'report':
        const report = ProfessionalExportTools.generateProfessionalReport(cityData);
        const reportBlob = new Blob([report], { type: 'text/markdown' });
        const reportUrl = URL.createObjectURL(reportBlob);
        const reportLink = document.createElement('a');
        reportLink.download = 'urban_planning_report.md';
        reportLink.href = reportUrl;
        reportLink.click();
        URL.revokeObjectURL(reportUrl);
        break;
    }
  }, [buildings, roads, measurements, vegetation, gl]);

  // Enhanced terrain modification handler
  const handleTerrainModify = useCallback((position: [number, number, number], operation: string, radius: number) => {
    // The actual terrain modification is handled directly in the TerrainEditor component
    // This callback is for additional processing or validation if needed
  }, []);

  // Building update handler
  const handleBuildingUpdate = useCallback((updatedBuilding: BuildingData) => {
    setBuildings(prev => prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b));
    setEditingBuilding(null);
  }, []);

  // Enhanced placement validity check
  const isValidPlacement = useCallback((position: [number, number, number], template: BuildingTemplate) => {
    // Check for overlaps with existing buildings
    const hasOverlap = buildings.some(building => {
      const distance = Math.sqrt(
        Math.pow(building.position[0] - position[0], 2) + 
        Math.pow(building.position[2] - position[2], 2)
      );
      const minDistance = (building.width + template.baseWidth) / 2 + 2; // Add 2m safety margin
      return distance < minDistance;
    });
    
    // Check road access requirement
    let hasRoadAccess = true;
    if (template.requirements?.nearRoad) {
      hasRoadAccess = roads.some(road => {
        return road.points.some(point => {
          const distance = Math.sqrt(
            Math.pow(point[0] - position[0], 2) + 
            Math.pow(point[2] - position[2], 2)
          );
          return distance <= 10; // Must be within 10m of a road
        });
      });
    }
    
    // Check minimum population requirement
    let hasMinPopulation = true;
    if (template.requirements?.minPopulation) {
      const currentPopulation = buildings.reduce((sum, b) => {
        if (b.type === 'residential') {
          return sum + (b.properties.units || 0) * 2.3;
        }
        return sum;
      }, 0);
      hasMinPopulation = currentPopulation >= template.requirements.minPopulation;
    }
    
    return !hasOverlap && hasRoadAccess && hasMinPopulation;
  }, [buildings, roads]);

  return (
    <group>
      {/* Ground plane for interaction */}
      <mesh 
        position={[0, -1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>

      {/* Buildings */}
      {buildings.map(building => (
        <Professional3DBuilding
          key={building.id}
          building={building}
          isSelected={selectedBuilding?.id === building.id}
          isHovered={hoveredBuilding?.id === building.id}
          onClick={handleBuildingClick}
          showServiceRadius={showServiceRadius}
        />
      ))}

      {/* Roads */}
      {roads.map(road => (
        <Professional3DRoad key={road.id} road={road} />
      ))}

      {/* Building preview */}
      {mode.mode === 'place' && selectedTemplate && hoverPosition && (
        <BuildingPreview
          position={hoverPosition}
          template={selectedTemplate}
          isValidPlacement={isValidPlacement(hoverPosition, selectedTemplate)}
        />
      )}

      {/* Measurements */}
      <MeasurementTool measurements={measurements} />

      {/* Road construction preview */}
      {mode.mode === 'road' && roadPoints.length > 0 && (
        <group>
          {roadPoints.map((point, index) => (
            <Sphere key={index} position={point} args={[0.3]}>
              <meshBasicMaterial color="#ffff00" />
            </Sphere>
          ))}
        </group>
      )}

      {/* Terrain System */}
      <TerrainEditor mode={mode} onTerrainModify={handleTerrainModify} />

      {/* Vegetation System */}
      <VegetationSystem vegetation={vegetation} />

      {/* Building Editor */}
      {editingBuilding && (
        <AdvancedBuildingEditor
          building={editingBuilding}
          onUpdate={handleBuildingUpdate}
          onClose={() => setEditingBuilding(null)}
        />
      )}

      {/* Professional Control Panel */}
      <ProfessionalControlPanel
        mode={mode}
        setMode={setMode}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        buildings={buildings}
        roads={roads}
        measurements={measurements}
        clearMeasurements={clearMeasurements}
        showServiceRadius={showServiceRadius}
        setShowServiceRadius={setShowServiceRadius}
        onExport={handleExport}
        roadPoints={roadPoints}
      />
    </group>
  );
}

// Main Component Export
export default function CityEngine3DInteractive() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[30, 25, 30]} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={5}
            maxDistance={150}
            dampingFactor={0.1}
            enableDamping
          />
          
          {/* Professional Lighting Setup */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[50, 50, 25]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={200}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-bias={-0.0001}
          />
          <directionalLight
            position={[-30, 40, -30]}
            intensity={0.5}
            color="#87ceeb"
          />
          
          {/* Basic Environment without HDR - prevents external file loading errors */}
          <color args={['#87ceeb']} attach="background" />
          <fog attach="fog" args={['#87ceeb', 20, 200]} />
          
          {/* Interactive City Scene */}
          <InteractiveCityScene />
          
          {/* Professional Grid */}
          <Grid 
            args={[200, 200]} 
            position={[0, -0.9, 0]} 
            cellSize={2} 
            cellThickness={0.5} 
            cellColor="#333333" 
            sectionSize={20} 
            sectionThickness={1} 
            sectionColor="#555555" 
            fadeDistance={100} 
            fadeStrength={1}
            infiniteGrid
          />
          
          {/* Ground plane */}
          <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#2d5016" roughness={0.8} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}