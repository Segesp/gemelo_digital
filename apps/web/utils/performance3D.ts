// Performance monitoring and optimization utilities for 3D components

export interface Performance3DMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  triangleCount: number;
  drawCalls: number;
  dataPoints: number;
  lodLevel: number;
  culledObjects: number;
}

export class Performance3DMonitor {
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private callbacks: ((metrics: Performance3DMetrics) => void)[] = [];
  private dataPoints: number = 0;
  private lodLevel: number = 3;
  private culledObjects: number = 0;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    const monitor = (currentTime: number) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        this.notifyCallbacks();
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  private notifyCallbacks() {
    const metrics: Performance3DMetrics = {
      fps: this.fps,
      memoryUsage: this.getMemoryUsage(),
      renderTime: performance.now(),
      triangleCount: 0, // Would need Three.js renderer info
      drawCalls: 0,     // Would need Three.js renderer info
      dataPoints: this.dataPoints,
      lodLevel: this.lodLevel,
      culledObjects: this.culledObjects
    };

    this.callbacks.forEach(callback => callback(metrics));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }
    return 0;
  }

  public updateStats(dataPoints: number, lodLevel: number, culledObjects: number) {
    this.dataPoints = dataPoints;
    this.lodLevel = lodLevel;
    this.culledObjects = culledObjects;
  }

  public subscribe(callback: (metrics: Performance3DMetrics) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public getFPS(): number {
    return this.fps;
  }
}

// LOD (Level of Detail) utilities
export const getLODLevel = (distance: number, maxDistance: number = 100): number => {
  const ratio = distance / maxDistance;
  if (ratio < 0.2) return 4; // Ultra high detail
  if (ratio < 0.4) return 3; // High detail
  if (ratio < 0.6) return 2; // Medium detail
  if (ratio < 0.8) return 1; // Low detail
  return 0; // Very low detail or hidden
};

// Adaptive LOD based on performance
export const getAdaptiveLODLevel = (
  distance: number, 
  currentFPS: number, 
  targetFPS: number = 60
): number => {
  const baseLOD = getLODLevel(distance);
  const performanceRatio = currentFPS / targetFPS;
  
  if (performanceRatio < 0.5) {
    return Math.max(0, baseLOD - 2); // Reduce detail significantly
  } else if (performanceRatio < 0.8) {
    return Math.max(0, baseLOD - 1); // Reduce detail slightly
  }
  
  return baseLOD;
};

// Frustum culling utility
export const isInViewFrustum = (
  position: [number, number, number],
  cameraPosition: [number, number, number],
  cameraDirection: [number, number, number],
  fov: number,
  distance: number
): boolean => {
  const [x, y, z] = position;
  const [cx, cy, cz] = cameraPosition;
  const [dx, dy, dz] = cameraDirection;
  
  const pointToCam = [x - cx, y - cy, z - cz];
  const distanceToCam = Math.sqrt(pointToCam[0] ** 2 + pointToCam[1] ** 2 + pointToCam[2] ** 2);
  
  // Distance culling
  if (distanceToCam > distance) return false;
  
  // Simple dot product frustum check
  const dotProduct = (pointToCam[0] * dx + pointToCam[1] * dy + pointToCam[2] * dz) / distanceToCam;
  const fovRad = (fov * Math.PI) / 180;
  const cosHalfFOV = Math.cos(fovRad / 2);
  
  return dotProduct > cosHalfFOV;
};

// Smart data aggregation for performance
export const aggregateDataPoints = (
  data: Array<{ longitude: number; latitude: number; value: number; timestamp: string }>,
  viewDistance: number,
  currentFPS: number,
  targetFPS: number = 60
): Array<{ longitude: number; latitude: number; value: number; count: number; timestamps: string[] }> => {
  // Adaptive grid size based on performance and view distance
  let gridSize = 0.001; // base grid size in degrees
  
  const performanceRatio = currentFPS / targetFPS;
  if (performanceRatio < 0.5) {
    gridSize *= 4; // Larger grid for better performance
  } else if (performanceRatio < 0.8) {
    gridSize *= 2;
  }
  
  // Adjust based on view distance
  gridSize *= Math.max(0.1, viewDistance / 50);

  const gridMap = new Map<string, {
    longitude: number;
    latitude: number;
    values: number[];
    timestamps: string[];
  }>();

  data.forEach(point => {
    const gridX = Math.floor(point.longitude / gridSize);
    const gridY = Math.floor(point.latitude / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!gridMap.has(key)) {
      gridMap.set(key, {
        longitude: gridX * gridSize + gridSize / 2,
        latitude: gridY * gridSize + gridSize / 2,
        values: [],
        timestamps: []
      });
    }
    
    const cell = gridMap.get(key)!;
    cell.values.push(point.value);
    cell.timestamps.push(point.timestamp);
  });

  return Array.from(gridMap.values()).map(cell => ({
    longitude: cell.longitude,
    latitude: cell.latitude,
    value: cell.values.reduce((sum, val) => sum + val, 0) / cell.values.length,
    count: cell.values.length,
    timestamps: cell.timestamps
  }));
};

