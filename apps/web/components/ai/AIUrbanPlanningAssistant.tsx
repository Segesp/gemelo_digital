"use client";
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

// AI Urban Planning Assistant - Innovative Digital Twin Feature
export function AIUrbanPlanningAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'traffic' | 'energy' | 'population' | 'environment' | 'economy'>('traffic');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulate AI analysis
  useEffect(() => {
    const suggestions = {
      traffic: [
        "🚦 Recomiendo agregar un semáforo en la intersección de Main St y Oak Ave para reducir congestión 23%",
        "🛣️ Una rotonda en Center Plaza mejoraría el flujo vehicular en 35%",
        "🚌 Línea de autobús BRT conectando el distrito comercial reduciría tráfico en 18%"
      ],
      energy: [
        "☀️ Instalar paneles solares en edificios gubernamentales generaría 450 kW/h diarios",
        "💡 LED smart lighting en calles principales reduciría consumo energético en 40%",
        "🔋 Red de estaciones de carga eléctrica incentivaría transporte sostenible"
      ],
      population: [
        "🏠 Zona residencial Norte necesita 250 unidades habitacionales para 2025",
        "🏫 Escuela secundaria requerida en Sector Este para 800 estudiantes proyectados",
        "🏥 Centro de salud adicional recomendado para cobertura óptima"
      ],
      environment: [
        "🌳 Corredor verde de 2.5 km mejoraría calidad del aire en 15%",
        "💧 Sistema de captación pluvial reduciría escorrentía en 30%",
        "♻️ Centro de reciclaje centralizado serviría 15,000 residentes"
      ],
      economy: [
        "💼 Distrito de oficinas generaría 1,200 empleos y $15M ingresos anuales",
        "🏪 Centro comercial mixto incrementaría recaudación fiscal en 22%",
        "🏭 Parque industrial tecnológico atraería inversión de $50M"
      ]
    };

    setCurrentSuggestion(suggestions[analysisMode][Math.floor(Math.random() * suggestions[analysisMode].length)]);
  }, [analysisMode]);

  // Generate AI recommendations based on city data
  const generateRecommendations = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const recommendations = [
        {
          id: 1,
          category: 'Infraestructura',
          priority: 'Alta',
          title: 'Optimización de Red Vial',
          description: 'Implementar sistema de semáforos inteligentes con IA',
          impact: '+35% eficiencia tráfico',
          cost: '$2.5M',
          timeframe: '8 meses',
          confidence: 92
        },
        {
          id: 2,
          category: 'Sostenibilidad',
          priority: 'Media',
          title: 'Red de Energía Renovable',
          description: 'Instalación de paneles solares y almacenamiento',
          impact: '+40% energía limpia',
          cost: '$8.2M',
          timeframe: '18 meses',
          confidence: 87
        },
        {
          id: 3,
          category: 'Vivienda',
          priority: 'Alta',
          title: 'Desarrollo Residencial Inteligente',
          description: 'Complejo habitacional con IoT y eficiencia energética',
          impact: '+500 unidades',
          cost: '$25M',
          timeframe: '24 meses',
          confidence: 94
        }
      ];
      
      setAiRecommendations(recommendations);
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      width: isExpanded ? '400px' : '60px',
      height: isExpanded ? '600px' : '60px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* AI Assistant Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          width: '30px',
          height: '30px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        🤖
      </button>

      {isExpanded && (
        <div style={{
          padding: '60px 20px 20px',
          color: 'white',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>
              🧠 Asistente de IA Urbana
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
              Análisis inteligente y recomendaciones
            </p>
          </div>

          {/* Analysis Mode Selector */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {(['traffic', 'energy', 'population', 'environment', 'economy'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setAnalysisMode(mode)}
                  style={{
                    background: analysisMode === mode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '10px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode === 'traffic' && '🚦 Tráfico'}
                  {mode === 'energy' && '⚡ Energía'}
                  {mode === 'population' && '👥 Población'}
                  {mode === 'environment' && '🌱 Ambiente'}
                  {mode === 'economy' && '💰 Economía'}
                </button>
              ))}
            </div>
          </div>

          {/* Current AI Suggestion */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            minHeight: '80px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
              💡 Sugerencia IA:
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
              {currentSuggestion}
            </div>
          </div>

          {/* Generate Recommendations Button */}
          <button
            onClick={generateRecommendations}
            disabled={isAnalyzing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              padding: '10px',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              fontSize: '12px',
              opacity: isAnalyzing ? 0.6 : 1
            }}
          >
            {isAnalyzing ? '🔄 Analizando...' : '🎯 Generar Recomendaciones'}
          </button>

          {/* AI Recommendations List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginTop: '10px'
          }}>
            {aiRecommendations.map(rec => (
              <div
                key={rec.id}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '10px',
                  fontSize: '11px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontWeight: 'bold' }}>{rec.title}</span>
                  <span style={{
                    background: rec.priority === 'Alta' ? '#ff6b6b' : '#ffa726',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px'
                  }}>
                    {rec.priority}
                  </span>
                </div>
                
                <div style={{ marginBottom: '6px', opacity: 0.9 }}>
                  {rec.description}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '10px',
                  opacity: 0.8
                }}>
                  <div>💰 {rec.cost}</div>
                  <div>⏱️ {rec.timeframe}</div>
                  <div>📈 {rec.impact}</div>
                  <div>✅ {rec.confidence}% confianza</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '10px',
            fontSize: '10px',
            opacity: 0.7
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              background: '#4ade80',
              borderRadius: '50%',
              marginRight: '6px',
              animation: 'pulse 2s infinite'
            }} />
            IA Activa - Monitoreando ciudad
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}