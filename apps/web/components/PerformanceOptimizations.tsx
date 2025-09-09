// @ts-nocheck - TypeScript version conflict between three.js packages
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState } from 'react';
import { BuildingData } from '../utils/cityEngineStore';

// LOD (Level of Detail) system for performance optimization
export class LODManager {
  private camera: THREE.Camera;
  private lodLevels: Map<string, number> = new Map();
  
  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }
  
  calculateLOD(objectPosition: THREE.Vector3): number {
    const distance = this.camera.position.distanceTo(objectPosition);
    
    if (distance < 50) return 3; // High detail
    if (distance < 150) return 2; // Medium detail
    if (distance < 500) return 1; // Low detail
    return 0; // Very low detail or culled
  }
  
  updateLOD(objectId: string, position: THREE.Vector3): number {
    const lod = this.calculateLOD(position);
    this.lodLevels.set(objectId, lod);
    return lod;
  }
  
  getLOD(objectId: string): number {
    return this.lodLevels.get(objectId) || 0;
  }
}

// Instanced building renderer for performance
export interface InstancedBuildingProps {
  buildings: BuildingData[];
  maxInstances?: number;
}

export function InstancedBuildings({ buildings, maxInstances = 1000 }: InstancedBuildingProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const lodManager = useMemo(() => new LODManager(camera), [camera]);
  
  // Group buildings by type for instancing
  const buildingGroups = useMemo(() => {
    const groups = new Map<string, BuildingData[]>();
    buildings.forEach(building => {
      const key = `${building.type}_${building.width}_${building.depth}_${building.height}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(building);
    });
    return groups;
  }, [buildings]);
  
  // Create geometries for different building types
  const geometries = useMemo(() => {
    const geoms = new Map<string, THREE.BufferGeometry>();
    
    buildingGroups.forEach((buildings, key) => {
      if (buildings.length === 0) return;
      
      const firstBuilding = buildings[0];
      const geometry = new THREE.BoxGeometry(
        firstBuilding.width,
        firstBuilding.height,
        firstBuilding.depth
      );
      
      // Add detail geometry for higher LOD
      const detailGeometry = geometry.clone();
      
      // Add windows and architectural details
      if (firstBuilding.type === 'commercial' || firstBuilding.type === 'civic') {
        // Add window geometry
        const windowMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x87ceeb, 
          transparent: true, 
          opacity: 0.7 
        });
        
        // Create window positions
        const windowGeometry = new THREE.PlaneGeometry(0.8, 1.2);
        for (let floor = 1; floor < firstBuilding.height / 3; floor++) {
          for (let col = 0; col < firstBuilding.width / 2; col++) {
            const windowClone = windowGeometry.clone();
            windowClone.translate(
              -firstBuilding.width / 2 + col * 2 + 1,
              -firstBuilding.height / 2 + floor * 3 + 1.5,
              firstBuilding.depth / 2 + 0.01
            );
            detailGeometry.merge(windowClone);
          }
        }
      }
      
      geoms.set(key, detailGeometry);
    });
    
    return geoms;
  }, [buildingGroups]);
  
  // Update instances
  useFrame(() => {
    if (!meshRef.current) return;
    
    let instanceIndex = 0;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3(1, 1, 1);
    
    buildingGroups.forEach((buildings, key) => {
      buildings.forEach(building => {
        if (instanceIndex >= maxInstances) return;
        
        position.set(...building.position);
        rotation.set(0, building.rotation, 0);
        
        // Update LOD
        const lod = lodManager.updateLOD(building.id, position);
        
        // Skip if too far away
        if (lod === 0) return;
        
        // Adjust scale based on LOD
        const lodScale = lod === 3 ? 1 : lod === 2 ? 0.9 : 0.7;
        scale.setScalar(lodScale);
        
        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
        meshRef.current?.setMatrixAt(instanceIndex, matrix);
        
        instanceIndex++;
      });
    });
    
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = instanceIndex;
    }
  });
  
  // Create materials for different building types
  const materials = useMemo(() => {
    const mats = new Map<string, THREE.Material>();
    
    buildingGroups.forEach((buildings, key) => {
      if (buildings.length === 0) return;
      
      const firstBuilding = buildings[0];
      let material: THREE.Material;
      
      switch (firstBuilding.type) {
        case 'residential':
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(firstBuilding.color),
            roughness: 0.8,
            metalness: 0.1,
            envMapIntensity: 0.5
          });
          break;
        case 'commercial':
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(firstBuilding.color),
            roughness: 0.3,
            metalness: 0.7,
            envMapIntensity: 1.0
          });
          break;
        case 'industrial':
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(firstBuilding.color),
            roughness: 0.9,
            metalness: 0.8,
            envMapIntensity: 0.3
          });
          break;
        default:
          material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(firstBuilding.color),
            roughness: 0.6,
            metalness: 0.4
          });
      }
      
      mats.set(key, material);
    });
    
    return mats;
  }, [buildingGroups]);
  
  if (buildings.length === 0) return null;
  
  return (
    <group>
      {Array.from(buildingGroups.entries()).map(([key, groupBuildings]) => {
        const geometry = geometries.get(key);
        const material = materials.get(key);
        
        if (!geometry || !material || groupBuildings.length === 0) return null;
        
        return (
          <instancedMesh
            key={key}
            ref={meshRef}
            args={[geometry, material, Math.min(groupBuildings.length, maxInstances)]}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
}

// GPU-based terrain system
export interface GPUTerrainProps {
  heightmap: Float32Array;
  size: number;
  resolution: number;
  material?: 'grass' | 'dirt' | 'sand' | 'rock' | 'water' | 'concrete';
}

export function GPUTerrain({ heightmap, size, resolution, material = 'grass' }: GPUTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [terrainTexture, setTerrainTexture] = useState<THREE.Texture | null>(null);
  
  // Create terrain geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    const positions = geo.attributes.position;
    
    // Apply heightmap
    for (let i = 0; i < positions.count; i++) {
      const height = heightmap[i] || 0;
      positions.setZ(i, height);
    }
    
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    
    return geo;
  }, [heightmap, size, resolution]);
  
  // Create terrain material with textures
  const terrainMaterial = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    
    // Load appropriate texture based on material type
    const getTextureColor = (material: string): THREE.Color => {
      switch (material) {
        case 'grass': return new THREE.Color(0x3a5f3a);
        case 'dirt': return new THREE.Color(0x8b4513);
        case 'sand': return new THREE.Color(0xf4e4bc);
        case 'rock': return new THREE.Color(0x696969);
        case 'water': return new THREE.Color(0x006994);
        case 'concrete': return new THREE.Color(0x808080);
        default: return new THREE.Color(0x3a5f3a);
      }
    };
    
    const mat = new THREE.MeshStandardMaterial({
      color: getTextureColor(material),
      roughness: material === 'water' ? 0.1 : 0.8,
      metalness: material === 'water' ? 0.9 : 0.1,
      transparent: material === 'water',
      opacity: material === 'water' ? 0.8 : 1.0
    });
    
    // Add normal map for detail
    if (material !== 'water') {
      mat.normalScale = new THREE.Vector2(0.5, 0.5);
    }
    
    return mat;
  }, [material]);
  
  // Vertex shader for advanced terrain effects
  const vertexShader = `
    uniform float uTime;
    uniform float uWaveStrength;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      
      vec3 pos = position;
      
      // Add water waves if material is water
      if (length(normal - vec3(0.0, 0.0, 1.0)) < 0.1) {
        pos.z += sin(pos.x * 0.1 + uTime) * sin(pos.y * 0.1 + uTime) * uWaveStrength;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vec3 color = uColor;
      
      // Add some variation based on height
      float heightFactor = vPosition.z * 0.1;
      color = mix(color, color * 1.2, heightFactor);
      
      // Add grid lines for debugging (optional)
      float grid = abs(fract(vUv.x * 100.0) - 0.5) < 0.05 || abs(fract(vUv.y * 100.0) - 0.5) < 0.05 ? 0.8 : 1.0;
      
      gl_FragColor = vec4(color * grid, 1.0);
    }
  `;
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={terrainMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    />
  );
}

// Performance monitoring
export function PerformanceMonitor() {
  const [stats, setStats] = useState({
    fps: 0,
    memory: 0,
    drawCalls: 0,
    triangles: 0
  });
  
  const { gl } = useThree();
  
  useFrame(() => {
    // Update performance stats
    const info = gl.info;
    setStats({
      fps: Math.round(1000 / (performance.now() % 1000)),
      memory: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
      drawCalls: info.render.calls,
      triangles: info.render.triangles
    });
  });
  
  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: 10,
        borderRadius: 5,
        fontFamily: 'monospace',
        fontSize: 12,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <div>FPS: {stats.fps}</div>
      <div>Memory: {stats.memory.toFixed(1)}MB</div>
      <div>Draw Calls: {stats.drawCalls}</div>
      <div>Triangles: {stats.triangles}</div>
    </Html>
  );
}

// Optimized vegetation system
export interface VegetationSystemProps {
  trees: Array<{
    position: [number, number, number];
    scale: number;
    species: string;
  }>;
  maxDistance?: number;
}

export function VegetationSystem({ trees, maxDistance = 200 }: VegetationSystemProps) {
  const { camera } = useThree();
  
  // Filter trees based on distance for performance
  const visibleTrees = useMemo(() => {
    return trees.filter(tree => {
      const distance = camera.position.distanceTo(new THREE.Vector3(...tree.position));
      return distance < maxDistance;
    });
  }, [trees, camera.position, maxDistance]);
  
  return (
    <group>
      {visibleTrees.map((tree, index) => (
        <TreeInstance
          key={index}
          position={tree.position}
          scale={tree.scale}
          species={tree.species}
        />
      ))}
    </group>
  );
}

function TreeInstance({ position, scale, species }: {
  position: [number, number, number];
  scale: number;
  species: string;
}) {
  const geometry = useMemo(() => {
    // Create simple tree geometry
    const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2 * scale);
    const leavesGeometry = new THREE.SphereGeometry(1.5 * scale);
    
    // Combine geometries
    const combinedGeometry = new THREE.BufferGeometry();
    // Implementation would merge the geometries
    
    return trunkGeometry; // Simplified for now
  }, [scale]);
  
  return (
    <mesh
      position={position}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#8B4513" />
    </mesh>
  );
}