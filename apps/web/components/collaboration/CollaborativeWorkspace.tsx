"use client";
import { useState } from 'react';

// Collaborative Workspace for multi-user editing
export function CollaborativeWorkspace() {
  const [activeUsers, setActiveUsers] = useState([
    { id: 1, name: 'Ana García', color: '#4ade80', cursor: [100, 200] },
    { id: 2, name: 'Carlos López', color: '#60a5fa', cursor: [300, 150] },
    { id: 3, name: 'María Silva', color: '#fbbf24', cursor: [250, 300] }
  ]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0,0,0,0.9)',
      padding: '15px',
      borderRadius: '10px',
      color: 'white',
      fontSize: '12px',
      width: '250px',
      zIndex: 1000
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
        👥 Colaboradores Activos
      </div>
      
      {activeUsers.map(user => (
        <div key={user.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '5px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: user.color
          }} />
          <span>{user.name}</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>• Editando</span>
        </div>
      ))}
      
      <div style={{
        marginTop: '10px',
        padding: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '5px',
        fontSize: '10px'
      }}>
        💬 Chat colaborativo disponible
      </div>
    </div>
  );
}