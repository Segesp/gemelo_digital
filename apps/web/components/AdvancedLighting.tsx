// @ts-nocheck
"use client";
import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

// Simplified Advanced Lighting System
export function AdvancedLighting() {
  const sunRef = useRef();
  const ambientRef = useRef();
  const [timeOfDay, setTimeOfDay] = useState(12);
  const [weather, setWeather] = useState('clear');

  useFrame((state) => {
    if (sunRef.current) {
      const time = (timeOfDay / 24) * Math.PI * 2;
      sunRef.current.position.set(
        Math.sin(time) * 100,
        Math.cos(time) * 50 + 30,
        Math.cos(time * 0.5) * 75
      );
      
      const intensity = Math.max(0.2, Math.cos(time - Math.PI / 2));
      sunRef.current.intensity = intensity;
    }
    
    if (ambientRef.current) {
      const baseIntensity = 0.3;
      ambientRef.current.intensity = weather === 'cloudy' ? baseIntensity * 0.7 : baseIntensity;
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
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />
      
      {/* Ambient Light */}
      <ambientLight
        ref={ambientRef}
        color="#87CEEB"
        intensity={0.3}
      />
      
      {/* Fill Lights */}
      <pointLight position={[50, 30, 50]} intensity={0.5} color="#FFF8DC" />
      <pointLight position={[-50, 30, -50]} intensity={0.5} color="#F0F8FF" />
      
      {/* Atmospheric fog */}
      <fog attach="fog" args={['#87CEEB', 100, 500]} />
    </>
  );
}

// Dynamic Skybox Component
export function DynamicSkybox({ weather }) {
  // Simple color background instead of HDR environment
  const backgroundColor = weather === 'clear' ? '#87CEEB' : 
                          weather === 'cloudy' ? '#B0C4DE' :
                          weather === 'rain' ? '#778899' : '#87CEEB';
  
  return (
    <color attach="background" args={[backgroundColor]} />
  );
}

// Weather Effects Component
export function WeatherEffects({ weather }) {
  const particlesRef = useRef();
  
  const particles = useMemo(() => {
    const count = weather === 'rain' ? 1000 : weather === 'snow' ? 500 : 0;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    
    return positions;
  }, [weather]);

  useFrame((state) => {
    if (particlesRef.current && weather === 'rain') {
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 2; // Fall speed
        
        if (positions[i + 1] < 0) {
          positions[i + 1] = 100;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!weather || weather === 'clear') return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={weather === 'rain' ? 0.5 : 1}
        color={weather === 'rain' ? '#4FC3F7' : '#FFFFFF'}
        transparent
        opacity={0.6}
      />
    </points>
  );
}

// Simplified Post Processing Effects
export function AdvancedPostProcessing() {
  return null; // Simplified - no post processing for compatibility
}