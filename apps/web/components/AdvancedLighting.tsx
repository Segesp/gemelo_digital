import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, useHelper } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, SSAO, DepthOfField } from '@react-three/postprocessing';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useViewSettings } from '../utils/cityEngineStore';

// Advanced lighting system with time of day
export function AdvancedLighting() {
  const { timeOfDay, weather, season } = useViewSettings();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  
  // useHelper(sunRef, THREE.DirectionalLightHelper, 5, 'orange');
  
  // Calculate sun position based on time of day
  const sunPosition = useMemo(() => {
    const hour = timeOfDay;
    const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2; // -90° to 270°
    const height = Math.sin(angle) * 100;
    const distance = Math.cos(angle) * 100;
    return new THREE.Vector3(distance, Math.max(height, -20), 50);
  }, [timeOfDay]);
  
  // Calculate lighting colors based on time and weather
  const lightingConfig = useMemo(() => {
    const hour = timeOfDay;
    const isDay = hour >= 6 && hour <= 18;
    const isDawn = hour >= 5 && hour <= 7;
    const isDusk = hour >= 17 && hour <= 19;
    const isNight = hour < 6 || hour > 18;
    
    let sunColor = new THREE.Color();
    let skyColor = new THREE.Color();
    let ambientColor = new THREE.Color();
    let sunIntensity = 0;
    let ambientIntensity = 0;
    
    if (isDawn) {
      // Dawn colors
      sunColor.setHex(0xffa500); // Orange
      skyColor.setHex(0x87ceeb); // Sky blue
      ambientColor.setHex(0x404040);
      sunIntensity = 0.8;
      ambientIntensity = 0.3;
    } else if (isDay) {
      // Day colors
      sunColor.setHex(0xffffff); // White
      skyColor.setHex(0x87ceeb); // Sky blue
      ambientColor.setHex(0x404040);
      sunIntensity = 1.2;
      ambientIntensity = 0.4;
    } else if (isDusk) {
      // Dusk colors
      sunColor.setHex(0xff6b35); // Orange-red
      skyColor.setHex(0x191970); // Midnight blue
      ambientColor.setHex(0x2f2f2f);
      sunIntensity = 0.6;
      ambientIntensity = 0.25;
    } else {
      // Night colors
      sunColor.setHex(0x4169e1); // Moon light (blue)
      skyColor.setHex(0x000011); // Dark blue
      ambientColor.setHex(0x1a1a1a);
      sunIntensity = 0.3;
      ambientIntensity = 0.1;
    }
    
    // Adjust for weather
    switch (weather) {
      case 'cloudy':
        sunIntensity *= 0.6;
        ambientIntensity *= 1.2;
        skyColor.multiplyScalar(0.8);
        break;
      case 'rain':
        sunIntensity *= 0.3;
        ambientIntensity *= 0.8;
        skyColor.multiplyScalar(0.6);
        ambientColor.multiplyScalar(0.7);
        break;
      case 'fog':
        sunIntensity *= 0.4;
        ambientIntensity *= 1.5;
        skyColor.multiplyScalar(0.9);
        break;
      case 'snow':
        sunIntensity *= 0.7;
        ambientIntensity *= 1.3;
        skyColor = skyColor.lerp(new THREE.Color(0xffffff), 0.3);
        break;
    }
    
    // Adjust for season
    switch (season) {
      case 'winter':
        skyColor = skyColor.lerp(new THREE.Color(0xe6e6fa), 0.2);
        sunIntensity *= 0.8;
        break;
      case 'autumn':
        sunColor = sunColor.lerp(new THREE.Color(0xffa500), 0.1);
        skyColor = skyColor.lerp(new THREE.Color(0xdaa520), 0.05);
        break;
      case 'spring':
        skyColor = skyColor.lerp(new THREE.Color(0x98fb98), 0.05);
        break;
    }
    
    return {
      sunColor,
      skyColor,
      ambientColor,
      sunIntensity,
      ambientIntensity,
      isNight
    };
  }, [timeOfDay, weather, season]);
  
  // Update lighting every frame
  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.position.copy(sunPosition);
      sunRef.current.color.copy(lightingConfig.sunColor);
      sunRef.current.intensity = lightingConfig.sunIntensity;
      
      // Update shadow camera
      sunRef.current.shadow.camera.left = -200;
      sunRef.current.shadow.camera.right = 200;
      sunRef.current.shadow.camera.top = 200;
      sunRef.current.shadow.camera.bottom = -200;
      sunRef.current.shadow.camera.near = 0.1;
      sunRef.current.shadow.camera.far = 500;
      sunRef.current.shadow.mapSize.setScalar(2048);
    }
    
    if (ambientRef.current) {
      ambientRef.current.color.copy(lightingConfig.ambientColor);
      ambientRef.current.intensity = lightingConfig.ambientIntensity;
    }
  });
  
  return (
    <>
      {/* Sun/Moon Light */}
      <directionalLight
        ref={sunRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      
      {/* Ambient Light */}
      <ambientLight ref={ambientRef} />
      
      {/* Additional city lights for night time */}
      {lightingConfig.isNight && (
        <group>
          <pointLight
            position={[0, 10, 0]}
            intensity={0.5}
            color="#ffdd88"
            distance={100}
          />
          <pointLight
            position={[50, 8, 50]}
            intensity={0.3}
            color="#ffdd88"
            distance={80}
          />
          <pointLight
            position={[-50, 8, -50]}
            intensity={0.3}
            color="#ffdd88"
            distance={80}
          />
        </group>
      )}
      
      {/* Environment */}
      <Environment preset={getEnvironmentPreset(timeOfDay, weather)} />
      
      {/* Contact shadows for better ground interaction */}
      <ContactShadows
        opacity={0.4}
        scale={100}
        blur={1}
        far={10}
        resolution={256}
        color="#000000"
      />
    </>
  );
}

