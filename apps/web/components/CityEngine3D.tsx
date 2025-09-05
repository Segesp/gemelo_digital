// @ts-nocheck - TypeScript version conflict between three.js packages
"use client";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Html, Box } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { CityEngineExporter } from './CityEngineExporter';

interface DataPoint {
  longitude: number;
  latitude: number;
  value: number;
  timestamp: string;
}

interface BuildingData {
  id: string;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  type: 'residential' | 'commercial' | 'industrial' | 'port' | 'mixed_use' | 'civic' | 'recreation' | 'parking';
  color: string;
  rotation: number;
  properties: {
    floors: number;
    units?: number;
    capacity?: number;
    buildingName?: string;
    yearBuilt?: number;
    value?: number;
    population?: number;
    employees?: number;
    powerConsumption?: number;
    waterConsumption?: number;
    wasteGeneration?: number;
    serviceRadius?: number;
    condition?: number; // 0-100, building condition
    efficiency?: number; // 0-100, operational efficiency
    landValue?: number;
    taxes?: number;
  };
  utilities: {
    hasWater: boolean;
    hasPower: boolean;
    hasInternet: boolean;
    hasGas: boolean;
    roadAccess: boolean;
    transitAccess: boolean;
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
    greenSpaceContribution: number;
    energyEfficiency: number;
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
  requirements?: {
    minPopulation?: number;
    nearWater?: boolean;
    nearRoad?: boolean;
    nearTransit?: boolean;
    minLandValue?: number;
    maxPollution?: number;
    zoneTypes?: UrbanZone['type'][];
  };
  services?: {
    type: 'education' | 'health' | 'fire' | 'police' | 'park' | 'utility';
    radius: number;
    capacity: number;
  };
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
}

interface CityEngineMode {
  mode: 'select' | 'place' | 'edit' | 'zone' | 'road' | 'demolish' | 'terrain' | 'transit';
  selectedTemplate?: BuildingTemplate;
  roadType?: 'street' | 'avenue' | 'highway' | 'pedestrian';
  transitType?: 'bus' | 'metro' | 'tram';
  terrainTool?: 'raise' | 'lower' | 'flatten' | 'water';
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

interface TransitLine {
  id: string;
  type: 'bus' | 'metro' | 'tram';
  name: string;
  stations: [number, number, number][];
  route: [number, number, number][];
  color: string;
  capacity: number;
}

interface ServiceArea {
  buildingId: string;
  serviceType: 'education' | 'health' | 'fire' | 'police' | 'park';
  radius: number;
  effectiveness: number;
}

interface UrbanZone {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'mixed' | 'recreation' | 'civic' | 'agricultural' | 'protected' | 'port';
  boundary: [number, number][];
  color: string;
  density: 'low' | 'medium' | 'high';
  restrictions: {
    maxHeight?: number;
    minSetback?: number;
    allowedBuildings: BuildingData['type'][];
    requiresRoadAccess?: boolean;
    maxBuildingDensity?: number;
    environmentalRestrictions?: string[];
  };
  properties: {
    taxRate: number;
    landValue: number;
    developmentPotential: number;
    pollution: number;
    noise: number;
  };
}

interface CityEngine3DProps {
  data: DataPoint[];
  parameter: string;
  dataset: string;
}

// Enhanced Building templates library (like ArcGIS City Engine with iTwin.js capabilities)
const BUILDING_TEMPLATES: BuildingTemplate[] = [
  // Residential Buildings
  {
    id: 'house_small',
    name: 'Casa Pequeña',
    type: 'residential',
    description: 'Casa unifamiliar de 1-2 pisos',
    baseWidth: 8,
    baseDepth: 10,
    baseHeight: 6,
    color: '#8b5cf6',
    icon: '🏠',
    cost: 50000,
    requirements: { nearRoad: true, zoneTypes: ['residential', 'mixed'] },
    economics: {
      maintenanceCost: 1000,
      propertyTaxRate: 0.02,
    },
    environment: {
      pollutionRate: 1,
      noiseLevel: 10,
      powerConsumption: 5,
      waterConsumption: 8,
    }
  },
  {
    id: 'apartment_low',
    name: 'Apartamentos (Bajo)',
    type: 'residential',
    description: 'Edificio residencial de 3-4 pisos',
    baseWidth: 12,
    baseDepth: 15,
    baseHeight: 12,
    color: '#7c3aed',
    icon: '🏢',
    cost: 150000,
    requirements: { nearRoad: true, minPopulation: 100, zoneTypes: ['residential', 'mixed'] },
    economics: {
      maintenanceCost: 3000,
      propertyTaxRate: 0.025,
    },
    environment: {
      pollutionRate: 2,
      noiseLevel: 15,
      powerConsumption: 15,
      waterConsumption: 25,
    }
  },
  {
    id: 'tower_residential',
    name: 'Torre Residencial',
    type: 'residential',
    description: 'Torre de apartamentos de lujo',
    baseWidth: 15,
    baseDepth: 15,
    baseHeight: 40,
    color: '#6d28d9',
    icon: '🏗️',
    cost: 500000,
    requirements: { minPopulation: 1000, nearRoad: true, nearTransit: true, minLandValue: 100000, zoneTypes: ['residential', 'mixed'] },
    economics: {
      maintenanceCost: 8000,
      propertyTaxRate: 0.03,
    },
    environment: {
      pollutionRate: 3,
      noiseLevel: 20,
      powerConsumption: 40,
      waterConsumption: 60,
    }
  },
  
  // Commercial Buildings
  {
    id: 'shop_small',
    name: 'Tienda Local',
    type: 'commercial',
    description: 'Pequeño comercio de barrio',
    baseWidth: 6,
    baseDepth: 8,
    baseHeight: 4,
    color: '#10b981',
    icon: '🏪',
    cost: 30000,
    requirements: { nearRoad: true, zoneTypes: ['commercial', 'mixed'] },
    economics: {
      maintenanceCost: 800,
      revenue: 2000,
      operatingCosts: 1200,
      propertyTaxRate: 0.035,
      jobsCreated: 3,
    },
    environment: {
      pollutionRate: 1,
      noiseLevel: 25,
      powerConsumption: 8,
      waterConsumption: 5,
    }
  },
  {
    id: 'shopping_center',
    name: 'Centro Comercial',
    type: 'commercial',
    description: 'Gran centro comercial',
    baseWidth: 25,
    baseDepth: 30,
    baseHeight: 8,
    color: '#059669',
    icon: '🏬',
    cost: 300000,
    requirements: { minPopulation: 500, nearRoad: true, nearTransit: true, zoneTypes: ['commercial'] },
    economics: {
      maintenanceCost: 5000,
      revenue: 15000,
      operatingCosts: 8000,
      propertyTaxRate: 0.04,
      jobsCreated: 50,
    },
    environment: {
      pollutionRate: 8,
      noiseLevel: 40,
      powerConsumption: 50,
      waterConsumption: 30,
    }
  },
  {
    id: 'office_tower',
    name: 'Torre de Oficinas',
    type: 'commercial',
    description: 'Rascacielos corporativo',
    baseWidth: 18,
    baseDepth: 18,
    baseHeight: 50,
    color: '#047857',
    icon: '🏢',
    cost: 800000,
    requirements: { minPopulation: 2000, nearRoad: true, nearTransit: true, minLandValue: 150000, zoneTypes: ['commercial'] },
    economics: {
      maintenanceCost: 12000,
      revenue: 25000,
      operatingCosts: 15000,
      propertyTaxRate: 0.05,
      jobsCreated: 200,
    },
    environment: {
      pollutionRate: 5,
      noiseLevel: 30,
      powerConsumption: 80,
      waterConsumption: 40,
    }
  },
  
  // Industrial Buildings
  {
    id: 'warehouse',
    name: 'Almacén',
    type: 'industrial',
    description: 'Bodega industrial',
    baseWidth: 20,
    baseDepth: 30,
    baseHeight: 8,
    color: '#dc2626',
    icon: '🏭',
    cost: 100000,
    requirements: { nearRoad: true, zoneTypes: ['industrial'] },
    economics: {
      maintenanceCost: 2000,
      revenue: 5000,
      operatingCosts: 3000,
      propertyTaxRate: 0.03,
      jobsCreated: 15,
    },
    environment: {
      pollutionRate: 15,
      noiseLevel: 60,
      powerConsumption: 25,
      waterConsumption: 10,
    }
  },
  {
    id: 'factory',
    name: 'Fábrica',
    type: 'industrial',
    description: 'Planta manufacturera',
    baseWidth: 25,
    baseDepth: 40,
    baseHeight: 12,
    color: '#b91c1c',
    icon: '🏭',
    cost: 250000,
    requirements: { nearRoad: true, zoneTypes: ['industrial'] },
    economics: {
      maintenanceCost: 5000,
      revenue: 12000,
      operatingCosts: 7000,
      propertyTaxRate: 0.04,
      jobsCreated: 40,
    },
    environment: {
      pollutionRate: 25,
      noiseLevel: 80,
      powerConsumption: 60,
      waterConsumption: 20,
    }
  },
  
  // Port Buildings
  {
    id: 'container_terminal',
    name: 'Terminal de Contenedores',
    type: 'port',
    description: 'Terminal portuaria',
    baseWidth: 30,
    baseDepth: 50,
    baseHeight: 15,
    color: '#2563eb',
    icon: '🚢',
    cost: 500000,
    requirements: { nearWater: true, nearRoad: true, zoneTypes: ['industrial', 'port'] },
    economics: {
      maintenanceCost: 8000,
      revenue: 20000,
      operatingCosts: 12000,
      propertyTaxRate: 0.06,
      jobsCreated: 100,
    },
    environment: {
      pollutionRate: 30,
      noiseLevel: 90,
      powerConsumption: 80,
      waterConsumption: 15,
    }
  },
  {
    id: 'port_warehouse',
    name: 'Almacén Portuario',
    type: 'port',
    description: 'Bodega del puerto',
    baseWidth: 20,
    baseDepth: 35,
    baseHeight: 10,
    color: '#1d4ed8',
    icon: '🏗️',
    cost: 200000,
    requirements: { nearWater: true, nearRoad: true, zoneTypes: ['industrial', 'port'] },
    economics: {
      maintenanceCost: 3000,
      revenue: 8000,
      operatingCosts: 5000,
      propertyTaxRate: 0.045,
      jobsCreated: 25,
    },
    environment: {
      pollutionRate: 20,
      noiseLevel: 70,
      powerConsumption: 30,
      waterConsumption: 8,
    }
  },
  
  // Civic Buildings
  {
    id: 'city_hall',
    name: 'Municipalidad',
    type: 'civic',
    description: 'Edificio municipal',
    baseWidth: 20,
    baseDepth: 15,
    baseHeight: 15,
    color: '#f59e0b',
    icon: '🏛️',
    cost: 300000,
    requirements: { zoneTypes: ['civic', 'mixed'] },
    services: {
      type: 'utility',
      radius: 30,
      capacity: 10000,
    },
    economics: {
      maintenanceCost: 5000,
      operatingCosts: 8000,
      propertyTaxRate: 0,
      jobsCreated: 30,
    },
    environment: {
      pollutionRate: 2,
      noiseLevel: 20,
      powerConsumption: 20,
      waterConsumption: 15,
    }
  },
  {
    id: 'hospital',
    name: 'Hospital',
    type: 'civic',
    description: 'Centro de salud',
    baseWidth: 25,
    baseDepth: 20,
    baseHeight: 18,
    color: '#ef4444',
    icon: '🏥',
    cost: 600000,
    requirements: { nearRoad: true, nearTransit: true, zoneTypes: ['civic', 'mixed'] },
    services: {
      type: 'health',
      radius: 40,
      capacity: 5000,
    },
    economics: {
      maintenanceCost: 8000,
      operatingCosts: 15000,
      propertyTaxRate: 0,
      jobsCreated: 80,
    },
    environment: {
      pollutionRate: 3,
      noiseLevel: 35,
      powerConsumption: 50,
      waterConsumption: 40,
    }
  },
  {
    id: 'school',
    name: 'Colegio',
    type: 'civic',
    description: 'Centro educativo',
    baseWidth: 30,
    baseDepth: 25,
    baseHeight: 12,
    color: '#3b82f6',
    icon: '🏫',
    cost: 400000,
    requirements: { nearRoad: true, zoneTypes: ['civic', 'residential', 'mixed'] },
    services: {
      type: 'education',
      radius: 25,
      capacity: 1000,
    },
    economics: {
      maintenanceCost: 6000,
      operatingCosts: 10000,
      propertyTaxRate: 0,
      jobsCreated: 40,
    },
    environment: {
      pollutionRate: 1,
      noiseLevel: 25,
      powerConsumption: 30,
      waterConsumption: 20,
      greenContribution: 5,
    }
  },
  {
    id: 'fire_station',
    name: 'Estación de Bomberos',
    type: 'civic',
    description: 'Servicios de emergencia',
    baseWidth: 15,
    baseDepth: 20,
    baseHeight: 8,
    color: '#dc2626',
    icon: '🚒',
    cost: 200000,
    requirements: { nearRoad: true, zoneTypes: ['civic'] },
    services: {
      type: 'fire',
      radius: 35,
      capacity: 2000,
    },
    economics: {
      maintenanceCost: 4000,
      operatingCosts: 6000,
      propertyTaxRate: 0,
      jobsCreated: 20,
    },
    environment: {
      pollutionRate: 2,
      noiseLevel: 40,
      powerConsumption: 15,
      waterConsumption: 10,
    }
  },
  {
    id: 'police_station',
    name: 'Comisaría',
    type: 'civic',
    description: 'Estación de policía',
    baseWidth: 18,
    baseDepth: 15,
    baseHeight: 10,
    color: '#1e40af',
    icon: '🚔',
    cost: 250000,
    requirements: { nearRoad: true, zoneTypes: ['civic'] },
    services: {
      type: 'police',
      radius: 30,
      capacity: 3000,
    },
    economics: {
      maintenanceCost: 5000,
      operatingCosts: 7000,
      propertyTaxRate: 0,
      jobsCreated: 25,
    },
    environment: {
      pollutionRate: 2,
      noiseLevel: 30,
      powerConsumption: 18,
      waterConsumption: 12,
    }
  },
  
  // Recreation
  {
    id: 'park',
    name: 'Parque',
    type: 'recreation',
    description: 'Área verde recreativa',
    baseWidth: 15,
    baseDepth: 15,
    baseHeight: 1,
    color: '#22c55e',
    icon: '🌳',
    cost: 50000,
    requirements: { zoneTypes: ['recreation', 'residential', 'mixed'] },
    services: {
      type: 'park',
      radius: 20,
      capacity: 500,
    },
    economics: {
      maintenanceCost: 1000,
      propertyTaxRate: 0,
    },
    environment: {
      pollutionRate: -5, // Negative pollution (reduces pollution)
      noiseLevel: 10,
      powerConsumption: 2,
      waterConsumption: 15,
      greenContribution: 15,
    }
  },
  {
    id: 'stadium',
    name: 'Estadio',
    type: 'recreation',
    description: 'Estadio deportivo',
    baseWidth: 40,
    baseDepth: 30,
    baseHeight: 20,
    color: '#84cc16',
    icon: '🏟️',
    cost: 1000000,
    requirements: { minPopulation: 5000, nearRoad: true, nearTransit: true, zoneTypes: ['recreation'] },
    economics: {
      maintenanceCost: 15000,
      revenue: 8000,
      operatingCosts: 20000,
      propertyTaxRate: 0.02,
      jobsCreated: 50,
    },
    environment: {
      pollutionRate: 10,
      noiseLevel: 100,
      powerConsumption: 100,
      waterConsumption: 50,
    }
  },
  {
    id: 'library',
    name: 'Biblioteca',
    type: 'recreation',
    description: 'Biblioteca pública',
    baseWidth: 20,
    baseDepth: 15,
    baseHeight: 8,
    color: '#7c3aed',
    icon: '📚',
    cost: 180000,
    requirements: { nearRoad: true, zoneTypes: ['civic', 'recreation', 'mixed'] },
    services: {
      type: 'education',
      radius: 15,
      capacity: 300,
    },
    economics: {
      maintenanceCost: 3000,
      operatingCosts: 4000,
      propertyTaxRate: 0,
      jobsCreated: 15,
    },
    environment: {
      pollutionRate: 0,
      noiseLevel: 5,
      powerConsumption: 12,
      waterConsumption: 8,
      greenContribution: 2,
    }
  }
];

// Road Building System
function RoadBuilder({
  mode,
  roads,
  onAddRoad,
  onSelectRoad
}: {
  mode: CityEngineMode;
  roads: Road[];
  onAddRoad: (road: Road) => void;
  onSelectRoad: (road: Road | null) => void;
}) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<[number, number, number][]>([]);
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);

