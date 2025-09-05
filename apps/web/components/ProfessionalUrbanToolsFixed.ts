import * as THREE from 'three';

export interface RoadPoint {
  position: [number, number, number];
  elevation: number;
  width: number;
  type: 'street' | 'avenue' | 'highway' | 'pedestrian';
}

export interface RoadSegment {
  id: string;
  points: RoadPoint[];
  type: 'street' | 'avenue' | 'highway' | 'pedestrian';
  material: 'asphalt' | 'concrete' | 'cobblestone' | 'pedestrian';
  lanes: number;
  speedLimit: number;
  capacity: number;
  lighting: boolean;
  drainage: boolean;
  connectedRoads: string[];
  intersections: Intersection[];
}

export interface Intersection {
  id: string;
  position: [number, number, number];
  type: 'four_way' | 'three_way' | 'roundabout' | 'highway_exit';
  connectedRoads: string[];
  trafficControl: 'none' | 'stop_sign' | 'traffic_light' | 'yield';
  capacity: number;
}

export interface TrafficLight {
  id: string;
  position: [number, number, number];
  state: 'red' | 'yellow' | 'green';
  timer: number;
  cycle: {
    red: number;
    yellow: number;
    green: number;
  };
}

export interface RoadMarking {
  type: 'center_line' | 'lane_divider' | 'crosswalk' | 'arrow' | 'text';
  position: [number, number, number];
  direction?: number;
  text?: string;
}

export class ProfessionalRoadBuilder {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private gl: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private intersections: Map<string, Intersection> = new Map();
  private trafficLights: Map<string, TrafficLight> = new Map();
  
  constructor(scene: THREE.Scene, camera: THREE.Camera, gl: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.gl = gl;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  // Enhanced road building with professional features and intersections
  createRoadGeometry(points: RoadPoint[], type: RoadSegment['type']): THREE.Group {
    if (points.length < 2) throw new Error('At least 2 points required for road');
    
    const roadGroup = new THREE.Group();
    const roadWidth = this.getRoadWidth(type);
    
    // Create main road surface
    const roadSurface = this.createRoadSurface(points, roadWidth, type);
    roadGroup.add(roadSurface);
    
    // Add lane markings
    const laneMarkings = this.createLaneMarkings(points, roadWidth, type);
    roadGroup.add(laneMarkings);
    
    // Add sidewalks for non-highway roads
    if (type !== 'highway') {
      const sidewalks = this.createSidewalks(points, roadWidth);
      roadGroup.add(sidewalks);
    }
    
    // Add street lighting
    const lighting = this.createStreetLighting(points, roadWidth, type);
    roadGroup.add(lighting);
    
    // Add traffic signs and signals
    const signage = this.createTrafficSignage(points, type);
    roadGroup.add(signage);
    
    return roadGroup;
  }
  
  private createRoadSurface(points: RoadPoint[], width: number, type: RoadSegment['type']): THREE.Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    // Generate road surface vertices
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const [x, y, z] = point.position;
      
      // Calculate road direction
      let direction = new THREE.Vector3();
      if (i === 0) {
        direction.subVectors(
          new THREE.Vector3(...points[i + 1].position),
          new THREE.Vector3(...point.position)
        );
      } else if (i === points.length - 1) {
        direction.subVectors(
          new THREE.Vector3(...point.position),
          new THREE.Vector3(...points[i - 1].position)
        );
      } else {
        const prev = new THREE.Vector3(...points[i - 1].position);
        const next = new THREE.Vector3(...points[i + 1].position);
        direction.subVectors(next, prev);
      }
      
      direction.normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      // Left and right edges of road
      const halfWidth = width / 2;
      const leftEdge = new THREE.Vector3(x, y, z).add(perpendicular.clone().multiplyScalar(halfWidth));
      const rightEdge = new THREE.Vector3(x, y, z).add(perpendicular.clone().multiplyScalar(-halfWidth));
      
      // Add vertices
      vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
      vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
      
      // Add UVs
      const u = i / (points.length - 1);
      uvs.push(0, u);
      uvs.push(1, u);
      
      // Add indices for triangles
      if (i < points.length - 1) {
        const baseIndex = i * 2;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Create material based on road type
    const material = this.createRoadMaterial(type);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.name = `road_surface_${type}`;
    
    return mesh;
  }
  
  private createLaneMarkings(points: RoadPoint[], width: number, type: RoadSegment['type']): THREE.Group {
    const markingsGroup = new THREE.Group();
    const lanes = this.getLaneCount(type);
    
    if (lanes < 2) return markingsGroup;
    
    // Create center line
    const centerLineGeometry = this.createLineGeometry(points, 0);
    const centerLineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffff00, 
      linewidth: 2
    });
    const centerLine = new THREE.Line(centerLineGeometry, centerLineMaterial);
    centerLine.position.y += 0.01;
    markingsGroup.add(centerLine);
    