// Get appropriate environment preset
function getEnvironmentPreset(timeOfDay: number, weather: string): string {
  const hour = timeOfDay;
  
  if (weather === 'rain' || weather === 'fog') {
    return 'dawn';
  }
  
  if (hour >= 6 && hour <= 8) return 'dawn';
  if (hour >= 9 && hour <= 16) return 'park';
  if (hour >= 17 && hour <= 19) return 'sunset';
  return 'night';
}

// Advanced post-processing effects
export function AdvancedPostProcessing() {
  const { quality, timeOfDay, weather } = useViewSettings();
  
  const bloomIntensity = useMemo(() => {
    const hour = timeOfDay;
    const isNight = hour < 6 || hour > 18;
    let intensity = isNight ? 0.5 : 0.1;
    
    if (weather === 'fog') intensity *= 1.5;
    if (weather === 'rain') intensity *= 0.7;
    
    return intensity;
  }, [timeOfDay, weather]);
  
  // Skip post-processing on low quality
  if (quality === 'low') return null;
  }, [timeOfDay, weather]);
  
  return (
    <EffectComposer>
      {/* Bloom for lighting effects */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
        height={300}
      />
      
      {/* Tone mapping for realistic colors */}
      <ToneMapping adaptive={true} resolution={256} />
      
      {/* SSAO for better depth perception (medium+ quality) */}
      {quality !== 'low' && quality !== 'medium' && (
        <SSAO
          samples={31}
          radius={20}
          intensity={1}
          luminanceInfluence={0.6}
          color="black"
        />
      )}
      
      {/* Depth of field for cinematic effect (high+ quality) */}
      {(quality === 'high' || quality === 'ultra') && (
        <DepthOfField
          focusDistance={0.1}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
      )}
    </EffectComposer>
  );
}

