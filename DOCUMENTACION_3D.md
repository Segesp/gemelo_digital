# Gemelo Digital Chancay - Documentación 3D

## Descripción General

El Gemelo Digital de Chancay ahora incluye funcionalidades 3D completas utilizando las tecnologías más modernas para visualización y análisis de datos geoespaciales. La plataforma permite a planificadores y tomadores de decisiones interactuar con los datos en un entorno inmersivo tridimensional.

## Tecnologías Implementadas

### 1. Three.js + React Three Fiber
- **Propósito**: Motor 3D principal para renderizado y gestión de escenas
- **Características**: 
  - Modelos 3D del puerto de Chancay
  - Iluminación realista y sombras
  - Animaciones fluidas
  - Controles de cámara interactivos

### 2. @react-three/drei
- **Propósito**: Componentes avanzados para Three.js
- **Características**:
  - Controles de órbita
  - Texto 3D
  - Entornos predefinidos
  - Grillas de referencia

### 3. deck.gl
- **Propósito**: Visualización geoespacial de alto rendimiento
- **Características**:
  - Capas de datos 3D
  - Mapas de calor
  - Agregaciones espaciales
  - Renderizado optimizado para grandes datasets

## Modos de Visualización

### 1. Vista 2D (Tradicional)
- **Tecnología**: MapLibre GL
- **Características**:
  - Mapa base cartográfico
  - Capas de datos NASA superpuestas
  - Interacciones de popup
  - Controles de zoom/pan tradicionales

### 2. Vista 3D Escena
- **Tecnología**: Three.js + React Three Fiber
- **Características**:
  - Modelo 3D detallado del puerto de Chancay
  - Visualización de datos como columnas 3D
  - Simulación de océano animada
  - Iluminación atmosférica (amanecer/atardecer)
  - Controles de cámara libre

### 3. Vista 3D Análisis
- **Tecnología**: Three.js con herramientas de análisis
- **Características**:
  - Puntos de datos interactivos
  - Superficies interpoladas
  - Mapas de calor 3D
  - Conexiones temporales
  - Estadísticas en tiempo real
  - Selección y filtrado de datos

### 4. Vista 3D Geoespacial
- **Tecnología**: deck.gl
- **Características**:
  - Capas de columnas 3D
  - Visualizaciones de grilla agregada
  - Mapas de calor avanzados
  - Renderizado de alto rendimiento
  - Múltiples tipos de visualización

### 5. Vista 3D Temporal
- **Tecnología**: Three.js con análisis temporal
- **Características**:
  - Reproducción temporal de datos
  - Trazas de movimiento
  - Superficies interpoladas en tiempo real
  - Controles de reproducción (play/pause/velocidad)
  - Línea de tiempo interactiva
  - Análisis de tendencias temporales

## Componentes Principales

### Scene3D.tsx
```typescript
// Escena 3D principal con modelo del puerto
- ChancayPort3D: Modelo 3D del puerto con estructuras
- DataPoints: Visualización de datos como columnas 3D
- Ocean: Simulación de océano animada
- Iluminación y ambiente realista
```

### Analysis3D.tsx
```typescript
// Herramientas de análisis interactivo 3D
- InteractiveDataPoint: Puntos clickeables con detalles
- ValueSurface: Superficie interpolada de valores
- HeatmapAnalysis: Visualización de mapa de calor 3D
- DataConnections: Conexiones entre puntos de datos
```

### DeckGL3D.tsx
```typescript
// Visualización geoespacial de alto rendimiento
- ColumnLayer: Columnas 3D para valores de datos
- HeatmapLayer: Mapas de calor suaves
- GridLayer: Agregaciones en grilla
- ScatterplotLayer: Puntos dispersos escalables
```

### Temporal3D.tsx
```typescript
// Análisis temporal inmersivo
- TemporalDataPoint: Puntos con animación temporal
- TimelineAxis: Eje de tiempo 3D interactivo
- ValueSurface3D: Superficie que cambia en el tiempo
- Controles de reproducción temporal
```

## Características Técnicas

