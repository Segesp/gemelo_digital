import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';

// Enhanced interfaces for professional city engine
export interface BuildingData {
  id: string;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  type: 'residential' | 'commercial' | 'industrial' | 'port' | 'civic' | 'recreation';
  color: string;
  rotation: number;
  instanceId?: number; // For instanced rendering
  lodLevel?: number; // Level of detail
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
    lat?: number;
    lng?: number;
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

export interface Road {
  id: string;
  type: 'street' | 'avenue' | 'highway' | 'pedestrian';
  points: [number, number, number][];
  width: number;
  color: string;
  capacity: number;
  speedLimit: number;
  intersections?: string[]; // Connected road IDs
  trafficLights?: [number, number, number][]; // Traffic light positions
  signage?: Array<{
    position: [number, number, number];
    type: 'stop' | 'yield' | 'speed_limit' | 'direction';
    value?: string | number;
  }>;
}

export interface Terrain {
  id: string;
  heightmap: Float32Array;
  resolution: number;
  size: number;
  material: 'grass' | 'dirt' | 'sand' | 'rock' | 'water' | 'concrete';
  needsUpdate: boolean;
}

export interface Vegetation {
  id: string;
  type: 'tree' | 'bush' | 'grass' | 'flower';
  species: string;
  position: [number, number, number];
  scale: number;
  health: number;
  age: number;
}

export interface CityMetrics {
  population: number;
  employment: number;
  unemployment: number;
  budget: number;
  revenue: number;
  expenses: number;
  pollution: number;
  happiness: number;
  traffic: number;
  energy: number;
  water: number;
}

export interface ViewSettings {
  timeOfDay: number; // 0-24 hours
  weather: 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  showTraffic: boolean;
  showUtilities: boolean;
  showZones: boolean;
  showMetrics: boolean;
  cameraMode: 'orbit' | 'flythrough' | 'first_person';
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface CityEngineState {
  // Core data
  buildings: Map<string, BuildingData>;
  roads: Map<string, Road>;
  terrain: Terrain;
  vegetation: Map<string, Vegetation>;
  
  // UI state
  selectedTool: 'select' | 'build' | 'road' | 'terrain' | 'vegetation' | 'measure' | 'zone' | 
               'measure-distance' | 'measure-area' | 'measure-point' |
               'buffer' | 'intersect' | 'union' | 'spatial-join' | 'clip' |
               'coordinates' | 'attributes' | 'import-data' | 'export-data' |
               'create-polygon' | 'create-line' | 'create-point' | 'edit' | 'delete';
  selectedBuilding?: string;
  selectedBuildingTemplate?: string;
  roadConstructionPoints: [number, number, number][];
  
  // Performance settings
  viewSettings: ViewSettings;
  
  // Metrics
  cityMetrics: CityMetrics;
  
  // Actions
  addBuilding: (building: BuildingData) => void;
  removeBuilding: (id: string) => void;
  updateBuilding: (id: string, updates: Partial<BuildingData>) => void;
  
  addRoad: (road: Road) => void;
  removeRoad: (id: string) => void;
  updateRoad: (id: string, updates: Partial<Road>) => void;
  
  updateTerrain: (heightmap: Float32Array) => void;
  
  addVegetation: (vegetation: Vegetation) => void;
  removeVegetation: (id: string) => void;
  
  setSelectedTool: (tool: CityEngineState['selectedTool']) => void;
  setSelectedBuilding: (id?: string) => void;
  setSelectedBuildingTemplate: (template?: string) => void;
  
  updateViewSettings: (settings: Partial<ViewSettings>) => void;
  updateCityMetrics: (metrics: Partial<CityMetrics>) => void;
  
  // Bulk operations for performance
  bulkAddBuildings: (buildings: BuildingData[]) => void;
  bulkRemoveBuildings: (ids: string[]) => void;
  
  // Data export/import
  exportCityData: () => string;
  importCityData: (data: string) => void;
  
  // Reset
  reset: () => void;
}

// Default values
const defaultTerrain: Terrain = {
  id: 'main_terrain',
  heightmap: new Float32Array(256 * 256),
  resolution: 256,
  size: 1000,
  material: 'grass',
  needsUpdate: false
};

const defaultViewSettings: ViewSettings = {
  timeOfDay: 12,
  weather: 'clear',
  season: 'summer',
  showTraffic: true,
  showUtilities: false,
  showZones: false,
  showMetrics: true,
  cameraMode: 'orbit',
  quality: 'high'
};

const defaultCityMetrics: CityMetrics = {
  population: 0,
  employment: 0,
  unemployment: 0,
  budget: 1000000,
  revenue: 0,
  expenses: 0,
  pollution: 0,
  happiness: 50,
  traffic: 0,
  energy: 0,
  water: 0
};

// Create the store
export const useCityEngineStore = create<CityEngineState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    buildings: new Map(),
    roads: new Map(),
    terrain: defaultTerrain,
    vegetation: new Map(),
    