  const roadTypes = {
    street: { width: 2, color: '#444444', speedLimit: 30, capacity: 100 },
    avenue: { width: 3, color: '#555555', speedLimit: 50, capacity: 200 },
    highway: { width: 4, color: '#666666', speedLimit: 80, capacity: 500 },
    pedestrian: { width: 1.5, color: '#8b7355', speedLimit: 5, capacity: 50 }
  };

  const handleGroundClick = useCallback((event: any) => {
    if (mode.mode === 'road' && mode.roadType) {
      const point = event.point;
      const snapPosition: [number, number, number] = [
        Math.round(point.x),
        0.05,
        Math.round(point.z)
      ];

      if (!isBuilding) {
        // Start new road
        setCurrentPoints([snapPosition]);
        setIsBuilding(true);
      } else {
        // Add point to current road
        const newPoints = [...currentPoints, snapPosition];
        setCurrentPoints(newPoints);

        // If right-click or double-click, finish road
        if (event.button === 2 || newPoints.length > 10) {
          const roadConfig = roadTypes[mode.roadType];
          const newRoad: Road = {
            id: `road_${Date.now()}`,
            type: mode.roadType,
            points: newPoints,
            width: roadConfig.width,
            color: roadConfig.color,
            capacity: roadConfig.capacity,
            speedLimit: roadConfig.speedLimit
          };
          onAddRoad(newRoad);
          setCurrentPoints([]);
          setIsBuilding(false);
        }
      }
    }
  }, [mode, isBuilding, currentPoints, onAddRoad]);

