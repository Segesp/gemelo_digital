"use client";
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Home() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const m = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-77.27, -11.57],
        zoom: 12
      });
      mapRef.current = m;
      m.on('load', () => setReady(true));
    }
    return () => mapRef.current?.remove();
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    fetch(`${API}/features/puerto`)
      .then(r => r.json())
      .then(fc => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        if (map.getSource('puerto')) {
          map.removeLayer('puerto-fill');
          map.removeSource('puerto');
        }
        map.addSource('puerto', { type: 'geojson', data: fc });
        map.addLayer({ id: 'puerto-fill', type: 'fill', source: 'puerto', paint: { 'fill-color': '#1d4ed8', 'fill-opacity': 0.3 } });
      })
      .catch(console.error);
  }, [ready]);

  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${API}/analysis/timeseries/harbor_temp/stats?start=` + new Date(Date.now() - 3600*1000).toISOString())
        .then(r => r.json())
        .then(s => setTemp(typeof s.avg === 'number' ? Math.round(s.avg*100)/100 : null))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [ready]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <div style={{padding:'8px',borderBottom:'1px solid #eee',display:'flex',gap:12,alignItems:'center'}}>
        <strong>Gemelo Digital Chancay</strong>
  <span style={{marginLeft:8,color:'#666'}}>Mapa base + capa ejemplo &quot;puerto&quot;</span>
        <span style={{marginLeft:'auto',color:'#0a0'}}>Temp puerto (avg 1h): {temp ?? '...' } °C</span>
      </div>
      <div ref={containerRef} style={{flex:1}} />
    </div>
  );
}
