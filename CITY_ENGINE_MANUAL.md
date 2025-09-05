# 🏙️ City Engine Manual - Interactive Urban Planning Toolkit

## Overview

The City Engine has been completely redesigned to provide **manual urban planning tools** similar to SimCity and ArcGIS City Engine, allowing users to build cities interactively rather than relying on procedural generation.

## 🎯 Key Features

### 1. Interactive Building Placement
- **Building Palette**: 16 different building types across 6 categories
- **Manual Placement**: Click and place buildings anywhere on the map
- **Real-time Preview**: See building placement before confirming
- **Snap-to-Grid**: Buildings automatically align to a grid system

### 2. Building Categories & Templates

#### 🏠 Residential Buildings
- **Casa Pequeña**: Single-family homes (1-2 floors)
- **Apartamentos**: Mid-rise apartment buildings (3-4 floors)  
- **Torre Residencial**: High-rise luxury towers (40m height)

#### 🏬 Commercial Buildings
- **Tienda Local**: Small neighborhood shops
- **Centro Comercial**: Large shopping centers
- **Torre de Oficinas**: Corporate office towers (50m height)

#### 🏭 Industrial Buildings
- **Almacén**: Industrial warehouses
- **Fábrica**: Manufacturing plants

#### 🚢 Port Buildings
- **Terminal de Contenedores**: Container terminals (requires waterfront)
- **Almacén Portuario**: Port warehouses

#### 🏛️ Civic Buildings
- **Municipalidad**: City hall
- **Hospital**: Healthcare facilities
- **Colegio**: Educational institutions

#### 🌳 Recreation
- **Parque**: Green recreational areas
- **Estadio**: Sports stadiums (requires high population)

### 3. Advanced Building Editor
- **Property Customization**: Edit building names, height, rotation
- **Real-time Adjustment**: Slider controls for height and rotation
- **Building Information**: Units, capacity, construction year, value
- **Type-specific Properties**: Residential units, commercial capacity

### 4. Urban Planning Tools

#### Mode Selection
- **🔍 Select Mode**: Click buildings to view/edit properties
- **🏗️ Build Mode**: Place new buildings from the palette
- **💥 Demolish Mode**: Remove buildings with visual confirmation

#### Visual Aids
- **Street Network**: Automatic grid-based street system
- **Zoning Areas**: Color-coded zones with wireframe overlays
- **Building Selection**: Animated highlights and ring indicators
- **Hover Information**: Detailed building data on mouse over

### 5. Professional Export Tools
- **📸 Screenshot Export**: High-resolution PNG captures
- **🏗️ 3D Model Export**: Complete JSON format with metadata
- **📊 Analysis Reports**: Comprehensive planning documentation

## 🎮 Usage Instructions

### Getting Started
1. Click **"🏙️ City Engine"** in the visualization mode selector
2. The interface will load with sample buildings already placed
3. Use the **Building Palette** on the left to select construction mode

### Building Cities
1. **Select Building Type**: Choose from the palette categories
2. **Place Buildings**: Click anywhere on the map to place buildings
3. **Edit Properties**: Click existing buildings to customize them
4. **Manage Layout**: Use demolish mode to remove unwanted buildings

### Professional Workflow
1. **Plan Zones**: Enable zoning visualization to plan land use
2. **Build Infrastructure**: Place civic buildings and utilities first
3. **Add Residential**: Create housing based on expected population
4. **Commercial Development**: Add shops and offices for economic activity
5. **Industrial Areas**: Place manufacturing away from residential zones
6. **Export Documentation**: Generate reports and 3D models for stakeholders

## 🔧 Technical Implementation

### Modern Web Technologies
- **Three.js**: Advanced 3D rendering and interaction
- **React Three Fiber**: Declarative 3D scene management
- **Interactive Raycasting**: Precise building placement and selection
- **Real-time Updates**: Immediate visual feedback for all actions

### Building System Architecture
```
Building Template Library
├── 16 Pre-configured Building Types
├── Intelligent Requirements System
├── Cost and Population Requirements
└── Architectural Detail Generation

Interactive Placement System
├── Ground Plane Raycasting
├── Grid-based Snap System  
├── Preview Rendering
└── Collision Detection

Property Management
├── Real-time Editing Interface
├── Type-specific Attributes
├── Visual Property Updates
└── Export Data Generation
```

### Data Integration
- **NASA/ESA Data**: Environmental sensors visualized as 3D spheres
- **Building Heights**: Optional data-driven height influences
- **Real-time Updates**: Sensor data updates reflected in visualization

## 🎯 Comparison: Procedural vs Manual

| Feature | Old (Procedural) | New (Manual) |
|---------|------------------|--------------|
| **Building Placement** | Automatic generation | User-controlled placement |
| **City Design** | Algorithm-based | User creativity & planning |
| **Building Types** | 4 basic types | 16 detailed templates |
| **Customization** | Limited | Full property editing |
| **Urban Planning** | Static zones | Interactive tools |
| **User Experience** | Passive viewing | Active city building |
| **Professional Use** | Data visualization | Complete planning toolkit |

## 🌟 Advanced Features

### Building Intelligence
- **Requirements System**: Some buildings need minimum population or water access
- **Cost Management**: Each building has realistic construction costs
- **Architectural Details**: Automatic generation of windows, balconies, antennas
- **Type-specific Elements**: Commercial signs, industrial chimneys, port cranes

### Urban Statistics
- **Real-time Metrics**: Building counts by type
- **Population Tracking**: Residential unit counts
- **Economic Value**: Total development value
- **Zoning Analysis**: Land use distribution

### Export Capabilities
- **Professional Reports**: Markdown format with planning insights
- **3D Model Data**: Complete building metadata for external tools
- **Screenshot Documentation**: High-quality images for presentations

## 🚀 Future Enhancements

### Planned Features
- **Road Building Tools**: Manual street placement and editing
- **Utility Networks**: Water, power, and data infrastructure
- **Transportation**: Bus routes, metro lines, ports connections
- **Economic Simulation**: Population growth and economic modeling
- **Import/Export**: Support for standard urban planning file formats

### Integration Possibilities
- **BIM Integration**: Import/export with architectural software
- **GIS Compatibility**: Integration with ArcGIS and QGIS
- **VR/AR Support**: Immersive city planning experiences
- **Multi-user Collaboration**: Real-time collaborative planning

## 📚 Learning Resources

### Urban Planning Concepts
- **Zoning Theory**: Mixed-use development principles
- **Transportation Planning**: Street network design
- **Environmental Impact**: Sustainable urban development
- **Economic Development**: Balancing residential, commercial, and industrial

### Technical Documentation
- **API Reference**: Building template and property specifications
- **Export Formats**: Complete data structure documentation
- **Integration Guide**: Connecting with external urban planning tools

---

*The City Engine represents the future of web-based urban planning, combining the accessibility of browser technology with the sophistication of professional planning software.*