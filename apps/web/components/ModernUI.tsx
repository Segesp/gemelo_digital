import React, { useState, useCallback, useMemo } from 'react';
import { useCityEngineStore, useViewSettings, useCityMetrics } from '../utils/cityEngineStore';

// Modern UI components for the city engine
export function ModernToolbar() {
  const { selectedTool, setSelectedTool } = useCityEngineStore();
  
  const tools = [
    { id: 'select', name: 'Seleccionar', icon: '🎯', shortcut: 'V' },
    { id: 'build', name: 'Construir', icon: '🏗️', shortcut: 'B' },
    { id: 'road', name: 'Carreteras', icon: '🛣️', shortcut: 'R' },
    { id: 'terrain', name: 'Terreno', icon: '🏔️', shortcut: 'T' },
    { id: 'vegetation', name: 'Vegetación', icon: '🌳', shortcut: 'G' },
    { id: 'measure', name: 'Medir', icon: '📏', shortcut: 'M' },
    { id: 'zone', name: 'Zonificar', icon: '📋', shortcut: 'Z' }
  ];
  
  return (
    <div className="modern-toolbar">
      <div className="toolbar-section">
        <h3>🛠️ Herramientas</h3>
        <div className="tool-grid">
          {tools.map(tool => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={selectedTool === tool.id}
              onClick={() => setSelectedTool(tool.id as any)}
            />
          ))}
        </div>
      </div>
      
      <ViewControls />
      <PerformanceSettings />
      
      <style jsx>{`
        .modern-toolbar {
          position: absolute;
          left: 20px;
          top: 20px;
          width: 300px;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 20px;
          color: white;
          font-family: 'Segoe UI', sans-serif;
          backdrop-filter: blur(10px);
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .toolbar-section {
          margin-bottom: 25px;
        }
        
        .toolbar-section h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }
        
        .tool-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

interface ToolButtonProps {
  tool: {
    id: string;
    name: string;
    icon: string;
    shortcut: string;
  };
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      className={`tool-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={`${tool.name} (${tool.shortcut})`}
    >
      <span className="tool-icon">{tool.icon}</span>
      <span className="tool-name">{tool.name}</span>
      <span className="tool-shortcut">{tool.shortcut}</span>
      
      <style jsx>{`
        .tool-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .tool-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .tool-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
        }
        
        .tool-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .tool-name {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .tool-shortcut {
          font-size: 10px;
          opacity: 0.7;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          position: absolute;
          top: 5px;
          right: 5px;
        }
      `}</style>
    </button>
  );
}

