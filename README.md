# 🛰️ Gemelo Digital de Chancay

**Plataforma completa de gemelo digital para análisis y planificación urbana del puerto de Chancay**

Este proyecto implementa un gemelo digital avanzado que integra datos de múltiples fuentes (NASA, ESA, sensores locales) con visualizaciones 3D inmersivas y herramientas de análisis espacial para facilitar la toma de decisiones en planificación urbana y gestión portuaria.

## 🌟 Características Principales

### 🎯 **Visualización Avanzada 3D**
- **Vista 2D**: Mapa tradicional con capas superpuestas usando MapLibre GL
- **Vista 3D Escena**: Modelo 3D detallado del puerto con Three.js y React Three Fiber
- **Vista 3D Análisis**: Herramientas interactivas de análisis con puntos de datos clickeables
- **Vista 3D Geoespacial**: Visualización de alto rendimiento con deck.gl (columnas, mapas de calor, grillas)
- **Vista 3D Temporal**: Análisis temporal inmersivo con reproducción de datos en el tiempo

### 📊 **Integración de Datos Múltiples**
- **NASA POWER API**: Datos meteorológicos satelitales en tiempo real
- **MODIS**: Imágenes satelitales de resolución moderada
- **VIIRS**: Datos de radiometría visible e infrarroja  
- **ESA (Agencia Espacial Europea)**: Datos complementarios satelitales
- **Sensores IoT Locales**: Datos del puerto en tiempo real via MQTT
- **Datos Lima**: Fuentes de información local de la ciudad

### 🔧 **Análisis y Planificación**
- **Análisis Espacial**: Identificación de patrones en datos ambientales
- **Planificación Temporal**: Visualización de cambios de condiciones en el tiempo
- **Estadísticas en Tiempo Real**: Métricas agregadas (promedio, min, max, desviación estándar)
- **Interpolación de Superficies**: Mapas de calor 3D para análisis de tendencias
- **Herramientas Interactivas**: Selección y filtrado de datos geoespaciales

### 🏗️ **Arquitectura de Microservicios**
- **Frontend Web**: Next.js con múltiples modos de visualización 3D
- **API Backend**: FastAPI con endpoints para análisis geoespacial
- **Base de Datos**: PostgreSQL + PostGIS + TimescaleDB para datos espaciotemporales
- **Servicios de Datos**: Ingesta automática desde NASA, ESA y fuentes locales
- **MQTT**: Comunicación en tiempo real para sensores IoT
- **Servicios Geoespaciales**: pg_tileserv y pg_featureserv para MVT y GeoJSON

## 🚀 Puesta en Marcha Rápida

### Requisitos Previos
- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- 4GB RAM mínimo recomendado

### 1. Instalación Completa
```bash
# Clonar el repositorio
git clone https://github.com/Segesp/gemelo_digital.git
cd gemelo_digital

# Construir y levantar todos los servicios
docker compose up -d --build
```

### 2. Verificación de Servicios
Después de unos minutos, verifica que todos los servicios estén funcionando:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Aplicación Web** | http://localhost:3000 | Interfaz principal con visualizaciones 3D |
| **API Backend** | http://localhost:8000/health | API REST con documentación automática |
| **API Docs** | http://localhost:8000/docs | Documentación interactiva de la API |
| **pg_featureserv** | http://localhost:9000 | Servicio de features GeoJSON |
| **pg_tileserv** | http://localhost:7800 | Servicio de teselas vectoriales MVT |
| **Adminer DB** | http://localhost:8080 | Administrador de base de datos |

**Credenciales de Base de Datos:**
- Servidor: `db`
- Usuario: `postgres` 
- Contraseña: `postgres`
- Base de datos: `gemelo`

### 3. Datos Iniciales
La aplicación se inicializa automáticamente con:
- ✅ Extensiones PostGIS y TimescaleDB habilitadas
- ✅ Esquemas de base de datos para features y series temporales
- ✅ Capa de ejemplo del puerto en `gd.features`
- ✅ Datos sintéticos publicados via MQTT hacia `gd.timeseries`
- ✅ Integración automática de datos NASA (se actualiza cada hora)

## 🛠️ Desarrollo Local

### Configuración del Frontend
```bash
cd apps/web
npm install
npm run dev
# Aplicación disponible en http://localhost:3000
```