### Optimización de Rendimiento
1. **Lazy Loading**: Componentes 3D se cargan bajo demanda
2. **LOD (Level of Detail)**: Diferentes niveles de detalle según distancia
3. **Frustum Culling**: Solo renderiza objetos visibles
4. **Instanced Rendering**: Renderizado eficiente de múltiples objetos
5. **Agregación de Datos**: Combina puntos cercanos para reducir complejidad

### Interactividad
1. **Controles de Cámara**: 
   - Rotación orbital
   - Zoom suave
   - Pan en todos los ejes
2. **Selección de Objetos**: Click en elementos para detalles
3. **Tooltips Contextuales**: Información al hacer hover
4. **Controles Temporales**: Navegación en el tiempo

### Datos Soportados
1. **NASA POWER API**: Datos meteorológicos satelitales
2. **MODIS**: Imágenes satelitales de resolución moderada
3. **VIIRS**: Datos de radiometría visible e infrarroja
4. **Sensores IoT Locales**: Datos en tiempo real del puerto
5. **Datos ESA**: Agencia Espacial Europea
6. **Datos Lima**: Fuentes locales de la ciudad

## Flujo de Datos

```
API Backend (FastAPI) 
    ↓
NASA/ESA/Lima Services
    ↓
PostgreSQL + PostGIS
    ↓
React Frontend
    ↓
Componentes 3D (Three.js/deck.gl)
    ↓
Visualización Interactiva
```

## Casos de Uso

### Para Planificadores Urbanos
1. **Análisis Espacial**: Identificar patrones en datos ambientales
2. **Planificación Temporal**: Ver cómo cambian las condiciones en el tiempo
3. **Comparación de Escenarios**: Evaluar diferentes propuestas de desarrollo
4. **Impacto Ambiental**: Analizar efectos de actividades portuarias

### Para Tomadores de Decisiones
1. **Dashboards Ejecutivos**: Métricas clave en vista 3D intuitiva
2. **Presentaciones**: Visualizaciones impactantes para stakeholders
3. **Monitoreo en Tiempo Real**: Seguimiento continuo de condiciones
4. **Análisis Predictivo**: Identificar tendencias y patrones futuros

### Para Operadores Portuarios
1. **Monitoreo Ambiental**: Condiciones meteorológicas y marítimas
2. **Optimización Logística**: Rutas y horarios basados en datos
3. **Mantenimiento Predictivo**: Identificar necesidades de infraestructura
4. **Seguridad Operacional**: Alertas tempranas de condiciones adversas

## Próximas Mejoras

### Funcionalidades Planificadas
1. **Realidad Aumentada**: Integración con dispositivos AR
2. **Inteligencia Artificial**: Análisis predictivo automatizado
3. **Simulaciones**: Modelos físicos de viento, corrientes, etc.
4. **Colaboración**: Herramientas multiusuario en tiempo real
5. **APIs Externas**: Integración con más fuentes de datos

### Optimizaciones Técnicas
1. **WebGL 2.0**: Mejores efectos visuales y rendimiento
2. **Web Workers**: Procesamiento de datos en background
3. **PWA**: Funcionalidad offline
4. **Streaming de Datos**: Carga incremental de datasets grandes
5. **Compression**: Algoritmos de compresión para datos 3D

## Instalación y Desarrollo

### Requisitos
- Node.js 18+
- npm o yarn
- Docker (para servicios backend)

### Comandos Principales
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Construcción
npm run build

# Linting
npm run lint
```

### Dependencias 3D Principales
```json
{
  "three": "^0.155.0",
  "@react-three/fiber": "^8.15.19",
  "@react-three/drei": "^9.88.13",
  "deck.gl": "^8.9.35",
  "@deck.gl/react": "^8.9.35",
  "@deck.gl/layers": "^8.9.35",
  "@deck.gl/aggregation-layers": "^8.9.35"
}
```

## Soporte y Contribución

Para reportar problemas o contribuir:
1. Abrir issue en GitHub
2. Seguir convenciones de código establecidas
3. Incluir tests para nuevas funcionalidades
4. Documentar cambios en README

## Licencia

Este proyecto está bajo licencia MIT. Ver archivo LICENSE para detalles.