  const handleGroundMove = useCallback((event: any) => {
    if (mode.mode === 'road' && mode.roadType) {
      const point = event.point;
      setHoverPosition([
        Math.round(point.x),
        0.05,
        Math.round(point.z)
      ]);
    } else {
      setHoverPosition(null);
    }
  }, [mode]);

  // Cancel road building on escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBuilding) {
        setCurrentPoints([]);
        setIsBuilding(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isBuilding]);

  return (
    <group>
      {/* Interactive ground plane for road building */}
      <mesh 
        position={[0, 0, 0]}
        onClick={handleGroundClick}
        onPointerMove={handleGroundMove}
        onPointerLeave={() => setHoverPosition(null)}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Existing roads */}
      {roads.map((road) => (
        <RoadSegment key={road.id} road={road} />
      ))}

      {/* Preview road while building */}
      {isBuilding && currentPoints.length > 0 && hoverPosition && (
        <RoadPreview 
          points={[...currentPoints, hoverPosition]} 
          roadType={mode.roadType!}
        />
      )}

      {/* Current road being built */}
      {isBuilding && currentPoints.length > 1 && (
        <RoadPreview 
          points={currentPoints} 
          roadType={mode.roadType!}
          isConfirmed={true}
        />
      )}

      {/* Road building indicators */}
      {currentPoints.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.3]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      ))}
    </group>
  );
}