// Instanced rendering helper with optimizations
export const createInstancedData = (
  positions: Array<[number, number, number]>,
  scales: number[],
  colors: Array<[number, number, number]>,
  maxInstances: number = 1000
) => {
  // Limit instances for performance
  const instanceCount = Math.min(positions.length, maxInstances);
  const instancedPositions = new Float32Array(instanceCount * 3);
  const instancedScales = new Float32Array(instanceCount);
  const instancedColors = new Float32Array(instanceCount * 3);

  for (let i = 0; i < instanceCount; i++) {
    instancedPositions[i * 3] = positions[i][0];
    instancedPositions[i * 3 + 1] = positions[i][1];
    instancedPositions[i * 3 + 2] = positions[i][2];
    
    instancedScales[i] = scales[i] || 1;
    
    instancedColors[i * 3] = colors[i]?.[0] || 1;
    instancedColors[i * 3 + 1] = colors[i]?.[1] || 1;
    instancedColors[i * 3 + 2] = colors[i]?.[2] || 1;
  }

  return {
    positions: instancedPositions,
    scales: instancedScales,
    colors: instancedColors,
    count: instanceCount
  };
};

// Spatial indexing for fast queries
export class SpatialIndex {
  private grid: Map<string, Array<any>> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 1) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, z: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellZ = Math.floor(z / this.cellSize);
    return `${cellX},${cellZ}`;
  }

  public insert(object: any, x: number, z: number) {
    const key = this.getKey(x, z);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(object);
  }

  public query(x: number, z: number, radius: number): Array<any> {
    const results: Array<any> = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellZ = Math.floor(z / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${centerCellX + dx},${centerCellZ + dz}`;
        const cell = this.grid.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }

    return results;
  }

  public clear() {
    this.grid.clear();
  }
}

// Memory management with improved cleanup
export const cleanup3DResources = (scene: any) => {
  if (!scene) return;
  
  scene.traverse((object: any) => {
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      
      materials.forEach((material: any) => {
        // Dispose textures
        Object.keys(material).forEach(key => {
          const value = material[key];
          if (value && value.isTexture) {
            value.dispose();
          }
        });
        
        material.dispose();
      });
    }
    
    // Clean up user data
    if (object.userData) {
      object.userData = {};
    }
  });
};

// Digital Twin specific utilities
export const calculateOptimalViewDistance = (dataPointCount: number, screenSize: number): number => {
  // Adaptive view distance based on data density and screen size
  const baseDistance = 50;
  const densityFactor = Math.sqrt(dataPointCount / 100);
  const screenFactor = Math.sqrt(screenSize / (1920 * 1080));
  
  return baseDistance * densityFactor * screenFactor;
};

export const getInterpolatedValue = (
  point: [number, number],
  dataPoints: Array<{ longitude: number; latitude: number; value: number }>,
  radius: number = 1
): number => {
  let weightedSum = 0;
  let totalWeight = 0;
  
  dataPoints.forEach(dataPoint => {
    const distance = Math.sqrt(
      (point[0] - dataPoint.longitude) ** 2 + 
      (point[1] - dataPoint.latitude) ** 2
    );
    
    if (distance <= radius) {
      const weight = 1 / (distance + 0.001); // Avoid division by zero
      weightedSum += dataPoint.value * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

// Performance profiler
export class PerformanceProfiler {
  private markers: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();

  public mark(name: string) {
    this.markers.set(name, performance.now());
  }

  public measure(name: string, startMark: string, endMark?: string) {
    const startTime = this.markers.get(startMark);
    const endTime = endMark ? this.markers.get(endMark) : performance.now();
    
    if (startTime !== undefined && endTime !== undefined) {
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      
      const measurements = this.measurements.get(name)!;
      measurements.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
    }
  }

  public getAverageTime(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  public getReport(): Record<string, { average: number; count: number; latest: number }> {
    const report: Record<string, { average: number; count: number; latest: number }> = {};
    
    this.measurements.forEach((measurements, name) => {
      if (measurements.length > 0) {
        report[name] = {
          average: this.getAverageTime(name),
          count: measurements.length,
          latest: measurements[measurements.length - 1]
        };
      }
    });
    
    return report;
  }

  public clear() {
    this.markers.clear();
    this.measurements.clear();
  }
}