    selectedTool: 'select',
    selectedBuilding: undefined,
    selectedBuildingTemplate: undefined,
    roadConstructionPoints: [],
    
    viewSettings: defaultViewSettings,
    cityMetrics: defaultCityMetrics,
    
    // Actions
    addBuilding: (building) => set((state) => {
      const newBuildings = new Map(state.buildings);
      newBuildings.set(building.id, building);
      return { buildings: newBuildings };
    }),
    
    removeBuilding: (id) => set((state) => {
      const newBuildings = new Map(state.buildings);
      newBuildings.delete(id);
      return { buildings: newBuildings };
    }),
    
    updateBuilding: (id, updates) => set((state) => {
      const newBuildings = new Map(state.buildings);
      const existing = newBuildings.get(id);
      if (existing) {
        newBuildings.set(id, { ...existing, ...updates });
      }
      return { buildings: newBuildings };
    }),
    
    addRoad: (road) => set((state) => {
      const newRoads = new Map(state.roads);
      newRoads.set(road.id, road);
      return { roads: newRoads };
    }),
    
    removeRoad: (id) => set((state) => {
      const newRoads = new Map(state.roads);
      newRoads.delete(id);
      return { roads: newRoads };
    }),
    
    updateRoad: (id, updates) => set((state) => {
      const newRoads = new Map(state.roads);
      const existing = newRoads.get(id);
      if (existing) {
        newRoads.set(id, { ...existing, ...updates });
      }
      return { roads: newRoads };
    }),
    
    updateTerrain: (heightmap) => set((state) => ({
      terrain: { ...state.terrain, heightmap, needsUpdate: true }
    })),
    
    addVegetation: (vegetation) => set((state) => {
      const newVegetation = new Map(state.vegetation);
      newVegetation.set(vegetation.id, vegetation);
      return { vegetation: newVegetation };
    }),
    
    removeVegetation: (id) => set((state) => {
      const newVegetation = new Map(state.vegetation);
      newVegetation.delete(id);
      return { vegetation: newVegetation };
    }),
    
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    setSelectedBuilding: (id) => set({ selectedBuilding: id }),
    setSelectedBuildingTemplate: (template) => set({ selectedBuildingTemplate: template }),
    
    updateViewSettings: (settings) => set((state) => ({
      viewSettings: { ...state.viewSettings, ...settings }
    })),
    
    updateCityMetrics: (metrics) => set((state) => ({
      cityMetrics: { ...state.cityMetrics, ...metrics }
    })),
    
    bulkAddBuildings: (buildings) => set((state) => {
      const newBuildings = new Map(state.buildings);
      buildings.forEach(building => newBuildings.set(building.id, building));
      return { buildings: newBuildings };
    }),
    
    bulkRemoveBuildings: (ids) => set((state) => {
      const newBuildings = new Map(state.buildings);
      ids.forEach(id => newBuildings.delete(id));
      return { buildings: newBuildings };
    }),
    
    exportCityData: () => {
      const state = get();
      return JSON.stringify({
        buildings: Array.from(state.buildings.entries()),
        roads: Array.from(state.roads.entries()),
        terrain: {
          ...state.terrain,
          heightmap: Array.from(state.terrain.heightmap)
        },
        vegetation: Array.from(state.vegetation.entries()),
        viewSettings: state.viewSettings,
        cityMetrics: state.cityMetrics
      });
    },
    
    importCityData: (data) => {
      try {
        const parsed = JSON.parse(data);
        set({
          buildings: new Map(parsed.buildings || []),
          roads: new Map(parsed.roads || []),
          terrain: {
            ...parsed.terrain,
            heightmap: new Float32Array(parsed.terrain.heightmap || [])
          },
          vegetation: new Map(parsed.vegetation || []),
          viewSettings: { ...defaultViewSettings, ...parsed.viewSettings },
          cityMetrics: { ...defaultCityMetrics, ...parsed.cityMetrics }
        });
      } catch (error) {
        console.error('Failed to import city data:', error);
      }
    },
    
    reset: () => set({
      buildings: new Map(),
      roads: new Map(),
      terrain: defaultTerrain,
      vegetation: new Map(),
      selectedTool: 'select',
      selectedBuilding: undefined,
      selectedBuildingTemplate: undefined,
      roadConstructionPoints: [],
      viewSettings: defaultViewSettings,
      cityMetrics: defaultCityMetrics
    })
  }))
);

// Selectors for performance
export const useBuildings = () => useCityEngineStore((state) => Array.from(state.buildings.values()));
export const useRoads = () => useCityEngineStore((state) => Array.from(state.roads.values()));
export const useSelectedBuilding = () => useCityEngineStore((state) => 
  state.selectedBuilding ? state.buildings.get(state.selectedBuilding) : undefined
);
export const useCityMetrics = () => useCityEngineStore((state) => state.cityMetrics);
export const useViewSettings = () => useCityEngineStore((state) => state.viewSettings);