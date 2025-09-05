"use client";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Text, Html, Box } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState, useCallback } from 'react';
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
  type: 'residential' | 'commercial' | 'industrial' | 'port';
  color: string;
}

interface CityEngine3DProps {
  data: DataPoint[];
  parameter: string;
  dataset: string;
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

// Procedural building generator based on City Engine principles
function ProceduralBuilding({ 
  building, 
  onClick,
  isSelected 
}: { 
  building: BuildingData;
  onClick: (building: BuildingData) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.setScalar(1.1 + Math.sin(Date.now() * 0.005) * 0.05);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.05);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  // Generate building color based on type and data
  const buildingColor = useMemo(() => {
    switch (building.type) {
      case 'residential': return '#4f46e5';
      case 'commercial': return '#059669';
      case 'industrial': return '#dc2626';
      case 'port': return '#0369a1';
      default: return '#6b7280';
    }
  }, [building.type]);

  return (
    <group position={building.position}>
      {/* Main building structure */}
      <mesh
        ref={meshRef}
        position={[0, building.height / 2, 0]}
        onClick={() => onClick(building)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <meshStandardMaterial 
          color={buildingColor}
          emissive={isSelected ? buildingColor : undefined}
          emissiveIntensity={isSelected ? 0.2 : 0}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Building details for taller buildings */}
      {building.height > 20 && (
        <>
          {/* Antenna/details on top */}
          <mesh position={[0, building.height + 2, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 4]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          
          {/* Windows pattern */}
          {Array.from({ length: Math.floor(building.height / 4) }, (_, i) => (
            <group key={i} position={[0, 4 + i * 4, 0]}>
              <mesh position={[building.width / 2 - 0.1, 0, 0]}>
                <boxGeometry args={[0.1, 1, building.depth * 0.8]} />
                <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
              </mesh>
              <mesh position={[-building.width / 2 + 0.1, 0, 0]}>
                <boxGeometry args={[0.1, 1, building.depth * 0.8]} />
                <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {/* Building label when hovered */}
      {hovered && (
        <Text
          position={[0, building.height + 5, 0]}
          fontSize={2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {building.type.toUpperCase()}
          {'\n'}ID: {building.id}
          {'\n'}H: {building.height.toFixed(0)}m
        </Text>
      )}

      {/* Foundation */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[building.width + 1, 1, building.depth + 1]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
    </group>
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

function CityScene({ data, parameter, dataset }: CityEngine3DProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [showZoning, setShowZoning] = useState(false);
  const [showStreets, setShowStreets] = useState(true);
  const { scene, gl } = useThree();

  // Generate procedural buildings based on data points and urban planning rules
  const buildings = useMemo(() => {
    const buildingData: BuildingData[] = [];
    let buildingId = 0;

    // Generate buildings in a grid pattern with variation
    for (let x = -15; x <= 15; x += 3) {
      for (let z = -15; z <= 15; z += 3) {
        // Skip intersections (streets)
        if (x % 6 === 0 || z % 6 === 0) continue;

        const distanceFromCenter = Math.sqrt(x * x + z * z);
        let buildingType: BuildingData['type'] = 'residential';
        let height = 10 + Math.random() * 15;

        // Determine building type based on location (zoning)
        if (z < -10) {
          buildingType = 'port';
          height = 8 + Math.random() * 12;
        } else if (x < -3 && z > -8 && z < 8) {
          buildingType = 'commercial';
          height = 15 + Math.random() * 25;
        } else if (z > 8) {
          buildingType = 'industrial';
          height = 12 + Math.random() * 18;
        }

        // Vary building dimensions based on type
        const width = buildingType === 'commercial' ? 2 + Math.random() * 1.5 : 1.5 + Math.random();
        const depth = buildingType === 'industrial' ? 3 + Math.random() * 2 : 1.5 + Math.random();

        // Apply data influence to building height
        if (data.length > 0) {
          const nearestDataPoint = data.reduce((closest, point) => {
            const pointPos = latLngTo3D(point.latitude, point.longitude);
            const distToPoint = Math.sqrt(
              Math.pow(x - pointPos[0], 2) + Math.pow(z - pointPos[2], 2)
            );
            const distToClosest = Math.sqrt(
              Math.pow(x - latLngTo3D(closest.latitude, closest.longitude)[0], 2) +
              Math.pow(z - latLngTo3D(closest.latitude, closest.longitude)[2], 2)
            );
            return distToPoint < distToClosest ? point : closest;
          });

          // Influence height based on data value
          const dataInfluence = Math.max(0.5, Math.min(2, nearestDataPoint.value / 20));
          height *= dataInfluence;
        }

        buildingData.push({
          id: `building_${buildingId++}`,
          position: [x + (Math.random() - 0.5) * 0.5, 0, z + (Math.random() - 0.5) * 0.5],
          width,
          depth,
          height,
          type: buildingType,
          color: ''
        });
      }
    }

    return buildingData;
  }, [data]);

  const handleBuildingClick = useCallback((building: BuildingData) => {
    setSelectedBuilding(building);
  }, []);

  const handleExportModel = useCallback(() => {
    CityEngineExporter.exportToGLTF(scene, 'chancay_city_model.json');
  }, [scene]);

  const handleExportReport = useCallback(() => {
    CityEngineExporter.generateReport(buildings, { dataset, parameter });
  }, [buildings, dataset, parameter]);

  const handleExportScreenshot = useCallback(() => {
    if (gl.domElement) {
      CityEngineExporter.exportScreenshot(gl.domElement, 'chancay_city_view.png');
    }
  }, [gl]);

  return (
    <>
      {/* Ground plane */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>

      {/* Ocean/port water */}
      <mesh position={[0, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#1e40af" transparent opacity={0.7} />
      </mesh>

      {/* Street network */}
      {showStreets && <StreetNetwork />}

      {/* Zoning areas */}
      {showZoning && <ZoningAreas />}

      {/* Procedural buildings */}
      {buildings.map((building) => (
        <ProceduralBuilding
          key={building.id}
          building={building}
          onClick={handleBuildingClick}
          isSelected={selectedBuilding?.id === building.id}
        />
      ))}

      {/* Data visualization overlay */}
      {data.map((point, index) => {
        const position = latLngTo3D(point.latitude, point.longitude);
        const height = Math.max(2, point.value);
        const color = new THREE.Color().setHSL(
          (240 - (point.value / 50) * 120) / 360, 
          0.8, 
          0.6
        );

        return (
          <mesh key={index} position={[position[0], height / 2 + 0.5, position[2]]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      {/* City Engine control panel */}
      <Html
        position={[-18, 8, 18]}
        style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          minWidth: '250px',
          fontSize: '14px'
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 12px 0', color: '#60a5fa' }}>🏗️ City Engine Tools</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={showStreets}
                onChange={(e) => setShowStreets(e.target.checked)}
              />
              Show Street Network
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={showZoning}
                onChange={(e) => setShowZoning(e.target.checked)}
              />
              Show Zoning Areas
            </label>
          </div>

          <div style={{ marginBottom: '16px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', fontSize: '14px' }}>📤 Export Tools</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={handleExportScreenshot}
                style={{
                  padding: '6px 12px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📸 Export Screenshot
              </button>
              <button
                onClick={handleExportModel}
                style={{
                  padding: '6px 12px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🏗️ Export 3D Model
              </button>
              <button
                onClick={handleExportReport}
                style={{
                  padding: '6px 12px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📊 Generate Report
              </button>
            </div>
          </div>

          {selectedBuilding && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: 'rgba(96,165,250,0.2)', 
              borderRadius: '4px' 
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Selected Building</h4>
              <div>ID: {selectedBuilding.id}</div>
              <div>Type: {selectedBuilding.type}</div>
              <div>Height: {selectedBuilding.height.toFixed(1)}m</div>
              <div>Dimensions: {selectedBuilding.width.toFixed(1)} × {selectedBuilding.depth.toFixed(1)}m</div>
            </div>
          )}

          <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.8 }}>
            <div>🏢 Buildings: {buildings.length}</div>
            <div>📊 Data Points: {data.length}</div>
            <div>🗺️ Dataset: {dataset}</div>
          </div>
        </div>
      </Html>
    </>
  );
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
          
          {/* Simple gradient background instead of HDR environment */}
          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#87CEEB', 30, 100]} />
          
          <CityScene {...props} />
          
          <Grid 
            position={[0, -0.01, 0]} 
            args={[50, 50]} 
            cellSize={2}
            cellThickness={0.5}
            cellColor="#666"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#999"
            fadeDistance={30}
            fadeStrength={1}
          />
        </Suspense>
      </Canvas>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4 style={{ margin: '0 0 12px 0' }}>Building Types</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: '#4f46e5' }}></div>
            <span>Residential</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: '#059669' }}></div>
            <span>Commercial</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: '#dc2626' }}></div>
            <span>Industrial</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', background: '#0369a1' }}></div>
            <span>Port</span>
          </div>
        </div>
      </div>
    </div>
  );
}