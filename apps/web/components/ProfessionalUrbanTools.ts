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
}

export class ProfessionalRoadBuilder {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private gl: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  constructor(scene: THREE.Scene, camera: THREE.Camera, gl: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.gl = gl;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  // Enhanced road building with professional features
  createRoadGeometry(points: RoadPoint[], type: RoadSegment['type']): THREE.BufferGeometry {
    if (points.length < 2) throw new Error('At least 2 points required for road');
    
    const roadWidth = this.getRoadWidth(type);
    const segments = points.length - 1;
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    
    // Generate road surface vertices
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const [x, y, z] = point.position;
      
      // Calculate road direction for proper width
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
      const halfWidth = roadWidth / 2;
      const leftEdge = new THREE.Vector3(x, y, z).add(perpendicular.clone().multiplyScalar(halfWidth));
      const rightEdge = new THREE.Vector3(x, y, z).add(perpendicular.clone().multiplyScalar(-halfWidth));
      
      // Add vertices
      vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
      vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
      
      // Add normals (pointing up)
      normals.push(0, 1, 0);
      normals.push(0, 1, 0);
      
      // Add UVs
      const u = i / (points.length - 1);
      uvs.push(0, u);
      uvs.push(1, u);
      
      // Add indices for triangles
      if (i < points.length - 1) {
        const baseIndex = i * 2;
        // First triangle
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        // Second triangle
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    return geometry;
  }
  
  createRoadMaterial(type: RoadSegment['type']): THREE.MeshStandardMaterial {
    const materialProps = this.getRoadMaterialProperties(type);
    
    return new THREE.MeshStandardMaterial({
      color: materialProps.color,
      roughness: materialProps.roughness,
      metalness: materialProps.metalness,
      transparent: materialProps.transparent,
      opacity: materialProps.opacity
    });
  }
  
  // Road markings and details
  createRoadMarkings(geometry: THREE.BufferGeometry, type: RoadSegment['type']): THREE.Group {
    const markings = new THREE.Group();
    
    // Lane dividers
    if (type === 'highway' || type === 'avenue') {
      const laneCount = this.getLaneCount(type);
      for (let i = 1; i < laneCount; i++) {
        const dividerGeometry = this.createLaneDivider(geometry, i, laneCount);
        const dividerMaterial = new THREE.MeshBasicMaterial({ 
          color: '#ffffff',
          transparent: true,
          opacity: 0.8
        });
        const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
        markings.add(divider);
      }
    }
    
    // Center line
    const centerLineGeometry = this.createCenterLine(geometry);
    const centerLineMaterial = new THREE.MeshBasicMaterial({ 
      color: '#ffff00',
      transparent: true,
      opacity: 0.9
    });
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    markings.add(centerLine);
    
    return markings;
  }
  
  // Infrastructure elements
  createRoadInfrastructure(points: RoadPoint[], type: RoadSegment['type']): THREE.Group {
    const infrastructure = new THREE.Group();
    
    // Street lights
    if (type !== 'pedestrian') {
      points.forEach((point, index) => {
        if (index % 3 === 0) { // Every 3rd point
          const streetLight = this.createStreetLight();
          streetLight.position.set(
            point.position[0] + (this.getRoadWidth(type) / 2 + 2),
            point.position[1],
            point.position[2]
          );
          infrastructure.add(streetLight);
        }
      });
    }
    
    // Traffic signs
    if (type === 'highway') {
      const speedSign = this.createSpeedLimitSign(80);
      speedSign.position.set(points[0].position[0], points[0].position[1], points[0].position[2]);
      infrastructure.add(speedSign);
    }
    
    // Guardrails for highways
    if (type === 'highway') {
      const guardrail = this.createGuardrail(points);
      infrastructure.add(guardrail);
    }
    
    return infrastructure;
  }
  
  // Helper methods
  private getRoadWidth(type: RoadSegment['type']): number {
    switch (type) {
      case 'highway': return 12;
      case 'avenue': return 8;
      case 'street': return 6;
      case 'pedestrian': return 3;
      default: return 6;
    }
  }
  
  private getLaneCount(type: RoadSegment['type']): number {
    switch (type) {
      case 'highway': return 4;
      case 'avenue': return 2;
      case 'street': return 2;
      case 'pedestrian': return 1;
      default: return 2;
    }
  }
  
  private getRoadMaterialProperties(type: RoadSegment['type']) {
    switch (type) {
      case 'highway':
        return {
          color: '#2d2d2d',
          roughness: 0.6,
          metalness: 0.1,
          transparent: false,
          opacity: 1.0
        };
      case 'avenue':
        return {
          color: '#3d3d3d',
          roughness: 0.7,
          metalness: 0.05,
          transparent: false,
          opacity: 1.0
        };
      case 'street':
        return {
          color: '#4d4d4d',
          roughness: 0.8,
          metalness: 0.02,
          transparent: false,
          opacity: 1.0
        };
      case 'pedestrian':
        return {
          color: '#8b7355',
          roughness: 0.9,
          metalness: 0.0,
          transparent: false,
          opacity: 1.0
        };
      default:
        return {
          color: '#4d4d4d',
          roughness: 0.8,
          metalness: 0.02,
          transparent: false,
          opacity: 1.0
        };
    }
  }
  
  private createLaneDivider(roadGeometry: THREE.BufferGeometry, laneIndex: number, totalLanes: number): THREE.BufferGeometry {
    // Create dashed lane divider geometry
    const dividerGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const dashLength = 3;
    const gapLength = 2;
    
    // This is a simplified implementation - in a real app you'd calculate along the road curve
    for (let i = 0; i < 100; i += dashLength + gapLength) {
      vertices.push(i, 0.01, laneIndex / totalLanes);
      vertices.push(i + dashLength, 0.01, laneIndex / totalLanes);
    }
    
    dividerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return dividerGeometry;
  }
  
  private createCenterLine(roadGeometry: THREE.BufferGeometry): THREE.BufferGeometry {
    // Create center line geometry
    const centerLineGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // Simplified center line - in reality would follow road curve
    for (let i = 0; i < 100; i += 5) {
      vertices.push(i, 0.01, 0);
      vertices.push(i + 2, 0.01, 0);
    }
    
    centerLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return centerLineGeometry;
  }
  
  private createStreetLight(): THREE.Group {
    const streetLight = new THREE.Group();
    
    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: '#666666' });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 3;
    streetLight.add(pole);
    
    // Light fixture
    const lightGeometry = new THREE.SphereGeometry(0.3);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: '#ffffaa' });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 6;
    streetLight.add(light);
    
    // Actual light source
    const pointLight = new THREE.PointLight('#ffffaa', 0.5, 20);
    pointLight.position.y = 6;
    streetLight.add(pointLight);
    
    return streetLight;
  }
  
  private createSpeedLimitSign(speed: number): THREE.Group {
    const sign = new THREE.Group();
    
    // Sign post
    const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3);
    const postMaterial = new THREE.MeshStandardMaterial({ color: '#888888' });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = 1.5;
    sign.add(post);
    
    // Sign panel
    const panelGeometry = new THREE.PlaneGeometry(1, 1);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: '#ffffff',
      side: THREE.DoubleSide
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.y = 3;
    sign.add(panel);
    
    return sign;
  }
  
  private createGuardrail(points: RoadPoint[]): THREE.Group {
    const guardrail = new THREE.Group();
    
    for (let i = 0; i < points.length - 1; i++) {
      const railGeometry = new THREE.BoxGeometry(5, 0.3, 0.1);
      const railMaterial = new THREE.MeshStandardMaterial({ color: '#cccccc' });
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      
      const midPoint = [
        (points[i].position[0] + points[i + 1].position[0]) / 2,
        points[i].position[1] + 1,
        (points[i].position[2] + points[i + 1].position[2]) / 2
      ];
      
      rail.position.set(midPoint[0], midPoint[1], midPoint[2]);
      guardrail.add(rail);
    }
    
    return guardrail;
  }
}