function ViewControls() {
  const { viewSettings, updateViewSettings } = useCityEngineStore();
  
  return (
    <div className="toolbar-section">
      <h3>👁️ Vista</h3>
      
      <div className="control-group">
        <label>Hora del día</label>
        <input
          type="range"
          min="0"
          max="24"
          step="0.5"
          value={viewSettings.timeOfDay}
          onChange={(e) => updateViewSettings({ timeOfDay: parseFloat(e.target.value) })}
          className="slider"
        />
        <span className="value">{viewSettings.timeOfDay.toFixed(1)}h</span>
      </div>
      
      <div className="control-group">
        <label>Clima</label>
        <select
          value={viewSettings.weather}
          onChange={(e) => updateViewSettings({ weather: e.target.value as any })}
          className="select"
        >
          <option value="clear">Despejado</option>
          <option value="cloudy">Nublado</option>
          <option value="rain">Lluvioso</option>
          <option value="snow">Nevoso</option>
          <option value="fog">Niebla</option>
        </select>
      </div>
      
      <div className="control-group">
        <label>Estación</label>
        <select
          value={viewSettings.season}
          onChange={(e) => updateViewSettings({ season: e.target.value as any })}
          className="select"
        >
          <option value="spring">Primavera</option>
          <option value="summer">Verano</option>
          <option value="autumn">Otoño</option>
          <option value="winter">Invierno</option>
        </select>
      </div>
      
      <div className="toggle-group">
        <ToggleButton
          label="Tráfico"
          checked={viewSettings.showTraffic}
          onChange={(checked) => updateViewSettings({ showTraffic: checked })}
        />
        <ToggleButton
          label="Servicios"
          checked={viewSettings.showUtilities}
          onChange={(checked) => updateViewSettings({ showUtilities: checked })}
        />
        <ToggleButton
          label="Zonas"
          checked={viewSettings.showZones}
          onChange={(checked) => updateViewSettings({ showZones: checked })}
        />
        <ToggleButton
          label="Métricas"
          checked={viewSettings.showMetrics}
          onChange={(checked) => updateViewSettings({ showMetrics: checked })}
        />
      </div>
      
      <style jsx>{`
        .control-group {
          margin-bottom: 15px;
        }
        
        .control-group label {
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
          opacity: 0.9;
        }
        
        .slider {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          outline: none;
          margin-bottom: 5px;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        
        .select {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 12px;
        }
        
        .select option {
          background: #333;
          color: white;
        }
        
        .value {
          font-size: 12px;
          color: #667eea;
          font-weight: 600;
        }
        
        .toggle-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleButton({ label, checked, onChange }: ToggleButtonProps) {
  return (
    <button
      className={`toggle-button ${checked ? 'checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-indicator"></span>
      <span className="toggle-label">{label}</span>
      
      <style jsx>{`
        .toggle-button {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 11px;
        }
        
        .toggle-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .toggle-button.checked {
          background: rgba(102, 126, 234, 0.3);
          border-color: #667eea;
        }
        
        .toggle-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${checked ? '#667eea' : 'rgba(255, 255, 255, 0.5)'};
          margin-right: 6px;
          transition: background 0.2s ease;
        }
        
        .toggle-label {
          flex: 1;
        }
      `}</style>
    </button>
  );
}

function PerformanceSettings() {
  const { viewSettings, updateViewSettings } = useCityEngineStore();
  
  return (
    <div className="toolbar-section">
      <h3>⚡ Rendimiento</h3>
      
      <div className="control-group">
        <label>Calidad</label>
        <select
          value={viewSettings.quality}
          onChange={(e) => updateViewSettings({ quality: e.target.value as any })}
          className="select"
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>
      
      <div className="control-group">
        <label>Modo Cámara</label>
        <select
          value={viewSettings.cameraMode}
          onChange={(e) => updateViewSettings({ cameraMode: e.target.value as any })}
          className="select"
        >
          <option value="orbit">Orbital</option>
          <option value="flythrough">Vuelo</option>
          <option value="first_person">Primera Persona</option>
        </select>
      </div>
      
      <style jsx>{`
        .control-group {
          margin-bottom: 15px;
        }
        
        .control-group label {
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
          opacity: 0.9;
        }
        
        .select {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 12px;
        }
        
        .select option {
          background: #333;
          color: white;
        }
      `}</style>
    </div>
  );
}

// City metrics dashboard
export function CityMetricsDashboard() {
  const cityMetrics = useCityMetrics();
  const viewSettings = useViewSettings();
  
  if (!viewSettings.showMetrics) return null;
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };
  
  const formatCurrency = (num: number) => {
    return `$${formatNumber(num)}`;
  };
  
  return (
    <div className="metrics-dashboard">
      <h3>📊 Métricas de la Ciudad</h3>
      
      <div className="metrics-grid">
        <MetricCard
          icon="👥"
          label="Población"
          value={formatNumber(cityMetrics.population)}
          color="#4ade80"
        />
        <MetricCard
          icon="💼"
          label="Empleo"
          value={`${((cityMetrics.employment / Math.max(cityMetrics.population, 1)) * 100).toFixed(1)}%`}
          color="#3b82f6"
        />
        <MetricCard
          icon="💰"
          label="Presupuesto"
          value={formatCurrency(cityMetrics.budget)}
          color={cityMetrics.budget > 0 ? "#10b981" : "#ef4444"}
        />
        <MetricCard
          icon="🏭"
          label="Contaminación"
          value={`${cityMetrics.pollution.toFixed(1)}%`}
          color={cityMetrics.pollution > 50 ? "#ef4444" : "#10b981"}
        />
        <MetricCard
          icon="😊"
          label="Felicidad"
          value={`${cityMetrics.happiness.toFixed(1)}%`}
          color="#f59e0b"
        />
        <MetricCard
          icon="🚗"
          label="Tráfico"
          value={`${cityMetrics.traffic.toFixed(1)}%`}
          color={cityMetrics.traffic > 70 ? "#ef4444" : "#10b981"}
        />
      </div>
      
      <div className="detailed-metrics">
        <div className="metric-row">
          <span>Ingresos: {formatCurrency(cityMetrics.revenue)}</span>
          <span>Gastos: {formatCurrency(cityMetrics.expenses)}</span>
        </div>
        <div className="metric-row">
          <span>Energía: {formatNumber(cityMetrics.energy)}MW</span>
          <span>Agua: {formatNumber(cityMetrics.water)}L/s</span>
        </div>
      </div>
      
      <style jsx>{`
        .metrics-dashboard {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 320px;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 20px;
          color: white;
          font-family: 'Segoe UI', sans-serif;
          backdrop-filter: blur(10px);
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .metrics-dashboard h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .detailed-metrics {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 15px;
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value" style={{ color }}>{value}</div>
      </div>
      
      <style jsx>{`
        .metric-card {
          display: flex;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        
        .metric-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        
        .metric-icon {
          font-size: 20px;
          margin-right: 10px;
        }
        
        .metric-content {
          flex: 1;
        }
        
        .metric-label {
          font-size: 11px;
          opacity: 0.7;
          margin-bottom: 2px;
        }
        
        .metric-value {
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

// Building palette
export function BuildingPalette() {
  const { selectedTool, selectedBuildingTemplate, setSelectedBuildingTemplate } = useCityEngineStore();
  
  if (selectedTool !== 'build') return null;
  
  const buildingCategories = [
    {
      name: 'Residencial',
      icon: '🏠',
      buildings: [
        { id: 'house', name: 'Casa', icon: '🏠', cost: 150000 },
        { id: 'apartment', name: 'Apartamento', icon: '🏢', cost: 800000 },
        { id: 'mansion', name: 'Mansión', icon: '🏰', cost: 2000000 }
      ]
    },
    {
      name: 'Comercial',
      icon: '🏪',
      buildings: [
        { id: 'shop', name: 'Tienda', icon: '🏪', cost: 120000 },
        { id: 'mall', name: 'Centro Comercial', icon: '🏬', cost: 5000000 },
        { id: 'office', name: 'Oficina', icon: '🏢', cost: 3000000 }
      ]
    },
    {
      name: 'Industrial',
      icon: '🏭',
      buildings: [
        { id: 'factory', name: 'Fábrica', icon: '🏭', cost: 1500000 },
        { id: 'warehouse', name: 'Almacén', icon: '📦', cost: 400000 },
        { id: 'power_plant', name: 'Planta Eléctrica', icon: '⚡', cost: 8000000 }
      ]
    },
    {
      name: 'Cívico',
      icon: '🏛️',
      buildings: [
        { id: 'school', name: 'Escuela', icon: '🏫', cost: 1200000 },
        { id: 'hospital', name: 'Hospital', icon: '🏥', cost: 2000000 },
        { id: 'police', name: 'Policía', icon: '🚔', cost: 800000 }
      ]
    }
  ];
  
  return (
    <div className="building-palette">
      <h3>🏗️ Edificios</h3>
      
      {buildingCategories.map(category => (
        <div key={category.name} className="category">
          <h4>{category.icon} {category.name}</h4>
          <div className="building-grid">
            {category.buildings.map(building => (
              <div
                key={building.id}
                className={`building-item ${selectedBuildingTemplate === building.id ? 'selected' : ''}`}
                onClick={() => setSelectedBuildingTemplate(building.id)}
              >
                <div className="building-icon">{building.icon}</div>
                <div className="building-info">
                  <div className="building-name">{building.name}</div>
                  <div className="building-cost">${(building.cost / 1000).toFixed(0)}K</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        .building-palette {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 400px;
          max-height: 500px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 20px;
          color: white;
          font-family: 'Segoe UI', sans-serif;
          backdrop-filter: blur(10px);
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .building-palette h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
        }
        
        .category {
          margin-bottom: 20px;
        }
        
        .category h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 500;
          opacity: 0.9;
        }
        
        .building-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .building-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .building-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        
        .building-item.selected {
          background: rgba(102, 126, 234, 0.3);
          border-color: #667eea;
          box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
        }
        
        .building-icon {
          font-size: 20px;
          margin-right: 10px;
        }
        
        .building-info {
          flex: 1;
        }
        
        .building-name {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .building-cost {
          font-size: 10px;
          opacity: 0.7;
          color: #10b981;
        }
      `}</style>
    </div>
  );
}