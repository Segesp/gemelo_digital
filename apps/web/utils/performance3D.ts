// Performance monitoring and optimization utilities for 3D components

export interface Performance3DMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  triangleCount: number;
  drawCalls: number;
}

export class Performance3DMonitor {
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private callbacks: ((metrics: Performance3DMetrics) => void)[] = [];

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
      drawCalls: 0      // Would need Three.js renderer info
    };

    this.callbacks.forEach(callback => callback(metrics));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }
    return 0;
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
  if (ratio < 0.3) return 3; // High detail
  if (ratio < 0.6) return 2; // Medium detail
  if (ratio < 0.9) return 1; // Low detail
  return 0; // Very low detail or hidden
};

// Frustum culling utility
export const isInViewFrustum = (
  position: [number, number, number],
  cameraPosition: [number, number, number],
  fov: number,
  distance: number
): boolean => {
  const [x, y, z] = position;
  const [cx, cy, cz] = cameraPosition;
  
  const dx = x - cx;
  const dy = y - cy;
  const dz = z - cz;
  
  const distanceToCam = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Simple distance culling
  if (distanceToCam > distance) return false;
  
  // TODO: Implement proper frustum culling with FOV
  return true;
};

// Data aggregation for performance
export const aggregateDataPoints = (
  data: Array<{ longitude: number; latitude: number; value: number; timestamp: string }>,
  gridSize: number = 0.001 // degrees
): Array<{ longitude: number; latitude: number; value: number; count: number; timestamps: string[] }> => {
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

// Instanced rendering helper
export const createInstancedData = (
  positions: Array<[number, number, number]>,
  scales: number[],
  colors: Array<[number, number, number]>
) => {
  const instanceCount = positions.length;
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
    colors: instancedColors
  };
};

// Memory management
export const cleanup3DResources = (scene: any) => {
  scene.traverse((object: any) => {
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material: any) => {
          if (material.map) material.map.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.bumpMap) material.bumpMap.dispose();
          material.dispose();
        });
      } else {
        if (object.material.map) object.material.map.dispose();
        if (object.material.normalMap) object.material.normalMap.dispose();
        if (object.material.bumpMap) object.material.bumpMap.dispose();
        object.material.dispose();
      }
    }
  });
};