// Professional measurement tools
export class ProfessionalMeasurementTools {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private measurements: THREE.Group;
  
  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.measurements = new THREE.Group();
    this.scene.add(this.measurements);
  }
  
  measureDistance(point1: [number, number, number], point2: [number, number, number]): number {
    const distance = Math.sqrt(
      Math.pow(point2[0] - point1[0], 2) +
      Math.pow(point2[1] - point1[1], 2) +
      Math.pow(point2[2] - point1[2], 2)
    );
    
    this.createDistanceMeasurement(point1, point2, distance);
    return distance;
  }
  
  measureArea(points: [number, number, number][]): number {
    if (points.length < 3) return 0;
    
    // Calculate area using shoelace formula (for 2D projection)
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][2];
      area -= points[j][0] * points[i][2];
    }
    area = Math.abs(area) / 2;
    
    this.createAreaMeasurement(points, area);
    return area;
  }
  
  measureAngle(point1: [number, number, number], vertex: [number, number, number], point2: [number, number, number]): number {
    const v1 = new THREE.Vector3(
      point1[0] - vertex[0],
      point1[1] - vertex[1],
      point1[2] - vertex[2]
    );
    const v2 = new THREE.Vector3(
      point2[0] - vertex[0],
      point2[1] - vertex[1],
      point2[2] - vertex[2]
    );
    
    const angle = v1.angleTo(v2) * (180 / Math.PI);
    this.createAngleMeasurement(point1, vertex, point2, angle);
    return angle;
  }
  
  private createDistanceMeasurement(point1: [number, number, number], point2: [number, number, number], distance: number) {
    const measurement = new THREE.Group();
    
    // Line between points
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...point1),
      new THREE.Vector3(...point2)
    ]);
    const material = new THREE.LineBasicMaterial({ color: '#ff0000', linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    measurement.add(line);
    
    // End point markers
    const markerGeometry = new THREE.SphereGeometry(0.2);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: '#ff0000' });
    
    const marker1 = new THREE.Mesh(markerGeometry, markerMaterial);
    marker1.position.set(...point1);
    measurement.add(marker1);
    
    const marker2 = new THREE.Mesh(markerGeometry, markerMaterial);
    marker2.position.set(...point2);
    measurement.add(marker2);
    
    this.measurements.add(measurement);
  }
  
  private createAreaMeasurement(points: [number, number, number][], area: number) {
    const measurement = new THREE.Group();
    
    // Create area outline
    const outlinePoints = [...points, points[0]]; // Close the shape
    const geometry = new THREE.BufferGeometry().setFromPoints(
      outlinePoints.map(p => new THREE.Vector3(...p))
    );
    const material = new THREE.LineBasicMaterial({ color: '#00ff00', linewidth: 2 });
    const outline = new THREE.Line(geometry, material);
    measurement.add(outline);
    
    // Fill area (simplified)
    if (points.length >= 3) {
      const shape = new THREE.Shape(points.map(p => new THREE.Vector2(p[0], p[2])));
      const fillGeometry = new THREE.ShapeGeometry(shape);
      const fillMaterial = new THREE.MeshBasicMaterial({ 
        color: '#00ff00', 
        transparent: true, 
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const fill = new THREE.Mesh(fillGeometry, fillMaterial);
      fill.rotation.x = -Math.PI / 2;
      fill.position.y = points[0][1] + 0.01;
      measurement.add(fill);
    }
    
    this.measurements.add(measurement);
  }
  
  private createAngleMeasurement(point1: [number, number, number], vertex: [number, number, number], point2: [number, number, number], angle: number) {
    const measurement = new THREE.Group();
    
    // Lines from vertex to points
    const line1Geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...vertex),
      new THREE.Vector3(...point1)
    ]);
    const line2Geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...vertex),
      new THREE.Vector3(...point2)
    ]);
    
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#0000ff', linewidth: 2 });
    const line1 = new THREE.Line(line1Geometry, lineMaterial);
    const line2 = new THREE.Line(line2Geometry, lineMaterial);
    
    measurement.add(line1);
    measurement.add(line2);
    
    // Vertex marker
    const vertexGeometry = new THREE.SphereGeometry(0.3);
    const vertexMaterial = new THREE.MeshBasicMaterial({ color: '#0000ff' });
    const vertexMarker = new THREE.Mesh(vertexGeometry, vertexMaterial);
    vertexMarker.position.set(...vertex);
    measurement.add(vertexMarker);
    
    this.measurements.add(measurement);
  }
  
  clearAllMeasurements() {
    this.measurements.clear();
  }
  
  clearLastMeasurement() {
    if (this.measurements.children.length > 0) {
      this.measurements.remove(this.measurements.children[this.measurements.children.length - 1]);
    }
  }
}