function RoadSegment({ road }: { road: Road }) {
  const roadGeometry = useMemo(() => {
    if (road.points.length < 2) return null;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    for (let i = 0; i < road.points.length - 1; i++) {
      const start = road.points[i];
      const end = road.points[i + 1];
      
      // Calculate road direction
      const direction = new THREE.Vector3(end[0] - start[0], 0, end[2] - start[2]).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(road.width / 2);
      
      // Create road segment vertices
      const v1 = new THREE.Vector3(start[0], start[1], start[2]).add(perpendicular);
      const v2 = new THREE.Vector3(start[0], start[1], start[2]).sub(perpendicular);
      const v3 = new THREE.Vector3(end[0], end[1], end[2]).add(perpendicular);
      const v4 = new THREE.Vector3(end[0], end[1], end[2]).sub(perpendicular);
      
      const baseIndex = i * 4;
      vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, v4.x, v4.y, v4.z);
      indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex + 1, baseIndex + 3, baseIndex + 2);
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    return geometry;
  }, [road]);

  if (!roadGeometry) return null;

  return (
    <mesh geometry={roadGeometry}>
      <meshStandardMaterial 
        color={road.color}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function RoadPreview({ 
  points, 
  roadType,
  isConfirmed = false 
}: { 
  points: [number, number, number][]; 
  roadType: 'street' | 'avenue' | 'highway' | 'pedestrian';
  isConfirmed?: boolean;
}) {
  const roadTypes = {
    street: { width: 2, color: '#444444' },
    avenue: { width: 3, color: '#555555' },
    highway: { width: 4, color: '#666666' },
    pedestrian: { width: 1.5, color: '#8b7355' }
  };

  const config = roadTypes[roadType];

  return (
    <group>
      {points.map((point, index) => {
        if (index === points.length - 1) return null;
        
        const nextPoint = points[index + 1];
        const length = Math.sqrt(
          Math.pow(nextPoint[0] - point[0], 2) +
          Math.pow(nextPoint[2] - point[2], 2)
        );
        const midpoint: [number, number, number] = [
          (point[0] + nextPoint[0]) / 2,
          point[1],
          (point[2] + nextPoint[2]) / 2
        ];
        const angle = Math.atan2(nextPoint[2] - point[2], nextPoint[0] - point[0]);

        return (
          <mesh 
            key={index} 
            position={midpoint} 
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[length, 0.1, config.width]} />
            <meshStandardMaterial 
              color={config.color} 
              transparent 
              opacity={isConfirmed ? 0.8 : 0.5}
              wireframe={!isConfirmed}
            />
          </mesh>
        );
      })}
    </group>
  );
}
// Service Radius Visualization System
function ServiceRadiusVisualizer({ 
  buildings, 
  showServiceAreas 
}: { 
  buildings: BuildingData[]; 
  showServiceAreas: boolean;
}) {
  const serviceBuildings = buildings.filter(building => 
    BUILDING_TEMPLATES.find(template => 
      template.id === getTemplateId(building) && template.services
    )
  );

  if (!showServiceAreas) return null;

  return (
    <group>
      {serviceBuildings.map((building) => {
        const template = BUILDING_TEMPLATES.find(t => t.id === getTemplateId(building));
        if (!template?.services) return null;

        const serviceColor = {
          education: '#3b82f6',
          health: '#ef4444', 
          fire: '#dc2626',
          police: '#1e40af',
          park: '#22c55e',
          utility: '#f59e0b'
        }[template.services.type] || '#888888';

        return (
          <group key={building.id}>
            {/* Service radius circle */}
            <mesh 
              position={[building.position[0], 0.2, building.position[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[template.services.radius - 1, template.services.radius, 32]} />
              <meshBasicMaterial 
                color={serviceColor} 
                transparent 
                opacity={0.3}
              />
            </mesh>
            
            {/* Service effectiveness visualization */}
            <mesh 
              position={[building.position[0], 0.15, building.position[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[template.services.radius * 0.7, 32]} />
              <meshBasicMaterial 
                color={serviceColor} 
                transparent 
                opacity={0.15}
              />
            </mesh>

            {/* Service info */}
            <Html
              position={[building.position[0], building.height + 8, building.position[2]]}
              center
              distanceFactor={15}
            >
              <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs">
                <div className="font-bold text-yellow-400">
                  {template.services.type.toUpperCase()} SERVICE
                </div>
                <div>Radio: {template.services.radius}m</div>
                <div>Capacidad: {template.services.capacity}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// Helper function to get template ID from building
function getTemplateId(building: BuildingData): string {
  // Simple mapping based on building properties
  if (building.type === 'residential') {
    if (building.height > 30) return 'tower_residential';
    if (building.height > 10) return 'apartment_low';
    return 'house_small';
  }
  if (building.type === 'commercial') {
    if (building.height > 40) return 'office_tower';
    if (building.width > 20) return 'shopping_center';
    return 'shop_small';
  }
  if (building.type === 'civic') {
    if (building.properties.buildingName?.includes('Hospital')) return 'hospital';
    if (building.properties.buildingName?.includes('Colegio')) return 'school';
    if (building.properties.buildingName?.includes('Bomberos')) return 'fire_station';
    if (building.properties.buildingName?.includes('Comisaría')) return 'police_station';
    return 'city_hall';
  }
  if (building.type === 'recreation') {
    if (building.height > 15) return 'stadium';
    if (building.properties.buildingName?.includes('Biblioteca')) return 'library';
    return 'park';
  }
  if (building.type === 'industrial') {
    if (building.width > 22) return 'factory';
    return 'warehouse';
  }
  if (building.type === 'port') {
    if (building.width > 25) return 'container_terminal';
    return 'port_warehouse';
  }
  return 'house_small';
}

// Population and Economic Simulation System
interface CityEconomics {
  population: number;
  totalJobs: number;
  unemploymentRate: number;
  averageIncome: number;
  totalTaxRevenue: number;
  totalExpenses: number;
  budget: number;
  landValue: number;
  pollutionLevel: number;
  happinessIndex: number;
  educationLevel: number;
  healthLevel: number;
  crimeRate: number;
}

function calculateCityEconomics(buildings: BuildingData[]): CityEconomics {
  let population = 0;
  let totalJobs = 0;
  let totalTaxRevenue = 0;
  let totalExpenses = 0;
  let totalLandValue = 0;
  let totalPollution = 0;

  buildings.forEach(building => {
    const template = BUILDING_TEMPLATES.find(t => t.id === getTemplateId(building));
    if (!template) return;

    // Calculate population
    if (building.type === 'residential') {
      population += building.properties.units || 0;
    }

    // Calculate jobs
    if (template.economics.jobsCreated) {
      totalJobs += template.economics.jobsCreated;
    }

    // Calculate tax revenue
    totalTaxRevenue += (building.properties.value || 0) * template.economics.propertyTaxRate;
    if (template.economics.revenue) {
      totalTaxRevenue += template.economics.revenue * 0.1; // Business tax
    }

    // Calculate expenses
    totalExpenses += template.economics.maintenanceCost;
    if (template.economics.operatingCosts) {
      totalExpenses += template.economics.operatingCosts;
    }

    // Calculate land value
    totalLandValue += building.properties.landValue || building.properties.value || 0;

    // Calculate pollution
    totalPollution += template.environment.pollutionRate;
  });

  const unemploymentRate = Math.max(0, (population * 0.6 - totalJobs) / (population * 0.6));
  const averageIncome = 50000 - (unemploymentRate * 20000);
  const budget = totalTaxRevenue - totalExpenses;
  const pollutionLevel = Math.min(100, totalPollution / buildings.length);
  
  // Calculate derived metrics
  const happinessIndex = Math.max(0, Math.min(100, 
    80 - pollutionLevel * 0.5 - unemploymentRate * 50 + (budget > 0 ? 10 : -10)
  ));
  
  const educationLevel = Math.min(100, 
    buildings.filter(b => getTemplateId(b) === 'school' || getTemplateId(b) === 'library').length * 10
  );
  
  const healthLevel = Math.min(100,
    buildings.filter(b => getTemplateId(b) === 'hospital').length * 15 + 50
  );
  
  const crimeRate = Math.max(0,
    20 - buildings.filter(b => getTemplateId(b) === 'police_station').length * 5
  );

  return {
    population,
    totalJobs,
    unemploymentRate,
    averageIncome,
    totalTaxRevenue,
    totalExpenses,
    budget,
    landValue: totalLandValue,
    pollutionLevel,
    happinessIndex,
    educationLevel,
    healthLevel,
    crimeRate
  };
}

function BuildingPlacer({ 
  mode, 
  buildings, 
  onPlaceBuilding, 
  onSelectBuilding,
  selectedBuilding 
}: {
  mode: CityEngineMode;
  buildings: BuildingData[];
  onPlaceBuilding: (position: [number, number, number], template: BuildingTemplate) => void;
  onSelectBuilding: (building: BuildingData | null) => void;
  selectedBuilding: BuildingData | null;
}) {
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  const groundRef = useRef<THREE.Mesh>(null);
  
  // Ground plane for detecting placement clicks
  const handleGroundClick = useCallback((event: any) => {
    if (mode.mode === 'place' && mode.selectedTemplate) {
      const point = event.point;
      const snapPosition: [number, number, number] = [
        Math.round(point.x),
        0,
        Math.round(point.z)
      ];
      onPlaceBuilding(snapPosition, mode.selectedTemplate);
    }
  }, [mode, onPlaceBuilding]);

  const handleGroundMove = useCallback((event: any) => {
    if (mode.mode === 'place' && mode.selectedTemplate) {
      const point = event.point;
      setHoverPosition([
        Math.round(point.x),
        0,
        Math.round(point.z)
      ]);
    } else {
      setHoverPosition(null);
    }
  }, [mode]);

  return (
    <group>
      {/* Interactive ground plane */}
      <mesh 
        ref={groundRef}
        position={[0, -0.1, 0]}
        onClick={handleGroundClick}
        onPointerMove={handleGroundMove}
        onPointerLeave={() => setHoverPosition(null)}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Preview building when placing */}
      {mode.mode === 'place' && mode.selectedTemplate && hoverPosition && (
        <PreviewBuilding 
          template={mode.selectedTemplate} 
          position={hoverPosition} 
        />
      )}
      
      {/* Selection highlight */}
      {selectedBuilding && (
        <SelectionHighlight building={selectedBuilding} />
      )}
    </group>
  );
}

// Preview building during placement
function PreviewBuilding({ template, position }: { template: BuildingTemplate; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, template.baseHeight / 2, 0]}>
        <boxGeometry args={[template.baseWidth, template.baseHeight, template.baseDepth]} />
        <meshStandardMaterial 
          color={template.color} 
          transparent 
          opacity={0.5}
          wireframe
        />
      </mesh>
      <Text
        position={[0, template.baseHeight + 2, 0]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {template.icon} {template.name}
      </Text>
    </group>
  );
}

// Selection highlight for buildings
function SelectionHighlight({ building }: { building: BuildingData }) {
  const highlightRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (highlightRef.current) {
      highlightRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group position={building.position}>
      <mesh 
        ref={highlightRef}
        position={[0, building.height + 2, 0]}
      >
        <ringGeometry args={[building.width * 0.6, building.width * 0.8, 8]} />
        <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Enhanced building component with detailed properties and interaction
function InteractiveBuilding({ 
  building, 
  onClick,
  isSelected,
  mode
}: { 
  building: BuildingData;
  onClick: (building: BuildingData) => void;
  isSelected: boolean;
  mode: CityEngineMode;
}) {
  const [hovered, setHovered] = useState(false);
  const buildingRef = useRef<THREE.Group>(null);
  
  // Animate selection
  useFrame(() => {
    if (buildingRef.current && isSelected) {
      buildingRef.current.position.y = Math.sin(Date.now() * 0.003) * 0.5;
    }
  });

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    if (mode.mode === 'select' || mode.mode === 'edit') {
      onClick(building);
    } else if (mode.mode === 'demolish') {
      // Handle demolish action
      onClick(building);
    }
  }, [building, onClick, mode]);

  return (
    <group 
      ref={buildingRef}
      position={building.position}
      rotation={[0, building.rotation, 0]}
      onClick={handleClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Main building structure */}
      <mesh position={[0, building.height / 2, 0]}>
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <meshStandardMaterial 
          color={isSelected ? '#ffff00' : building.color}
          opacity={mode.mode === 'demolish' ? 0.5 : 0.8}
          transparent
        />
      </mesh>

      {/* Building details based on type */}
      {building.type === 'residential' && building.height > 10 && (
        <ResidentialDetails building={building} />
      )}
      
      {building.type === 'commercial' && (
        <CommercialDetails building={building} />
      )}
      
      {building.type === 'industrial' && (
        <IndustrialDetails building={building} />
      )}
      
      {building.type === 'port' && (
        <PortDetails building={building} />
      )}

      {/* Building information on hover */}
      {hovered && (
        <BuildingInfoPanel building={building} />
      )}

      {/* Foundation */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[building.width + 1, 1, building.depth + 1]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      
      {/* Demolish indicator */}
      {mode.mode === 'demolish' && hovered && (
        <Text
          position={[0, building.height + 3, 0]}
          fontSize={2}
          color="red"
          anchorX="center"
          anchorY="middle"
        >
          💥 DEMOLER
        </Text>
      )}
    </group>
  );
}

// Detailed building components
function ResidentialDetails({ building }: { building: BuildingData }) {
  return (
    <group>
      {/* Windows pattern */}
      {Array.from({ length: Math.floor(building.height / 3) }, (_, floor) => (
        <group key={floor}>
          {Array.from({ length: Math.floor(building.width / 2) }, (_, window) => (
            <mesh 
              key={window}
              position={[
                (window - Math.floor(building.width / 4)) * 2,
                3 + floor * 3,
                building.depth / 2 + 0.1
              ]}
            >
              <boxGeometry args={[0.8, 1.2, 0.1]} />
              <meshStandardMaterial color="#87ceeb" transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Balconies for residential */}
      {building.height > 15 && Array.from({ length: 3 }, (_, i) => (
        <mesh 
          key={i}
          position={[0, 6 + i * 6, building.depth / 2 + 1]}
        >
          <boxGeometry args={[building.width * 0.8, 0.2, 2]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      ))}
    </group>
  );
}

function CommercialDetails({ building }: { building: BuildingData }) {
  return (
    <group>
      {/* Large ground floor windows */}
      <mesh position={[0, 2, building.depth / 2 + 0.1]}>
        <boxGeometry args={[building.width * 0.9, 3, 0.1]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
      </mesh>
      
      {/* Company sign */}
      <mesh position={[0, building.height + 1, building.depth / 2 + 0.2]}>
        <boxGeometry args={[building.width * 0.6, 2, 0.1]} />
        <meshStandardMaterial color="#ff6b35" />
      </mesh>
    </group>
  );
}

function IndustrialDetails({ building }: { building: BuildingData }) {
  return (
    <group>
      {/* Industrial chimneys */}
      <mesh position={[building.width / 3, building.height + 3, building.depth / 3]}>
        <cylinderGeometry args={[1, 1, 6]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* Loading docks */}
      <mesh position={[building.width / 2 + 1, 2, 0]}>
        <boxGeometry args={[2, 4, building.depth * 0.8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </group>
  );
}

function PortDetails({ building }: { building: BuildingData }) {
  return (
    <group>
      {/* Cranes */}
      <mesh position={[0, building.height + 10, 0]}>
        <boxGeometry args={[building.width * 1.5, 2, 2]} />
        <meshStandardMaterial color="#ffaa00" />
      </mesh>
      
      {/* Support pillars */}
      <mesh position={[-building.width / 2, building.height / 2 + 5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, building.height + 10]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      <mesh position={[building.width / 2, building.height / 2 + 5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, building.height + 10]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    </group>
  );
}

function BuildingInfoPanel({ building }: { building: BuildingData }) {
  return (
    <Html
      position={[0, building.height + 5, 0]}
      center
      distanceFactor={10}
    >
      <div className="bg-black bg-opacity-80 text-white p-2 rounded text-sm min-w-48">
        <div className="font-bold text-yellow-400">{building.properties.buildingName || `${building.type.toUpperCase()} #${building.id.slice(-4)}`}</div>
        <div>Altura: {building.height}m</div>
        <div>Pisos: {building.properties.floors}</div>
        {building.properties.units && <div>Unidades: {building.properties.units}</div>}
        {building.properties.capacity && <div>Capacidad: {building.properties.capacity}</div>}
        {building.properties.yearBuilt && <div>Año: {building.properties.yearBuilt}</div>}
        {building.properties.value && <div>Valor: ${building.properties.value.toLocaleString()}</div>}
      </div>
    </Html>
  );
}

// Street network generator
function StreetNetwork() {
  const streets = useMemo(() => {
    const streetData = [];
    
    // Main streets (grid pattern)
    for (let i = -10; i <= 10; i += 2) {
      // Horizontal streets
      streetData.push({
        start: [-20, 0, i],
        end: [20, 0, i],
        width: i === 0 ? 1.5 : 1
      });
      // Vertical streets
      streetData.push({
        start: [i, 0, -20],
        end: [i, 0, 20],
        width: i === 0 ? 1.5 : 1
      });
    }
    
    return streetData;
  }, []);

  return (
    <group>
      {streets.map((street, index) => {
        const length = Math.sqrt(
          Math.pow(street.end[0] - street.start[0], 2) +
          Math.pow(street.end[2] - street.start[2], 2)
        );
        const midpoint: [number, number, number] = [
          (street.start[0] + street.end[0]) / 2,
          0.05,
          (street.start[2] + street.end[2]) / 2
        ];
        const rotation: [number, number, number] = street.start[0] === street.end[0] ? [0, 0, 0] : [0, Math.PI / 2, 0];

        return (
          <mesh key={index} position={midpoint} rotation={rotation}>
            <boxGeometry args={[length, 0.1, street.width]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
        );
      })}
    </group>
  );
}

// City zoning visualization
function ZoningAreas() {
  const zones = useMemo(() => [
    { name: 'Puerto', center: [0, 0.1, -15] as [number, number, number], size: [15, 0.1, 8] as [number, number, number], color: '#0369a1' },
    { name: 'Comercial', center: [-8, 0.1, 0] as [number, number, number], size: [8, 0.1, 12] as [number, number, number], color: '#059669' },
    { name: 'Residencial', center: [8, 0.1, 5] as [number, number, number], size: [12, 0.1, 15] as [number, number, number], color: '#4f46e5' },
    { name: 'Industrial', center: [0, 0.1, 15] as [number, number, number], size: [10, 0.1, 6] as [number, number, number], color: '#dc2626' }
  ], []);

  return (
    <group>
      {zones.map((zone, index) => (
        <mesh key={index} position={zone.center}>
          <boxGeometry args={zone.size} />
          <meshStandardMaterial 
            color={zone.color} 
            transparent 
            opacity={0.2}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

// Professional Urban Planning Palette - Enhanced like ArcGIS City Engine
function BuildingPalette({ 
  mode, 
  setMode,
  selectedTemplate,
  setSelectedTemplate
}: {
  mode: CityEngineMode;
  setMode: (mode: CityEngineMode) => void;
  selectedTemplate: BuildingTemplate | null;
  setSelectedTemplate: (template: BuildingTemplate | null) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<BuildingData['type'] | 'all'>('all');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  
  const categories = ['all', 'residential', 'commercial', 'industrial', 'port', 'civic', 'recreation'] as const;
  
  const filteredTemplates = BUILDING_TEMPLATES.filter(template => 
    selectedCategory === 'all' || template.type === selectedCategory
  );

  return (
    <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-3 text-yellow-400">🏗️ Professional City Engine</h3>
      
      {/* Professional Mode Selection */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2 flex items-center">
          <span className="mr-2">🛠️</span>
          Herramientas de Planificación:
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => setMode({ mode: 'select' })}
            className={`px-3 py-2 text-xs rounded flex items-center justify-center ${mode.mode === 'select' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            🔍 Seleccionar
          </button>
          <button
            onClick={() => setMode({ mode: 'place' })}
            className={`px-3 py-2 text-xs rounded flex items-center justify-center ${mode.mode === 'place' ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            🏗️ Construir
          </button>
          <button
            onClick={() => setMode({ mode: 'road', roadType: 'street' })}
            className={`px-3 py-2 text-xs rounded flex items-center justify-center ${mode.mode === 'road' ? 'bg-orange-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            🛣️ Calles
          </button>
          <button
            onClick={() => setMode({ mode: 'zone' })}
            className={`px-3 py-2 text-xs rounded flex items-center justify-center ${mode.mode === 'zone' ? 'bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            🗺️ Zonificar
          </button>
          <button
            onClick={() => setMode({ mode: 'transit', transitType: 'bus' })}
            className={`px-3 py-2 text-xs rounded flex items-center justify-center ${mode.mode === 'transit' ? 'bg-cyan-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            🚌 Transporte
          </button>
          <button
            onClick={() => setMode({ mode: 'demolish' })}
            className={`px-3 py-2 text-xs rounded flex items-center justify-center ${mode.mode === 'demolish' ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            💥 Demoler
          </button>
        </div>
      </div>

      {/* Road Building Tools */}
      {mode.mode === 'road' && (
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h4 className="text-sm font-semibold mb-2 text-orange-400">🛣️ Tipos de Vía:</h4>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode({ mode: 'road', roadType: 'street' })}
              className={`px-2 py-1 text-xs rounded ${mode.roadType === 'street' ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              🏘️ Calle
            </button>
            <button
              onClick={() => setMode({ mode: 'road', roadType: 'avenue' })}
              className={`px-2 py-1 text-xs rounded ${mode.roadType === 'avenue' ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              🏙️ Avenida
            </button>
            <button
              onClick={() => setMode({ mode: 'road', roadType: 'highway' })}
              className={`px-2 py-1 text-xs rounded ${mode.roadType === 'highway' ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              🛣️ Autopista
            </button>
            <button
              onClick={() => setMode({ mode: 'road', roadType: 'pedestrian' })}
              className={`px-2 py-1 text-xs rounded ${mode.roadType === 'pedestrian' ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              🚶 Peatonal
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-300">
            💡 Click para iniciar, click para agregar puntos, click derecho para terminar
          </div>
        </div>
      )}

      {/* Transit Tools */}
      {mode.mode === 'transit' && (
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h4 className="text-sm font-semibold mb-2 text-cyan-400">🚌 Transporte Público:</h4>
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => setMode({ mode: 'transit', transitType: 'bus' })}
              className={`px-2 py-1 text-xs rounded ${mode.transitType === 'bus' ? 'bg-cyan-500' : 'bg-gray-600'}`}
            >
              🚌 Línea de Bus
            </button>
            <button
              onClick={() => setMode({ mode: 'transit', transitType: 'metro' })}
              className={`px-2 py-1 text-xs rounded ${mode.transitType === 'metro' ? 'bg-cyan-500' : 'bg-gray-600'}`}
            >
              🚇 Metro
            </button>
            <button
              onClick={() => setMode({ mode: 'transit', transitType: 'tram' })}
              className={`px-2 py-1 text-xs rounded ${mode.transitType === 'tram' ? 'bg-cyan-500' : 'bg-gray-600'}`}
            >
              🚊 Tranvía
            </button>
          </div>
        </div>
      )}

      {/* Building Category Selection */}
      {mode.mode === 'place' && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-green-400">🏗️ Categorías de Edificios:</h4>
          <div className="grid grid-cols-2 gap-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === category ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {category === 'all' ? '🏘️ Todo' : 
                 category === 'residential' ? '🏠 Residencial' :
                 category === 'commercial' ? '🏬 Comercial' :
                 category === 'industrial' ? '🏭 Industrial' :
                 category === 'port' ? '🚢 Puerto' :
                 category === 'civic' ? '🏛️ Cívico' :
                 '🌳 Recreación'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Building Templates */}
      {mode.mode === 'place' && (
        <div className="max-h-64 overflow-y-auto">
          <h4 className="text-sm font-semibold mb-2 text-green-400">🏢 Edificios Disponibles:</h4>
          <div className="grid grid-cols-1 gap-2">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setMode({ mode: 'place', selectedTemplate: template });
                }}
                className={`p-3 text-xs rounded border-2 transition-all text-left ${
                  selectedTemplate?.id === template.id 
                    ? 'border-yellow-500 bg-yellow-500 bg-opacity-20' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="text-lg">{template.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{template.name}</div>
                    <div className="text-green-400 font-mono">${template.cost.toLocaleString()}</div>
                    <div className="text-gray-300 text-xs mt-1">{template.description}</div>
                    {template.requirements && (
                      <div className="text-xs text-yellow-400 mt-1">
                        {template.requirements.minPopulation && `👥 Min: ${template.requirements.minPopulation}`}
                        {template.requirements.nearRoad && ' 🛣️ Calle'}
                        {template.requirements.nearWater && ' 🌊 Agua'}
                        {template.requirements.nearTransit && ' 🚌 Transporte'}
                      </div>
                    )}
                    {template.services && (
                      <div className="text-xs text-blue-400 mt-1">
                        🎯 Servicio: {template.services.type} ({template.services.radius}m)
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Tools Toggle */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <button
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="text-xs text-gray-400 hover:text-white flex items-center"
        >
          {showAdvancedTools ? '🔽' : '▶️'} Herramientas Avanzadas
        </button>
        
        {showAdvancedTools && (
          <div className="mt-2 space-y-2">
            <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
              📊 Análisis de Densidad
            </button>
            <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
              🌍 Impacto Ambiental
            </button>
            <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
              💰 Análisis Económico
            </button>
            <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
              🚦 Simulación de Tráfico
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Building Property Editor
function BuildingPropertyEditor({ 
  building, 
  onUpdate,
  onClose,
  onDelete
}: {
  building: BuildingData;
  onUpdate: (updatedBuilding: BuildingData) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [editedBuilding, setEditedBuilding] = useState<BuildingData>(building);

  const handleSave = () => {
    onUpdate(editedBuilding);
    onClose();
  };

  return (
    <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-90 text-white p-4 rounded-lg w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-yellow-400">⚙️ Editor de Edificio</h3>
        <button onClick={onClose} className="text-red-400 hover:text-red-300">✕</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Edificio:</label>
          <input
            type="text"
            value={editedBuilding.properties.buildingName || ''}
            onChange={(e) => setEditedBuilding({
              ...editedBuilding,
              properties: { ...editedBuilding.properties, buildingName: e.target.value }
            })}
            className="w-full px-2 py-1 bg-gray-700 rounded text-white"
            placeholder="Ej: Torre Central"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Altura (m): {editedBuilding.height}</label>
          <input
            type="range"
            min="3"
            max="100"
            value={editedBuilding.height}
            onChange={(e) => setEditedBuilding({
              ...editedBuilding,
              height: Number(e.target.value),
              properties: { ...editedBuilding.properties, floors: Math.floor(Number(e.target.value) / 3) }
            })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rotación: {editedBuilding.rotation.toFixed(1)}°</label>
          <input
            type="range"
            min="0"
            max="6.28"
            step="0.1"
            value={editedBuilding.rotation}
            onChange={(e) => setEditedBuilding({
              ...editedBuilding,
              rotation: Number(e.target.value)
            })}
            className="w-full"
          />
        </div>

        {editedBuilding.type === 'residential' && (
          <div>
            <label className="block text-sm font-medium mb-1">Unidades Residenciales:</label>
            <input
              type="number"
              value={editedBuilding.properties.units || 0}
              onChange={(e) => setEditedBuilding({
                ...editedBuilding,
                properties: { ...editedBuilding.properties, units: Number(e.target.value) }
              })}
              className="w-full px-2 py-1 bg-gray-700 rounded text-white"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Año de Construcción:</label>
          <input
            type="number"
            value={editedBuilding.properties.yearBuilt || new Date().getFullYear()}
            onChange={(e) => setEditedBuilding({
              ...editedBuilding,
              properties: { ...editedBuilding.properties, yearBuilt: Number(e.target.value) }
            })}
            className="w-full px-2 py-1 bg-gray-700 rounded text-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-white font-medium"
          >
            💾 Guardar
          </button>
          <button
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-white font-medium"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Urban Planning Statistics Panel with Economic Simulation
function UrbanStatsPanel({ buildings }: { buildings: BuildingData[] }) {
  const [activeTab, setActiveTab] = useState<'buildings' | 'economics' | 'environment' | 'services'>('buildings');
  
  const buildingStats = useMemo(() => {
    const buildingsByType = buildings.reduce((acc, building) => {
      acc[building.type] = (acc[building.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalUnits = buildings
      .filter(b => b.type === 'residential')
      .reduce((sum, b) => sum + (b.properties.units || 0), 0);

    const totalValue = buildings.reduce((sum, b) => sum + (b.properties.value || 0), 0);

    return { buildingsByType, totalUnits, totalValue };
  }, [buildings]);

  const economics = useMemo(() => calculateCityEconomics(buildings), [buildings]);

  const environmentStats = useMemo(() => {
    let totalPollution = 0;
    let totalNoise = 0;
    let totalPower = 0;
    let totalWater = 0;
    let greenSpaces = 0;

    buildings.forEach(building => {
      const template = BUILDING_TEMPLATES.find(t => t.id === getTemplateId(building));
      if (template) {
        totalPollution += template.environment.pollutionRate;
        totalNoise += template.environment.noiseLevel;
        totalPower += template.environment.powerConsumption;
        totalWater += template.environment.waterConsumption;
        if (template.environment.greenContribution) {
          greenSpaces += template.environment.greenContribution;
        }
      }
    });

    return {
      pollution: totalPollution / Math.max(buildings.length, 1),
      noise: totalNoise / Math.max(buildings.length, 1),
      powerConsumption: totalPower,
      waterConsumption: totalWater,
      greenSpaces,
      sustainability: Math.max(0, 100 - (totalPollution / Math.max(buildings.length, 1)) + greenSpaces)
    };
  }, [buildings]);

  const serviceStats = useMemo(() => {
    const services = {
      education: buildings.filter(b => getTemplateId(b) === 'school' || getTemplateId(b) === 'library').length,
      health: buildings.filter(b => getTemplateId(b) === 'hospital').length,
      fire: buildings.filter(b => getTemplateId(b) === 'fire_station').length,
      police: buildings.filter(b => getTemplateId(b) === 'police_station').length,
      parks: buildings.filter(b => getTemplateId(b) === 'park').length,
    };

    const coverage = {
      education: Math.min(100, (services.education * 1000) / Math.max(economics.population, 1)),
      health: Math.min(100, (services.health * 5000) / Math.max(economics.population, 1)),
      safety: Math.min(100, (services.fire + services.police) * 1500 / Math.max(economics.population, 1)),
      recreation: Math.min(100, services.parks * 500 / Math.max(economics.population, 1)),
    };

    return { services, coverage };
  }, [buildings, economics.population]);

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-sm">
      <h3 className="text-lg font-bold mb-3 text-yellow-400">📊 Urban Analytics Dashboard</h3>
      
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        <button
          onClick={() => setActiveTab('buildings')}
          className={`px-2 py-1 text-xs rounded ${activeTab === 'buildings' ? 'bg-blue-500' : 'bg-gray-600'}`}
        >
          🏗️
        </button>
        <button
          onClick={() => setActiveTab('economics')}
          className={`px-2 py-1 text-xs rounded ${activeTab === 'economics' ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          💰
        </button>
        <button
          onClick={() => setActiveTab('environment')}
          className={`px-2 py-1 text-xs rounded ${activeTab === 'environment' ? 'bg-green-400' : 'bg-gray-600'}`}
        >
          🌍
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-2 py-1 text-xs rounded ${activeTab === 'services' ? 'bg-purple-500' : 'bg-gray-600'}`}
        >
          🏥
        </button>
      </div>

      {/* Buildings Tab */}
      {activeTab === 'buildings' && (
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-blue-400">📈 Desarrollo Urbano</div>
          <div>🏗️ Total Edificios: {buildings.length}</div>
          <div>🏠 Residencial: {buildingStats.buildingsByType.residential || 0}</div>
          <div>🏬 Comercial: {buildingStats.buildingsByType.commercial || 0}</div>
          <div>🏭 Industrial: {buildingStats.buildingsByType.industrial || 0}</div>
          <div>🚢 Portuario: {buildingStats.buildingsByType.port || 0}</div>
          <div>🏛️ Cívico: {buildingStats.buildingsByType.civic || 0}</div>
          <div>🌳 Recreativo: {buildingStats.buildingsByType.recreation || 0}</div>
          {buildingStats.totalUnits > 0 && <div>👥 Unidades Habitacionales: {buildingStats.totalUnits}</div>}
          {buildingStats.totalValue > 0 && <div>💎 Valor Total: ${buildingStats.totalValue.toLocaleString()}</div>}
        </div>
      )}

      {/* Economics Tab */}
      {activeTab === 'economics' && (
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-green-400">💰 Economía Urbana</div>
          <div>👥 Población: {economics.population.toLocaleString()}</div>
          <div>💼 Empleos: {economics.totalJobs.toLocaleString()}</div>
          <div>📉 Desempleo: {(economics.unemploymentRate * 100).toFixed(1)}%</div>
          <div>💵 Ingreso Promedio: ${economics.averageIncome.toLocaleString()}</div>
          <div className={`${economics.budget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            📊 Presupuesto: ${economics.budget.toLocaleString()}
          </div>
          <div>💰 Ingresos: ${economics.totalTaxRevenue.toLocaleString()}</div>
          <div>💸 Gastos: ${economics.totalExpenses.toLocaleString()}</div>
          <div>🏡 Valor Territorial: ${economics.landValue.toLocaleString()}</div>
          <div className="pt-2 border-t border-gray-600">
            <div className={`text-sm ${economics.happinessIndex > 70 ? 'text-green-400' : economics.happinessIndex > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              😊 Índice de Felicidad: {economics.happinessIndex.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Environment Tab */}
      {activeTab === 'environment' && (
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-green-400">🌍 Impacto Ambiental</div>
          <div className={`${environmentStats.pollution < 10 ? 'text-green-400' : environmentStats.pollution < 20 ? 'text-yellow-400' : 'text-red-400'}`}>
            🏭 Contaminación: {environmentStats.pollution.toFixed(1)}/100
          </div>
          <div className={`${environmentStats.noise < 30 ? 'text-green-400' : environmentStats.noise < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            🔊 Ruido: {environmentStats.noise.toFixed(0)} dB
          </div>
          <div>⚡ Consumo Eléctrico: {environmentStats.powerConsumption} MW</div>
          <div>💧 Consumo de Agua: {environmentStats.waterConsumption}k L/día</div>
          <div className="text-green-400">🌱 Áreas Verdes: {environmentStats.greenSpaces} puntos</div>
          <div className="pt-2 border-t border-gray-600">
            <div className={`text-sm ${environmentStats.sustainability > 70 ? 'text-green-400' : environmentStats.sustainability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              ♻️ Sostenibilidad: {environmentStats.sustainability.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-purple-400">🏥 Servicios Públicos</div>
          <div>🏫 Educación: {serviceStats.services.education} centros</div>
          <div className={`ml-4 text-xs ${serviceStats.coverage.education > 80 ? 'text-green-400' : serviceStats.coverage.education > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            Cobertura: {serviceStats.coverage.education.toFixed(0)}%
          </div>
          
          <div>🏥 Salud: {serviceStats.services.health} hospitales</div>
          <div className={`ml-4 text-xs ${serviceStats.coverage.health > 80 ? 'text-green-400' : serviceStats.coverage.health > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            Cobertura: {serviceStats.coverage.health.toFixed(0)}%
          </div>
          
          <div>🚒 Seguridad: {serviceStats.services.fire + serviceStats.services.police} estaciones</div>
          <div className={`ml-4 text-xs ${serviceStats.coverage.safety > 80 ? 'text-green-400' : serviceStats.coverage.safety > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            Cobertura: {serviceStats.coverage.safety.toFixed(0)}%
          </div>
          
          <div>🌳 Recreación: {serviceStats.services.parks} parques</div>
          <div className={`ml-4 text-xs ${serviceStats.coverage.recreation > 80 ? 'text-green-400' : serviceStats.coverage.recreation > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            Cobertura: {serviceStats.coverage.recreation.toFixed(0)}%
          </div>

          <div className="pt-2 border-t border-gray-600">
            <div>📊 Nivel Educativo: {economics.educationLevel.toFixed(0)}%</div>
            <div>🏥 Nivel de Salud: {economics.healthLevel.toFixed(0)}%</div>
            <div className={`${economics.crimeRate < 5 ? 'text-green-400' : economics.crimeRate < 15 ? 'text-yellow-400' : 'text-red-400'}`}>
              🚔 Criminalidad: {economics.crimeRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced interactive City Scene with professional urban planning tools
function InteractiveCityScene({ data, parameter, dataset }: CityEngine3DProps) {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [transitLines, setTransitLines] = useState<TransitLine[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [mode, setMode] = useState<CityEngineMode>({ mode: 'select' });
  const [selectedTemplate, setSelectedTemplate] = useState<BuildingTemplate | null>(null);
  const [showZoning, setShowZoning] = useState(false);
  const [showStreets, setShowStreets] = useState(true);
  const [showServiceAreas, setShowServiceAreas] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  
  // Initialize with enhanced sample buildings
  useEffect(() => {
    const initialBuildings: BuildingData[] = [
      {
        id: 'sample_1',
        position: [0, 0, 0],
        width: 8,
        depth: 10,
        height: 15,
        type: 'residential',
        color: '#8b5cf6',
        rotation: 0,
        properties: {
          floors: 5,
          units: 8,
          buildingName: 'Edificio Ejemplo',
          yearBuilt: 2020,
          value: 150000,
          population: 16,
          condition: 85
        },
        utilities: {
          hasWater: true,
          hasPower: true,
          hasInternet: true,
          hasGas: false,
          roadAccess: true,
          transitAccess: false
        },
        economics: {
          constructionCost: 150000,
          maintenanceCost: 3000,
          propertyTax: 3750
        },
        environment: {
          pollutionGenerated: 2,
          noiseLevel: 15,
          greenSpaceContribution: 0,
          energyEfficiency: 70
        }
      },
      {
        id: 'sample_2',
        position: [10, 0, 5],
        width: 12,
        depth: 15,
        height: 25,
        type: 'commercial',
        color: '#10b981',
        rotation: 0.5,
        properties: {
          floors: 8,
          capacity: 200,
          buildingName: 'Centro Comercial',
          yearBuilt: 2022,
          value: 500000,
          employees: 50,
          condition: 95
        },
        utilities: {
          hasWater: true,
          hasPower: true,
          hasInternet: true,
          hasGas: true,
          roadAccess: true,
          transitAccess: true
        },
        economics: {
          constructionCost: 500000,
          maintenanceCost: 5000,
          revenue: 15000,
          operatingCosts: 8000,
          propertyTax: 20000
        },
        environment: {
          pollutionGenerated: 8,
          noiseLevel: 40,
          greenSpaceContribution: 0,
          energyEfficiency: 80
        }
      },
      {
        id: 'sample_3',
        position: [-8, 0, -5],
        width: 25,
        depth: 20,
        height: 18,
        type: 'civic',
        color: '#ef4444',
        rotation: 0,
        properties: {
          floors: 6,
          capacity: 500,
          buildingName: 'Hospital Central',
          yearBuilt: 2019,
          value: 600000,
          employees: 80,
          condition: 90,
          serviceRadius: 40
        },
        utilities: {
          hasWater: true,
          hasPower: true,
          hasInternet: true,
          hasGas: true,
          roadAccess: true,
          transitAccess: true
        },
        economics: {
          constructionCost: 600000,
          maintenanceCost: 8000,
          operatingCosts: 15000,
          propertyTax: 0
        },
        environment: {
          pollutionGenerated: 3,
          noiseLevel: 35,
          greenSpaceContribution: 0,
          energyEfficiency: 85
        }
      }
    ];
    setBuildings(initialBuildings);

    // Initialize sample roads
    const initialRoads: Road[] = [
      {
        id: 'main_street',
        type: 'avenue',
        points: [[-20, 0.05, 0], [20, 0.05, 0]],
        width: 3,
        color: '#555555',
        capacity: 200,
        speedLimit: 50
      },
      {
        id: 'cross_street',
        type: 'street',
        points: [[0, 0.05, -20], [0, 0.05, 20]],
        width: 2,
        color: '#444444',
        capacity: 100,
        speedLimit: 30
      }
    ];
    setRoads(initialRoads);
  }, []);

  // Handle building placement with enhanced validation
  const handlePlaceBuilding = useCallback((position: [number, number, number], template: BuildingTemplate) => {
    // Check building requirements
    const economics = calculateCityEconomics(buildings);
    
    if (template.requirements) {
      if (template.requirements.minPopulation && economics.population < template.requirements.minPopulation) {
        alert(`Este edificio requiere una población mínima de ${template.requirements.minPopulation} habitantes.`);
        return;
      }
      
      // Check for nearby road access
      if (template.requirements.nearRoad) {
        const hasRoadAccess = roads.some(road => 
          road.points.some(point => {
            const distance = Math.sqrt(
              Math.pow(point[0] - position[0], 2) + Math.pow(point[2] - position[2], 2)
            );
            return distance < 5; // Within 5 units of a road
          })
        );
        
        if (!hasRoadAccess) {
          alert('Este edificio requiere acceso a una calle.');
          return;
        }
      }
    }

    const newBuilding: BuildingData = {
      id: `building_${Date.now()}`,
      position,
      width: template.baseWidth,
      depth: template.baseDepth,
      height: template.baseHeight,
      type: template.type,
      color: template.color,
      rotation: 0,
      properties: {
        floors: Math.floor(template.baseHeight / 3),
        buildingName: template.name,
        yearBuilt: new Date().getFullYear(),
        value: template.cost,
        condition: 100,
        ...(template.type === 'residential' && { 
          units: Math.floor(template.baseHeight / 3) * 2,
          population: Math.floor(template.baseHeight / 3) * 4
        }),
        ...(template.type === 'commercial' && { 
          capacity: Math.floor(template.baseWidth * template.baseDepth * 2),
          employees: template.economics.jobsCreated || 0
        }),
        ...(template.services && { serviceRadius: template.services.radius })
      },
      utilities: {
        hasWater: true,
        hasPower: true,
        hasInternet: true,
        hasGas: template.environment.powerConsumption > 30,
        roadAccess: true,
        transitAccess: false
      },
      economics: {
        constructionCost: template.cost,
        maintenanceCost: template.economics.maintenanceCost,
        revenue: template.economics.revenue,
        operatingCosts: template.economics.operatingCosts,
        propertyTax: template.cost * template.economics.propertyTaxRate
      },
      environment: {
        pollutionGenerated: template.environment.pollutionRate,
        noiseLevel: template.environment.noiseLevel,
        greenSpaceContribution: template.environment.greenContribution || 0,
        energyEfficiency: Math.max(50, 100 - template.environment.powerConsumption)
      }
    };

    setBuildings(prev => [...prev, newBuilding]);
    setSelectedBuilding(newBuilding);
  }, [buildings, roads]);

  // Handle road creation
  const handleAddRoad = useCallback((road: Road) => {
    setRoads(prev => [...prev, road]);
  }, []);

  // Handle building selection/interaction
  const handleBuildingInteraction = useCallback((building: BuildingData) => {
    if (mode.mode === 'demolish') {
      setBuildings(prev => prev.filter(b => b.id !== building.id));
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(building);
    }
  }, [mode]);

  // Handle building updates
  const handleUpdateBuilding = useCallback((updatedBuilding: BuildingData) => {
    setBuildings(prev => prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b));
  }, []);

  // Handle building deletion
  const handleDeleteBuilding = useCallback(() => {
    if (selectedBuilding) {
      setBuildings(prev => prev.filter(b => b.id !== selectedBuilding.id));
      setSelectedBuilding(null);
    }
  }, [selectedBuilding]);

  return (
    <group>
      {/* Enhanced road network */}
      {showRoads && (
        <RoadBuilder
          mode={mode}
          roads={roads}
          onAddRoad={handleAddRoad}
          onSelectRoad={() => {}}
        />
      )}
      
      {/* Street network (legacy grid) */}
      {showStreets && <StreetNetwork />}
      
      {/* Zoning areas */}
      {showZoning && <ZoningAreas />}

      {/* Service radius visualization */}
      <ServiceRadiusVisualizer 
        buildings={buildings} 
        showServiceAreas={showServiceAreas} 
      />

      {/* Interactive building placement system */}
      <BuildingPlacer
        mode={mode}
        buildings={buildings}
        onPlaceBuilding={handlePlaceBuilding}
        onSelectBuilding={setSelectedBuilding}
        selectedBuilding={selectedBuilding}
      />

      {/* Interactive buildings */}
      {buildings.map((building) => (
        <InteractiveBuilding
          key={building.id}
          building={building}
          onClick={handleBuildingInteraction}
          isSelected={selectedBuilding?.id === building.id}
          mode={mode}
        />
      ))}

      {/* Environmental data visualization overlay */}
      {data.map((point, index) => {
        const position = latLngTo3D(point.latitude, point.longitude);
        const colorValue = Math.max(0, Math.min(1, point.value / 50));
        const sphereColor = `hsl(${colorValue * 120}, 70%, 50%)`;
        
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[0.5]} />
            <meshStandardMaterial color={sphereColor} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Enhanced ground plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>

      {/* City Engine Professional UI */}
      <Html fullscreen>
        <BuildingPalette
          mode={mode}
          setMode={setMode}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
        
        <UrbanStatsPanel buildings={buildings} />
        
        {selectedBuilding && mode.mode !== 'place' && mode.mode !== 'road' && (
          <BuildingPropertyEditor
            building={selectedBuilding}
            onUpdate={handleUpdateBuilding}
            onClose={() => setSelectedBuilding(null)}
            onDelete={handleDeleteBuilding}
          />
        )}

        {/* Enhanced Professional Tools Panel */}
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-xs">
          <h3 className="text-lg font-bold mb-3 text-yellow-400">🏙️ Professional City Engine</h3>
          
          <div className="space-y-3">
            {/* Visualization Controls */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-blue-400">🎨 Visualización:</h4>
              <div className="space-y-2">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={showStreets}
                    onChange={(e) => setShowStreets(e.target.checked)}
                    className="mr-2"
                  />
                  🛣️ Grid de Calles
                </label>
                
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={showRoads}
                    onChange={(e) => setShowRoads(e.target.checked)}
                    className="mr-2"
                  />
                  🚗 Carreteras Manuales
                </label>
                
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={showZoning}
                    onChange={(e) => setShowZoning(e.target.checked)}
                    className="mr-2"
                  />
                  🗺️ Zonas Urbanas
                </label>
                
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={showServiceAreas}
                    onChange={(e) => setShowServiceAreas(e.target.checked)}
                    className="mr-2"
                  />
                  🎯 Radios de Servicio
                </label>
              </div>
            </div>

            {/* Analysis Tools */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-sm font-semibold mb-2 text-green-400">📊 Análisis:</h4>
              <div className="space-y-1">
                <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
                  📈 Densidad Poblacional
                </button>
                <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
                  🌡️ Mapa de Calor
                </button>
                <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
                  🚦 Flujo de Tráfico
                </button>
                <button className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left">
                  💰 Valor del Suelo
                </button>
              </div>
            </div>

            {/* Export Tools */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-sm font-semibold mb-2 text-purple-400">📤 Exportar:</h4>
              <div className="space-y-2">
                <button
                  onClick={() => CityEngineExporter.exportScreenshot(document.querySelector('canvas')!, 'professional_city_screenshot.png')}
                  className="w-full bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-white text-xs"
                >
                  📸 Captura Profesional
                </button>
                <button
                  onClick={() => CityEngineExporter.exportToJSON({ buildings, roads, transitLines }, 'complete_city_model.json')}
                  className="w-full bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-white text-xs"
                >
                  🏗️ Modelo 3D Completo
                </button>
                <button
                  onClick={() => CityEngineExporter.generateReport(buildings, { dataset, parameter, economics: calculateCityEconomics(buildings) })}
                  className="w-full bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-white text-xs"
                >
                  📊 Reporte Urbano
                </button>
                <button
                  onClick={() => CityEngineExporter.exportToCAD(buildings, roads, 'city_design.dxf')}
                  className="w-full bg-orange-600 hover:bg-orange-500 px-3 py-2 rounded text-white text-xs"
                >
                  📐 Exportar CAD
                </button>
              </div>
            </div>

            {/* Real-time City Metrics */}
            <div className="pt-3 border-t border-gray-600">
              <h4 className="text-sm font-semibold mb-2 text-yellow-400">⚡ Métricas en Tiempo Real:</h4>
              <div className="text-xs space-y-1">
                <div>🏗️ Edificios: {buildings.length}</div>
                <div>🛣️ Carreteras: {roads.length} km</div>
                <div>👥 Población: {calculateCityEconomics(buildings).population.toLocaleString()}</div>
                <div className={calculateCityEconomics(buildings).budget >= 0 ? 'text-green-400' : 'text-red-400'}>
                  💰 Presupuesto: ${calculateCityEconomics(buildings).budget.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// Convert lat/lng to 3D coordinates for city layout
function latLngTo3D(lat: number, lng: number): [number, number, number] {
  const centerLat = -11.57;
  const centerLng = -77.27;
  
  const x = (lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180) / 1000;
  const z = (lat - centerLat) * 110540 / 1000;
  const y = 0;
  
  return [x, y, z];
}

export default function CityEngine3D(props: CityEngine3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[25, 25, 25]} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={100}
          />
          
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[20, 30, 10]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={100}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          
          {/* Enhanced interactive city scene */}
          <InteractiveCityScene {...props} />
          
          {/* Grid helper for reference */}
          <Grid 
            args={[100, 100]} 
            position={[0, -0.9, 0]} 
            cellSize={1} 
            cellThickness={0.5} 
            cellColor="#444444" 
            sectionSize={10} 
            sectionThickness={1} 
            sectionColor="#666666" 
            fadeDistance={50} 
            fadeStrength={1} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