    return markingsGroup;
  }
  
  private createSidewalks(points: RoadPoint[], roadWidth: number): THREE.Group {
    const sidewalkGroup = new THREE.Group();
    const sidewalkWidth = 2;
    
    // Create basic sidewalk geometry
    const sidewalkGeometry = new THREE.BoxGeometry(roadWidth + 4, 0.15, 1);
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    
    for (let i = 0; i < points.length - 1; i++) {
      const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
      leftSidewalk.position.set(...points[i].position);
      leftSidewalk.position.x += roadWidth / 2 + sidewalkWidth / 2;
      leftSidewalk.position.y += 0.075;
      sidewalkGroup.add(leftSidewalk);
      
      const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
      rightSidewalk.position.set(...points[i].position);
      rightSidewalk.position.x -= roadWidth / 2 + sidewalkWidth / 2;
      rightSidewalk.position.y += 0.075;
      sidewalkGroup.add(rightSidewalk);
    }
    
    return sidewalkGroup;
  }
  
  private createStreetLighting(points: RoadPoint[], roadWidth: number, type: RoadSegment['type']): THREE.Group {
    const lightingGroup = new THREE.Group();
    
    if (type === 'pedestrian') return lightingGroup;
    
    const lightSpacing = 25;
    const lightHeight = 8;
    
    for (let i = 0; i < points.length; i += Math.ceil(lightSpacing / 10)) {
      if (i >= points.length) break;
      
      const position = new THREE.Vector3(...points[i].position);
      
      // Create light pole
      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, lightHeight);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.copy(position);
      pole.position.x += roadWidth / 2 + 2;
      pole.position.y += lightHeight / 2;
      lightingGroup.add(pole);
      
      // Add light
      const light = new THREE.PointLight(0xffdd88, 0.5, 30);
      light.position.copy(position);
      light.position.x += roadWidth / 2 + 2;
      light.position.y += lightHeight;
      lightingGroup.add(light);
    }
    
    return lightingGroup;
  }
  
  private createTrafficSignage(points: RoadPoint[], type: RoadSegment['type']): THREE.Group {
    const signageGroup = new THREE.Group();
    
    // Add speed limit sign at the start
    if (points.length > 0) {
      const signPosition = new THREE.Vector3(...points[0].position);
      const signGeometry = new THREE.PlaneGeometry(1, 1);
      const signMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide
      });
      const sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.copy(signPosition);
      sign.position.x += this.getRoadWidth(type) / 2 + 3;
      sign.position.y += 2;
      signageGroup.add(sign);
    }
    
    return signageGroup;
  }
  
  private createLineGeometry(points: RoadPoint[], offset: number): THREE.BufferGeometry {
    const vertices: number[] = [];
    
    points.forEach(point => {
      vertices.push(
        point.position[0] + offset,
        point.position[1] + 0.01,
        point.position[2]
      );
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    return geometry;
  }
  
  private createRoadMaterial(type: RoadSegment['type']): THREE.Material {
    switch (type) {
      case 'highway':
        return new THREE.MeshStandardMaterial({
          color: 0x2f2f2f,
          roughness: 0.9,
          metalness: 0.1
        });
      case 'avenue':
        return new THREE.MeshStandardMaterial({
          color: 0x404040,
          roughness: 0.8,
          metalness: 0.1
        });
      case 'street':
        return new THREE.MeshStandardMaterial({
          color: 0x505050,
          roughness: 0.7,
          metalness: 0.1
        });
      case 'pedestrian':
        return new THREE.MeshStandardMaterial({
          color: 0x8b7355,
          roughness: 0.9,
          metalness: 0.0
        });
      default:
        return new THREE.MeshStandardMaterial({ color: 0x404040 });
    }
  }
  
  private getRoadWidth(type: RoadSegment['type']): number {
    switch (type) {
      case 'highway': return 24;
      case 'avenue': return 16;
      case 'street': return 8;
      case 'pedestrian': return 3;
      default: return 8;
    }
  }
  
  private getLaneCount(type: RoadSegment['type']): number {
    switch (type) {
      case 'highway': return 6;
      case 'avenue': return 4;
      case 'street': return 2;
      case 'pedestrian': return 1;
      default: return 2;
    }
  }
  
  // Animation methods
  updateTrafficLights(deltaTime: number): void {
    this.trafficLights.forEach(light => {
      light.timer += deltaTime;
      
      const totalCycle = light.cycle.red + light.cycle.yellow + light.cycle.green;
      const cycleTime = light.timer % totalCycle;
      
      if (cycleTime < light.cycle.red) {
        light.state = 'red';
      } else if (cycleTime < light.cycle.red + light.cycle.green) {
        light.state = 'green';
      } else {
        light.state = 'yellow';
      }
    });
  }
  
  getIntersections(): Intersection[] {
    return Array.from(this.intersections.values());
  }
  
  getTrafficLights(): TrafficLight[] {
    return Array.from(this.trafficLights.values());
  }
}

// Professional measurement tools
export class ProfessionalMeasurementTools {
  private scene: THREE.Scene;
  private measurements: THREE.Object3D[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  measureDistance(pointA: THREE.Vector3, pointB: THREE.Vector3): number {
    return pointA.distanceTo(pointB);
  }
  
  measureArea(points: THREE.Vector3[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].z;
      area -= points[j].x * points[i].z;
    }
    return Math.abs(area) / 2;
  }
  
  clearMeasurements(): void {
    this.measurements.forEach(measurement => {
      this.scene.remove(measurement);
    });
    this.measurements = [];
  }
}

// Professional export tools
export class ProfessionalExportTools {
  // Instancia: exportación básica a JSON
  exportToJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  // Métodos estáticos para uso directo sin instanciar (coinciden con llamadas existentes)
  static exportToProfessionalJSON(data: any, filename?: string): string {
    const json = JSON.stringify({
      generatedAt: new Date().toISOString(),
      version: 1,
      ...data
    }, null, 2);
    if (typeof window !== 'undefined' && filename) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    return json;
  }

  static exportToCAD(buildings: any[], roads: any[], filename?: string): string {
    let dxf = '0\nSECTION\n2\nENTITIES\n';
    buildings.forEach(b => {
      dxf += `0\nINSERT\n8\nBUILDINGS\n10\n${b.position[0]}\n20\n${b.position[2]}\n`; });
    roads.forEach(r => {
      r.points.forEach((p: any) => { dxf += `0\nPOINT\n8\nROADS\n10\n${p[0]}\n20\n${p[2]}\n`; });
    });
    dxf += '0\nENDSEC\n0\nEOF\n';
    if (typeof window !== 'undefined' && filename) {
      const blob = new Blob([dxf], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    return dxf;
  }

  static generateProfessionalReport(cityData: any, filename?: string): string {
    const report = `# Urban Planning Professional Report\n\nGenerated: ${new Date().toLocaleString()}\n\n## Summary\n- Buildings: ${cityData.buildings?.length || 0}\n- Roads: ${cityData.roads?.length || 0}\n- Measurements: ${cityData.measurements?.length || 0}\n\n## Buildings Detail\n${(cityData.buildings||[]).map((b:any)=>`- ${b.properties?.buildingName || b.id} (${b.type}) h=${b.height}m floors=${b.properties?.floors}`).join('\n')}\n`;
    if (typeof window !== 'undefined' && filename) {
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    return report;
  }
  
  exportToDXF(buildings: any[], roads: any[]): string {
    // Simplified DXF export
    let dxf = '0\nSECTION\n2\nENTITIES\n';
    
    buildings.forEach(building => {
      dxf += `0\nINSERT\n8\nBUILDINGS\n10\n${building.position[0]}\n20\n${building.position[2]}\n`;
    });
    
    roads.forEach(road => {
      road.points.forEach((point: any) => {
        dxf += `0\nPOINT\n8\nROADS\n10\n${point[0]}\n20\n${point[2]}\n`;
      });
    });
    
    dxf += '0\nENDSEC\n0\nEOF\n';
    return dxf;
  }
  
  exportToReport(cityData: any): string {
    return `
# City Development Report

## Overview
- Total Buildings: ${cityData.buildings?.length || 0}
- Total Roads: ${cityData.roads?.length || 0}
- Population: ${cityData.metrics?.population || 0}

## Infrastructure Analysis
${cityData.buildings ? cityData.buildings.map((b: any) => `- ${b.properties?.buildingName || 'Unnamed Building'}: ${b.type}`).join('\n') : ''}

Generated on ${new Date().toLocaleDateString()}
    `;
  }
}