// Weather effects
export function WeatherEffects() {
  const { weather, season } = useViewSettings();
  const { scene } = useThree();
  const rainRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);
  
  // Rain effect
  const rainGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    for (let i = 0; i < 1000; i++) {
      vertices.push(
        Math.random() * 200 - 100, // x
        Math.random() * 50 + 50,   // y
        Math.random() * 200 - 100  // z
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, []);
  
  const rainMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });
  }, []);
  
  // Snow effect
  const snowGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    for (let i = 0; i < 500; i++) {
      vertices.push(
        Math.random() * 200 - 100, // x
        Math.random() * 50 + 50,   // y
        Math.random() * 200 - 100  // z
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, []);
  
  const snowMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });
  }, []);
  
  // Animate weather effects
  useFrame((state, delta) => {
    if (weather === 'rain' && rainRef.current) {
      const positions = rainRef.current.geometry.attributes.position;
      
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y -= delta * 20; // Rain fall speed
        
        if (y < 0) {
          y = 50 + Math.random() * 50;
          positions.setX(i, Math.random() * 200 - 100);
          positions.setZ(i, Math.random() * 200 - 100);
        }
        
        positions.setY(i, y);
      }
      
      positions.needsUpdate = true;
    }
    
    if (weather === 'snow' && snowRef.current) {
      const positions = snowRef.current.geometry.attributes.position;
      
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        let x = positions.getX(i);
        let z = positions.getZ(i);
        
        y -= delta * 5; // Snow fall speed (slower than rain)
        x += Math.sin(state.clock.elapsedTime + i) * 0.1; // Drift
        z += Math.cos(state.clock.elapsedTime + i) * 0.1;
        
        if (y < 0) {
          y = 50 + Math.random() * 50;
          x = Math.random() * 200 - 100;
          z = Math.random() * 200 - 100;
        }
        
        positions.setX(i, x);
        positions.setY(i, y);
        positions.setZ(i, z);
      }
      
      positions.needsUpdate = true;
    }
  });
  
  return (
    <group>
      {/* Rain */}
      {weather === 'rain' && (
        <points
          ref={rainRef}
          geometry={rainGeometry}
          material={rainMaterial}
        />
      )}
      
      {/* Snow */}
      {weather === 'snow' && (
        <points
          ref={snowRef}
          geometry={snowGeometry}
          material={snowMaterial}
        />
      )}
      
      {/* Fog */}
      {weather === 'fog' && (
        <fog attach="fog" args={['#cccccc', 10, 100]} />
      )}
    </group>
  );
}

// Dynamic skybox
export function DynamicSkybox() {
  const { timeOfDay, weather, season } = useViewSettings();
  const { scene } = useThree();
  
  useEffect(() => {
    const loader = new THREE.CubeTextureLoader();
    
    // Generate skybox based on time and weather
    const getSkyboxPath = () => {
      const hour = timeOfDay;
      let timePrefix = '';
      
      if (hour >= 6 && hour <= 8) timePrefix = 'dawn';
      else if (hour >= 9 && hour <= 16) timePrefix = 'day';
      else if (hour >= 17 && hour <= 19) timePrefix = 'sunset';
      else timePrefix = 'night';
      
      // For now, we'll use procedural colors instead of loading textures
      const getSkyColor = () => {
        switch (timePrefix) {
          case 'dawn': return new THREE.Color(0xff6b35);
          case 'day': return new THREE.Color(0x87ceeb);
          case 'sunset': return new THREE.Color(0xff4500);
          case 'night': return new THREE.Color(0x191970);
          default: return new THREE.Color(0x87ceeb);
        }
      };
      
      // Create procedural skybox
      const color = getSkyColor();
      
      if (weather === 'cloudy') color.multiplyScalar(0.8);
      if (weather === 'rain') color.multiplyScalar(0.6);
      if (weather === 'fog') color.multiplyScalar(0.9);
      
      scene.background = color;
    };
    
    getSkyboxPath();
  }, [timeOfDay, weather, season, scene]);
  
  return null;
}