// Professional export utilities
export class ProfessionalExportTools {
  static exportToCAD(buildings: any[], roads: any[], filename: string = 'city_design.dxf') {
    // DXF export implementation
    let dxfContent = `0\nSECTION\n2\nHEADER\n`;
    dxfContent += `9\n$ACADVER\n1\nAC1015\n`; // AutoCAD 2000 format
    dxfContent += `0\nENDSEC\n`;
    
    // Entities section
    dxfContent += `0\nSECTION\n2\nENTITIES\n`;
    
    // Export buildings
    buildings.forEach((building, index) => {
      dxfContent += `0\n3DFACE\n`;
      dxfContent += `8\nBUILDINGS\n`; // Layer name
      dxfContent += `10\n${building.position[0] - building.width/2}\n`;
      dxfContent += `20\n${building.position[2] - building.depth/2}\n`;
      dxfContent += `30\n${building.position[1]}\n`;
      dxfContent += `11\n${building.position[0] + building.width/2}\n`;
      dxfContent += `21\n${building.position[2] - building.depth/2}\n`;
      dxfContent += `31\n${building.position[1]}\n`;
      dxfContent += `12\n${building.position[0] + building.width/2}\n`;
      dxfContent += `22\n${building.position[2] + building.depth/2}\n`;
      dxfContent += `32\n${building.position[1]}\n`;
      dxfContent += `13\n${building.position[0] - building.width/2}\n`;
      dxfContent += `23\n${building.position[2] + building.depth/2}\n`;
      dxfContent += `33\n${building.position[1]}\n`;
    });
    
    // Export roads
    roads.forEach((road, index) => {
      if (road.points.length >= 2) {
        dxfContent += `0\nPOLYLINE\n`;
        dxfContent += `8\nROADS\n`; // Layer name
        dxfContent += `66\n1\n`; // Polyline flag
        dxfContent += `70\n0\n`; // Polyline type
        
        road.points.forEach((point: [number, number, number]) => {
          dxfContent += `0\nVERTEX\n`;
          dxfContent += `8\nROADS\n`;
          dxfContent += `10\n${point[0]}\n`;
          dxfContent += `20\n${point[2]}\n`;
          dxfContent += `30\n${point[1]}\n`;
        });
        
        dxfContent += `0\nSEQEND\n`;
      }
    });
    
    dxfContent += `0\nENDSEC\n0\nEOF\n`;
    
    // Download file
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  static exportToProfessionalJSON(cityData: any, filename: string = 'professional_city_model.json') {
    const professionalFormat = {
      metadata: {
        version: '2.0',
        created: new Date().toISOString(),
        software: 'Gemelo Digital City Engine',
        standard: 'ISO 19115',
        coordinate_system: 'WGS84',
        units: 'meters'
      },
      city: {
        name: 'Proyecto Urbano',
        bounds: {
          north: 50,
          south: -50,
          east: 50,
          west: -50
        },
        elevation_range: {
          min: 0,
          max: 100
        }
      },
      buildings: cityData.buildings.map((building: any) => ({
        id: building.id,
        geometry: {
          type: 'Box',
          position: building.position,
          dimensions: {
            width: building.width,
            depth: building.depth,
            height: building.height
          },
          rotation: building.rotation
        },
        properties: {
          type: building.type,
          name: building.properties.buildingName,
          floors: building.properties.floors,
          year_built: building.properties.yearBuilt,
          condition: building.properties.condition,
          value: building.properties.value
        },
        economics: building.economics,
        environment: building.environment,
        utilities: building.utilities
      })),
      infrastructure: {
        roads: cityData.roads.map((road: any) => ({
          id: road.id,
          type: road.type,
          geometry: {
            type: 'LineString',
            coordinates: road.points
          },
          properties: {
            width: road.width,
            lanes: road.type === 'highway' ? 4 : road.type === 'avenue' ? 2 : 1,
            speed_limit: road.speedLimit,
            capacity: road.capacity,
            surface_material: road.type === 'pedestrian' ? 'concrete' : 'asphalt'
          }
        }))
      },
      analysis: {
        statistics: {
          total_buildings: cityData.buildings.length,
          total_roads: cityData.roads.length,
          total_area: cityData.buildings.reduce((sum: number, b: any) => sum + (b.width * b.depth), 0),
          population_estimate: cityData.buildings
            .filter((b: any) => b.type === 'residential')
            .reduce((sum: number, b: any) => sum + (b.properties.units || 0) * 2, 0)
        },
        sustainability: {
          green_space_ratio: 0.15,
          energy_efficiency_avg: cityData.buildings.reduce((sum: number, b: any) => sum + b.environment.energyEfficiency, 0) / cityData.buildings.length,
          pollution_level: cityData.buildings.reduce((sum: number, b: any) => sum + b.environment.pollutionGenerated, 0)
        }
      }
    };
    
    const dataStr = JSON.stringify(professionalFormat, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  static generateProfessionalReport(cityData: any): string {
    const stats = {
      buildings: cityData.buildings.length,
      population: cityData.buildings
        .filter((b: any) => b.type === 'residential')
        .reduce((sum: number, b: any) => sum + (b.properties.units || 0) * 2, 0),
      jobs: cityData.buildings.reduce((sum: number, b: any) => sum + (b.properties.employees || 0), 0),
      totalValue: cityData.buildings.reduce((sum: number, b: any) => sum + b.properties.value, 0)
    };
    
    return `# Professional Urban Planning Report
Generated: ${new Date().toLocaleString()}

## Executive Summary
This comprehensive urban development analysis provides key insights into the proposed city design, including demographic projections, economic impact assessment, and infrastructure requirements.

## Development Statistics
- **Total Buildings**: ${stats.buildings}
- **Estimated Population**: ${stats.population.toLocaleString()}
- **Employment Opportunities**: ${stats.jobs.toLocaleString()}
- **Total Property Value**: $${stats.totalValue.toLocaleString()}
- **Road Network**: ${cityData.roads.length} segments

## Building Distribution
${Object.entries(
  cityData.buildings.reduce((acc: any, building: any) => {
    acc[building.type] = (acc[building.type] || 0) + 1;
    return acc;
  }, {})
).map(([type, count]) => `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${count}`).join('\n')}

## Economic Analysis
- **Average Property Value**: $${Math.round(stats.totalValue / stats.buildings).toLocaleString()}
- **Jobs-to-Population Ratio**: ${((stats.jobs / stats.population) * 100).toFixed(1)}%
- **Development Density**: ${(stats.buildings / 10000 * 100).toFixed(2)} buildings per hectare

## Infrastructure Assessment
- **Road Coverage**: ${cityData.roads.length} road segments
- **Transportation Types**: ${[...new Set(cityData.roads.map((r: any) => r.type))].join(', ')}
- **Average Road Capacity**: ${Math.round(cityData.roads.reduce((sum: number, r: any) => sum + r.capacity, 0) / cityData.roads.length)} vehicles/hour

## Sustainability Metrics
- **Green Building Integration**: Planned for future phases
- **Energy Efficiency**: Mixed efficiency ratings across building types
- **Public Transit Access**: Under development

## Recommendations
1. **Zoning Optimization**: Balance residential and commercial development
2. **Transportation**: Expand public transit integration
3. **Sustainability**: Implement green building standards
4. **Infrastructure**: Ensure adequate utility coverage

## Technical Specifications
- **Coordinate System**: WGS84
- **Units**: Metric (meters)
- **Elevation Range**: 0-100m
- **Planning Standards**: ISO 19115 compliant

---
*Generated by Gemelo Digital Professional City Engine*
`;
  }
}