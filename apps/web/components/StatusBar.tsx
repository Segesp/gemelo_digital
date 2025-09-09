"use client";
import { useState, useEffect } from 'react';

interface StatusBarProps {
  coordinates?: { lat: number; lng: number };
  scale?: number;
  projection?: string;
  selectedFeatures?: number;
  totalFeatures?: number;
  systemStatus?: 'operational' | 'warning' | 'error';
  lastUpdate?: Date;
}

export function StatusBar({
  coordinates = { lat: -11.084, lng: -77.608 },
  scale = 10000,
  projection = 'WGS84',
  selectedFeatures = 0,
  totalFeatures = 0,
  systemStatus = 'operational',
  lastUpdate = new Date()
}: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
  };

  const formatScale = (scale: number) => {
    if (scale >= 1000000) {
      return `1:${(scale / 1000000).toFixed(1)}M`;
    } else if (scale >= 1000) {
      return `1:${(scale / 1000).toFixed(1)}K`;
    }
    return `1:${scale}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '28px',
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
      borderTop: '1px solid #ced4da',
      display: 'flex',
      alignItems: 'center',
      fontSize: '12px',
      color: '#495057',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Coordinates */}
      <div style={{
        padding: '0 12px',
        borderRight: '1px solid #ced4da',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: '200px'
      }}>
        <span style={{ color: '#6c757d' }}>📍</span>
        <span style={{ fontWeight: '500' }}>
          {formatCoordinates(coordinates.lat, coordinates.lng)}
        </span>
      </div>

      {/* Scale */}
      <div style={{
        padding: '0 12px',
        borderRight: '1px solid #ced4da',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ color: '#6c757d' }}>🔍</span>
        <span>Escala: {formatScale(scale)}</span>
      </div>

      {/* Projection */}
      <div style={{
        padding: '0 12px',
        borderRight: '1px solid #ced4da',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ color: '#6c757d' }}>🌐</span>
        <span>Proyección: {projection}</span>
      </div>

      {/* Selection Info */}
      {selectedFeatures > 0 && (
        <div style={{
          padding: '0 12px',
          borderRight: '1px solid #ced4da',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#e3f2fd',
          color: '#1976d2'
        }}>
          <span>👆</span>
          <span>
            {selectedFeatures} de {totalFeatures} seleccionado{selectedFeatures !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* System Status */}
      <div style={{
        padding: '0 12px',
        borderRight: '1px solid #ced4da',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>{getStatusIcon(systemStatus)}</span>
        <span style={{ color: getStatusColor(systemStatus), fontWeight: '500' }}>
          {systemStatus === 'operational' ? 'Operativo' : 
           systemStatus === 'warning' ? 'Advertencia' : 'Error'}
        </span>
      </div>

      {/* Last Update */}
      <div style={{
        padding: '0 12px',
        borderRight: '1px solid #ced4da',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ color: '#6c757d' }}>🔄</span>
        <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
      </div>

      {/* Current Time */}
      <div style={{
        padding: '0 12px',
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '500'
      }}>
        <span style={{ color: '#6c757d' }}>🕐</span>
        <span>{currentTime.toLocaleTimeString()}</span>
      </div>

      {/* Progress Indicator */}
      <div style={{
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '4px',
          background: '#e9ecef',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '75%',
            height: '100%',
            background: 'linear-gradient(90deg, #007bff, #0056b3)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
}