### Configuración del Backend
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
# API disponible en http://localhost:8000
```

### Variables de Entorno
```bash
# Backend
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/gemelo
MQTT_URL=mqtt://localhost:1883

# Frontend  
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## 📱 Modos de Visualización

### 🗺️ Vista 2D (Tradicional)
- Mapa base cartográfico con MapLibre GL
- Capas de datos NASA superpuestas como círculos coloreados
- Popups interactivos con información detallada
- Controles de zoom y panorámica tradicionales
- Ideal para: Análisis general y orientación geográfica

### 🏗️ Vista 3D Escena
- Modelo 3D detallado del puerto de Chancay
- Columnas 3D representando valores de datos
- Simulación de océano animada
- Iluminación atmosférica realista
- Controles de cámara libre (rotación, zoom, pan)
- Ideal para: Presentaciones y visualización inmersiva

### 📊 Vista 3D Análisis  
- Puntos de datos interactivos y clickeables
- Superficies interpoladas para análisis de tendencias
- Mapas de calor 3D con gradientes de color
- Conexiones entre puntos de datos relacionados
- Estadísticas en tiempo real mostradas en HUD
- Ideal para: Análisis detallado y exploración de datos

### 🌍 Vista 3D Geoespacial (deck.gl)
- Renderizado de alto rendimiento para grandes datasets
- Capas de columnas 3D escalables
- Mapas de calor suaves y agregaciones en grilla
- Múltiples tipos de visualización combinables
- Optimización automática de nivel de detalle (LOD)
- Ideal para: Análisis de grandes volúmenes de datos

### ⏰ Vista 3D Temporal
- Reproducción temporal de datos con controles de tiempo
- Trazas de movimiento y evolución de variables
- Superficies que cambian dinámicamente en el tiempo
- Línea de tiempo interactiva con play/pause/velocidad
- Análisis de tendencias temporales
- Ideal para: Estudio de evolución temporal y patrones

## 🔌 API Endpoints Principales

### Datos NASA
```http
GET /nasa/datasets                              # Lista datasets disponibles
GET /nasa/data/{dataset}/{parameter}            # Obtener datos específicos
GET /nasa/analysis/spatial-average/{dataset}    # Análisis espacial agregado
```

### Análisis Geoespacial
```http
GET /analysis/timeseries/{sensor_id}/stats      # Estadísticas de series temporales
POST /analysis/intersect                        # Análisis de intersección espacial
GET /features/{layer}                           # Obtener features por capa
```

### Gestión de Datos
```http
POST /features                                  # Crear nueva feature
POST /timeseries                               # Insertar datos de serie temporal
GET /layers                                    # Listar capas disponibles
```

## 🎛️ Panel de Control

### Controles Principales
- **Selector de Dataset**: Cambiar entre fuentes de datos NASA, MODIS, VIIRS
- **Selector de Parámetros**: Elegir variables específicas (temperatura, humedad, etc.)
- **Modo de Vista**: Alternar entre los 5 modos de visualización
- **Filtros Temporales**: Ajustar rango de tiempo para análisis
- **Controles de Capa**: Mostrar/ocultar diferentes tipos de datos

### Información en Tiempo Real
- 🌡️ **Temperatura del Puerto**: Actualizada cada 3 segundos
- 📊 **Análisis Espacial**: Estadísticas agregadas de últimas 24 horas
- 🔄 **Estado de Actualización**: Indicadores de última sincronización de datos
- 📍 **Punto Seleccionado**: Detalles del elemento actualmente seleccionado

## 🏛️ Casos de Uso

### Para Planificadores Urbanos
- 🎯 **Análisis de Impacto Ambiental**: Evaluar efectos de desarrollos portuarios
- 📈 **Planificación Temporal**: Visualizar cambios de condiciones ambientales
- 🔍 **Identificación de Patrones**: Detectar tendencias en datos multimodales
- 📋 **Comparación de Escenarios**: Evaluar diferentes propuestas de desarrollo

### Para Tomadores de Decisiones
- 📊 **Dashboards Ejecutivos**: Métricas clave en vista 3D intuitiva
- 🎭 **Presentaciones Impactantes**: Visualizaciones para stakeholders
- ⚡ **Monitoreo en Tiempo Real**: Seguimiento continuo de condiciones
- 🔮 **Análisis Predictivo**: Identificación de tendencias futuras

