"use client";
import { useState, useEffect, useRef } from 'react';

export interface FeatureData {
  id: string | number;
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
}

interface AttributeTableProps {
  isVisible: boolean;
  onClose: () => void;
  features: FeatureData[];
  layerName: string;
  onFeatureSelect: (featureId: string | number) => void;
  onFeatureUpdate: (featureId: string | number, properties: Record<string, any>) => void;
  onFeatureDelete?: (featureId: string | number) => void;
  editable?: boolean;
}

export function AttributeTable({ 
  isVisible, 
  onClose, 
  features, 
  layerName, 
  onFeatureSelect, 
  onFeatureUpdate,
  onFeatureDelete,
  editable = false
}: AttributeTableProps) {
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string | number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ featureId: string | number; property: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const tableRef = useRef<HTMLDivElement>(null);

  // Get unique property names across all features
  const propertyNames = Array.from(
    new Set(features.flatMap(f => Object.keys(f.properties || {})))
  ).sort();

  // Add geometry info columns
  const allColumns = ['id', 'geometry_type', ...propertyNames];

  // Filter features based on search text
  const filteredFeatures = features.filter(feature => {
    if (!filterText) return true;
    
    const searchText = filterText.toLowerCase();
    return Object.entries(feature.properties || {}).some(([key, value]) => 
      String(value).toLowerCase().includes(searchText)
    ) || String(feature.id).toLowerCase().includes(searchText);
  });

  // Sort features
  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any, bValue: any;
    
    if (sortColumn === 'id') {
      aValue = a.id;
      bValue = b.id;
    } else if (sortColumn === 'geometry_type') {
      aValue = a.geometry.type;
      bValue = b.geometry.type;
    } else {
      aValue = a.properties?.[sortColumn];
      bValue = b.properties?.[sortColumn];
    }
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
    
    // Convert to strings for comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate features
  const totalPages = Math.ceil(sortedFeatures.length / pageSize);
  const paginatedFeatures = sortedFeatures.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Handle column header click for sorting
  const handleColumnHeaderClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle feature selection
  const handleFeatureToggle = (featureId: string | number) => {
    const newSelected = new Set(selectedFeatureIds);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatureIds(newSelected);
    
    // Notify parent component
    onFeatureSelect(featureId);
  };

  // Handle cell editing
  const handleCellDoubleClick = (featureId: string | number, property: string) => {
    if (!editable || property === 'id' || property === 'geometry_type') return;
    
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      setEditingCell({ featureId, property });
      setEditValue(String(feature.properties?.[property] || ''));
    }
  };

  // Save cell edit
  const handleCellSave = () => {
    if (!editingCell) return;
    
    const feature = features.find(f => f.id === editingCell.featureId);
    if (feature) {
      const updatedProperties = {
        ...feature.properties,
        [editingCell.property]: editValue
      };
      onFeatureUpdate(editingCell.featureId, updatedProperties);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  // Cancel cell edit
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle key press in edit mode
  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  // Calculate statistics for numeric columns
  const calculateColumnStats = (property: string) => {
    const values = features
      .map(f => f.properties?.[property])
      .filter(v => v != null && !isNaN(Number(v)))
      .map(Number);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { count: values.length, sum, avg, min, max };
  };

  // Get cell value for display
  const getCellValue = (feature: FeatureData, column: string): string => {
    if (column === 'id') return String(feature.id);
    if (column === 'geometry_type') return feature.geometry.type;
    
    const value = feature.properties?.[column];
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Export data as CSV
  const exportToCSV = () => {
    const headers = allColumns.join(',');
    const rows = sortedFeatures.map(feature => 
      allColumns.map(col => {
        const value = getCellValue(feature, col);
        // Escape CSV values containing commas or quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layerName}_attributes.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      left: '0',
      right: '0',
      height: '300px',
      background: 'white',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            📊 Tabla de Atributos - {layerName}
          </h3>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {filteredFeatures.length} de {features.length} características
          </span>
          {selectedFeatureIds.size > 0 && (
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>
              {selectedFeatureIds.size} seleccionadas
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(0);
            }}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              width: '120px'
            }}
          />
          
          {/* Export button */}
          <button
            onClick={exportToCSV}
            style={{
              padding: '4px 8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Exportar CSV"
          >
            📥 CSV
          </button>
          
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              padding: '4px 8px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Table container */}
      <div 
        ref={tableRef}
        style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #e5e7eb'
        }}
      >
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px'
        }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f3f4f6', zIndex: 1 }}>
            <tr>
              <th style={{
                padding: '6px 8px',
                border: '1px solid #e5e7eb',
                background: '#f3f4f6',
                minWidth: '30px',
                maxWidth: '30px'
              }}>
                #
              </th>
              {allColumns.map(column => (
                <th 
                  key={column}
                  onClick={() => handleColumnHeaderClick(column)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    background: '#f3f4f6',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '80px',
                    position: 'relative',
                    fontWeight: '600'
                  }}
                  title={`Ordenar por ${column}`}
                >
                  {column}
                  {sortColumn === column && (
                    <span style={{ marginLeft: '4px' }}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedFeatures.map((feature, index) => (
              <tr 
                key={feature.id}
                style={{
                  background: selectedFeatureIds.has(feature.id) ? '#eff6ff' : 
                             index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}
              >
                <td style={{
                  padding: '4px 8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatureIds.has(feature.id)}
                    onChange={() => handleFeatureToggle(feature.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                {allColumns.map(column => {
                  const isEditing = editingCell?.featureId === feature.id && editingCell?.property === column;
                  const value = getCellValue(feature, column);
                  
                  return (
                    <td 
                      key={column}
                      onDoubleClick={() => handleCellDoubleClick(feature.id, column)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        cursor: editable && column !== 'id' && column !== 'geometry_type' ? 'pointer' : 'default',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={value}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleEditKeyPress}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '1px solid #3b82f6',
                            borderRadius: '2px',
                            padding: '2px 4px',
                            fontSize: '11px'
                          }}
                        />
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination and statistics */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              style={{
                padding: '2px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '2px',
                background: currentPage === 0 ? '#f3f4f6' : 'white',
                cursor: currentPage === 0 ? 'default' : 'pointer',
                fontSize: '10px'
              }}
            >
              ←
            </button>
            <span>
              Página {currentPage + 1} de {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: '2px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '2px',
                background: currentPage >= totalPages - 1 ? '#f3f4f6' : 'white',
                cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer',
                fontSize: '10px'
              }}
            >
              →
            </button>
          </div>
          
          {/* Selection actions */}
          {selectedFeatureIds.size > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSelectedFeatureIds(new Set())}
                style={{
                  padding: '2px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '2px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Deseleccionar todo
              </button>
              {onFeatureDelete && (
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar ${selectedFeatureIds.size} característica(s)?`)) {
                      selectedFeatureIds.forEach(id => onFeatureDelete(id));
                      setSelectedFeatureIds(new Set());
                    }
                  }}
                  style={{
                    padding: '2px 6px',
                    border: '1px solid #dc2626',
                    borderRadius: '2px',
                    background: '#dc2626',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          )}
        </div>
        
        <div style={{ color: '#6b7280' }}>
          {editable && "Doble clic para editar • "}
          Mostrando {paginatedFeatures.length} de {filteredFeatures.length} características
        </div>
      </div>
    </div>
  );
}

export default AttributeTable;