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
  };
}

interface CityEngineMode {
  mode: 'select' | 'place' | 'edit' | 'zone' | 'road' | 'demolish';
  selectedTemplate?: BuildingTemplate;
}

interface UrbanZone {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'mixed' | 'recreation' | 'civic';
  boundary: [number, number][];
  color: string;
  density: 'low' | 'medium' | 'high';
  restrictions: {
    maxHeight?: number;
    minSetback?: number;
    allowedBuildings: BuildingData['type'][];
  };
}

interface CityEngine3DProps {
  data: DataPoint[];
  parameter: string;
  dataset: string;
}

// Building templates library (similar to ArcGIS City Engine asset library)
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
    requirements: { nearRoad: true }
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
    requirements: { nearRoad: true }
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
    requirements: { minPopulation: 1000, nearRoad: true }
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
    requirements: { nearRoad: true }
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
    requirements: { minPopulation: 500, nearRoad: true }
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
    requirements: { minPopulation: 2000, nearRoad: true }
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
    cost: 100000
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
    cost: 250000
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
    requirements: { nearWater: true }
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
    requirements: { nearWater: true }
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
    cost: 300000
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
    cost: 600000
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
    cost: 400000
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
    cost: 50000
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
    requirements: { minPopulation: 5000 }
  }
];

// Interactive Building Placement System
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

// Building Palette Component - SimCity-style building selection
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
  
  const categories = ['all', 'residential', 'commercial', 'industrial', 'port', 'civic', 'recreation'] as const;
  
  const filteredTemplates = BUILDING_TEMPLATES.filter(template => 
    selectedCategory === 'all' || template.type === selectedCategory
  );

  return (
    <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-md">
      <h3 className="text-lg font-bold mb-3 text-yellow-400">🏗️ City Builder Toolkit</h3>
      
      {/* Mode Selection */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Modo de Edición:</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMode({ mode: 'select' })}
            className={`px-2 py-1 text-xs rounded ${mode.mode === 'select' ? 'bg-blue-500' : 'bg-gray-600'}`}
          >
            🔍 Seleccionar
          </button>
          <button
            onClick={() => setMode({ mode: 'place' })}
            className={`px-2 py-1 text-xs rounded ${mode.mode === 'place' ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            🏗️ Construir
          </button>
          <button
            onClick={() => setMode({ mode: 'demolish' })}
            className={`px-2 py-1 text-xs rounded ${mode.mode === 'demolish' ? 'bg-red-500' : 'bg-gray-600'}`}
          >
            💥 Demoler
          </button>
        </div>
      </div>

      {/* Building Category Selection */}
      {mode.mode === 'place' && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Categoría:</h4>
          <div className="flex flex-wrap gap-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 text-xs rounded ${selectedCategory === category ? 'bg-yellow-500 text-black' : 'bg-gray-600'}`}
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
          <h4 className="text-sm font-semibold mb-2">Edificios Disponibles:</h4>
          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setMode({ mode: 'place', selectedTemplate: template });
                }}
                className={`p-2 text-xs rounded border-2 transition-all ${
                  selectedTemplate?.id === template.id 
                    ? 'border-yellow-500 bg-yellow-500 bg-opacity-20' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-lg mb-1">{template.icon}</div>
                <div className="font-medium">{template.name}</div>
                <div className="text-gray-300">${template.cost.toLocaleString()}</div>
                <div className="text-gray-400 text-xs">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
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

// Urban Planning Statistics Panel
function UrbanStatsPanel({ buildings }: { buildings: BuildingData[] }) {
  const stats = useMemo(() => {
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

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-80 text-white p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-3 text-yellow-400">📊 Estadísticas Urbanas</h3>
      
      <div className="space-y-2 text-sm">
        <div>🏗️ Total de Edificios: {buildings.length}</div>
        <div>🏠 Residencial: {stats.buildingsByType.residential || 0}</div>
        <div>🏬 Comercial: {stats.buildingsByType.commercial || 0}</div>
        <div>🏭 Industrial: {stats.buildingsByType.industrial || 0}</div>
        <div>🚢 Portuario: {stats.buildingsByType.port || 0}</div>
        <div>🏛️ Cívico: {stats.buildingsByType.civic || 0}</div>
        <div>🌳 Recreativo: {stats.buildingsByType.recreation || 0}</div>
        {stats.totalUnits > 0 && <div>👥 Unidades Residenciales: {stats.totalUnits}</div>}
        {stats.totalValue > 0 && <div>💰 Valor Total: ${stats.totalValue.toLocaleString()}</div>}
      </div>
    </div>
  );
}

// Enhanced interactive City Scene with manual building tools
function InteractiveCityScene({ data, parameter, dataset }: CityEngine3DProps) {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [mode, setMode] = useState<CityEngineMode>({ mode: 'select' });
  const [selectedTemplate, setSelectedTemplate] = useState<BuildingTemplate | null>(null);
  const [showZoning, setShowZoning] = useState(false);
  const [showStreets, setShowStreets] = useState(true);
  
  // Initialize with some sample buildings
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
          value: 150000
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
          value: 500000
        }
      }
    ];
    setBuildings(initialBuildings);
  }, []);

  // Handle building placement
  const handlePlaceBuilding = useCallback((position: [number, number, number], template: BuildingTemplate) => {
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
        ...(template.type === 'residential' && { units: Math.floor(template.baseHeight / 3) * 2 }),
        ...(template.type === 'commercial' && { capacity: Math.floor(template.baseWidth * template.baseDepth * 2) })
      }
    };

    setBuildings(prev => [...prev, newBuilding]);
    setSelectedBuilding(newBuilding);
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
      {/* Street network */}
      {showStreets && <StreetNetwork />}
      
      {/* Zoning areas */}
      {showZoning && <ZoningAreas />}

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

      {/* Data visualization overlay */}
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

      {/* Ground plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* City Engine UI overlays */}
      <Html fullscreen>
        <BuildingPalette
          mode={mode}
          setMode={setMode}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
        
        <UrbanStatsPanel buildings={buildings} />
        
        {selectedBuilding && mode.mode !== 'place' && (
          <BuildingPropertyEditor
            building={selectedBuilding}
            onUpdate={handleUpdateBuilding}
            onClose={() => setSelectedBuilding(null)}
            onDelete={handleDeleteBuilding}
          />
        )}

        {/* City Engine Tools Panel */}
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 text-white p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-yellow-400">🏙️ City Engine Tools</h3>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showStreets}
                onChange={(e) => setShowStreets(e.target.checked)}
                className="mr-2"
              />
              Mostrar Calles
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showZoning}
                onChange={(e) => setShowZoning(e.target.checked)}
                className="mr-2"
              />
              Mostrar Zonas
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => CityEngineExporter.exportScreenshot(document.querySelector('canvas')!, 'city_screenshot.png')}
              className="w-full bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-white text-sm"
            >
              📸 Export Screenshot
            </button>
            <button
              onClick={() => CityEngineExporter.exportToJSON(buildings, 'city_model.json')}
              className="w-full bg-green-600 hover:bg-green-500 px-3 py-2 rounded text-white text-sm"
            >
              🏗️ Export 3D Model
            </button>
            <button
              onClick={() => CityEngineExporter.generateReport(buildings, { dataset, parameter })}
              className="w-full bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded text-white text-sm"
            >
              📊 Generate Report
            </button>
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
