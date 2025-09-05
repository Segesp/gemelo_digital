"use client";
import { useState } from 'react';

// AR Preview System for mobile and web AR
export function ARPreviewSystem() {
  const [isARActive, setIsARActive] = useState(false);
  const [arMode, setARMode] = useState<'preview' | 'measure' | 'annotate'>('preview');

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '20px',
      zIndex: 1000
    }}>
      <button
        onClick={() => setIsARActive(!isARActive)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
        }}
      >
        📱
      </button>
      
      {isARActive && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          background: 'rgba(0,0,0,0.9)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '12px',
          width: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            📱 Modo AR Disponible
          </div>
          <div style={{ marginBottom: '10px' }}>
            • Vista previa de construcciones
          </div>
          <div style={{ marginBottom: '10px' }}>
            • Medición de distancias
          </div>
          <div>
            • Anotaciones espaciales
          </div>
        </div>
      )}
    </div>
  );
}