### Para Operadores Portuarios
- 🌤️ **Monitoreo Meteorológico**: Condiciones atmosféricas y marítimas
- 🚛 **Optimización Logística**: Rutas y horarios basados en datos
- 🔧 **Mantenimiento Predictivo**: Identificar necesidades de infraestructura
- ⚠️ **Seguridad Operacional**: Alertas tempranas de condiciones adversas

## 🔧 Arquitectura Técnica

### Stack Tecnológico
```
Frontend:
├── Next.js 14.2.7 (React Framework)
├── Three.js 0.180.0 (Gráficos 3D)
├── React Three Fiber 8.15.19 (React + Three.js)
├── @react-three/drei 9.88.13 (Componentes 3D)
├── deck.gl 9.1.14 (Visualización Geoespacial)
├── MapLibre GL 5.0.0 (Mapas 2D)
└── TypeScript 5.6.2

Backend:
├── FastAPI (API REST)
├── PostgreSQL + PostGIS (Base de Datos Espacial)
├── TimescaleDB (Series Temporales)
├── asyncpg (Driver Async PostgreSQL)
└── Python 3.11

Servicios:
├── Eclipse Mosquitto (MQTT Broker)
├── pg_tileserv (Servicios de Teselas)
├── pg_featureserv (Servicios de Features)
└── Adminer (Administración DB)
```

### Optimizaciones de Rendimiento
- ⚡ **Lazy Loading**: Componentes 3D cargados bajo demanda
- 🎯 **Level of Detail (LOD)**: Diferentes niveles según distancia de cámara
- 🔍 **Frustum Culling**: Solo renderiza objetos visibles
- 🚀 **Instanced Rendering**: Renderizado eficiente de múltiples objetos
- 📊 **Agregación de Datos**: Combina puntos cercanos automáticamente
- 🧠 **Memoización**: Cache inteligente de cálculos costosos

### Flujo de Datos
```
NASA/ESA APIs → Servicios de Ingesta → PostgreSQL/PostGIS → FastAPI → React Frontend → Componentes 3D
     ↓                                        ↓                         ↓
Sensores IoT → MQTT Broker → Ingest Service → TimescaleDB → WebSockets → Tiempo Real
```

## 📚 Documentación Adicional

- 📖 **[Documentación 3D Completa](DOCUMENTACION_3D.md)**: Detalles técnicos de implementación 3D
- 🔌 **API Docs**: Disponible en http://localhost:8000/docs (cuando los servicios están ejecutándose)
- 🐳 **[Docker Compose](docker-compose.yml)**: Configuración completa de servicios
- 📦 **[Package.json](apps/web/package.json)**: Dependencias del frontend

## 🤝 Contribución

### Reportar Problemas
1. Abrir issue en GitHub con descripción detallada
2. Incluir pasos para reproducir el problema  
3. Adjuntar logs relevantes si es posible

### Contribuir Código
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m "Añadir nueva funcionalidad"`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- **Frontend**: ESLint + Prettier configurados
- **Backend**: Black + isort para formateo Python
- **Commits**: Mensajes descriptivos en español
- **Tests**: Incluir tests para nuevas funcionalidades

## 🛣️ Roadmap

### 🚧 Próximas Funcionalidades
- [ ] **Realidad Aumentada**: Integración con dispositivos AR/VR
- [ ] **Inteligencia Artificial**: Análisis predictivo automatizado con ML
- [ ] **Simulaciones Físicas**: Modelos de viento, corrientes marinas, etc.
- [ ] **Colaboración Multiusuario**: Herramientas de trabajo en equipo tiempo real
- [ ] **APIs Externas Adicionales**: Más fuentes de datos gubernamentales
- [ ] **Móvil PWA**: Aplicación móvil offline-first
- [ ] **Exportación 3D**: Formatos para impresión 3D y CAD

### 🔧 Optimizaciones Técnicas
- [ ] **WebGL 2.0**: Efectos visuales avanzados y mejor rendimiento
- [ ] **Web Workers**: Procesamiento de datos en background
- [ ] **Streaming de Datos**: Carga incremental de datasets muy grandes
- [ ] **Compresión Avanzada**: Algoritmos optimizados para datos 3D
- [ ] **CDN Integration**: Distribución global de contenido estático

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

## 🏢 Desarrollado por

**Segesp** - Soluciones de Gestión Espacial  
Para el desarrollo del Gemelo Digital del Puerto de Chancay

---

**🌟 ¿Te gustó el proyecto? ¡Dale una estrella en GitHub!**