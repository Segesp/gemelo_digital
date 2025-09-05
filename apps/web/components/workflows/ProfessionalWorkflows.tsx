"use client";
import { useState } from 'react';

// Professional Workflows - Project management and compliance
export function ProfessionalWorkflows() {
  const [activeWorkflow, setActiveWorkflow] = useState<'planning' | 'approval' | 'construction' | 'maintenance'>('planning');
  const [workflows] = useState([
    {
      id: 'planning',
      name: 'Planificación Urbana',
      stages: ['Análisis', 'Diseño', 'Validación', 'Aprobación'],
      currentStage: 2,
      progress: 65
    },
    {
      id: 'approval',
      name: 'Proceso de Aprobación',
      stages: ['Documentación', 'Revisión', 'Correcciones', 'Aprobación Final'],
      currentStage: 1,
      progress: 25
    }
  ]);

  return (
    <div style={{
      position: 'fixed',
      top: '140px',
      right: '20px',
      width: '300px',
      background: 'rgba(0,0,0,0.9)',
      borderRadius: '10px',
      padding: '20px',
      color: 'white',
      fontSize: '12px',
      zIndex: 999
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>
        📋 Flujos de Trabajo
      </div>

      {workflows.map(workflow => (
        <div key={workflow.id} style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {workflow.name}
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            height: '4px',
            marginBottom: '8px'
          }}>
            <div style={{
              background: '#4ade80',
              height: '100%',
              borderRadius: '10px',
              width: `${workflow.progress}%`
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            opacity: 0.8
          }}>
            <span>Etapa {workflow.currentStage}/{workflow.stages.length}</span>
            <span>{workflow.progress}% completado</span>
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(102,126,234,0.1)',
        borderRadius: '6px',
        fontSize: '11px',
        border: '1px solid rgba(102,126,234,0.2)'
      }}>
        🎯 <strong>Próxima tarea:</strong> Revisión de cumplimiento normativo
      </div>
    </div>
  );
}