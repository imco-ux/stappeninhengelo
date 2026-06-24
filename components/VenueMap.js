'use client';

import { useEffect, useRef } from 'react';

// Leaflet dynamically imported (SSR-safe)
export default function VenueMap({ locaties, hoogte = '400px', onLocatieClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const center = [52.2620, 6.7940];
      const map = L.map(mapRef.current, {
        center,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Donkere kaart tile (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Oranje custom pin SVG
      function maakIcon(naam) {
        return L.divIcon({
          html: `
            <div style="
              background:#F27A00;
              color:#000;
              font-family:'Big Shoulders Display',sans-serif;
              font-weight:900;
              font-size:11px;
              text-transform:uppercase;
              padding:4px 8px;
              border-radius:20px;
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.6);
              border:2px solid #000;
              display:flex;
              align-items:center;
              gap:4px;
            ">
              <span style="width:8px;height:8px;background:#000;border-radius:50%;flex-shrink:0;"></span>
              ${naam}
            </div>`,
          className: '',
          iconAnchor: [0, 0],
        });
      }

      locaties.forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lng], { icon: maakIcon(loc.naam) }).addTo(map);
        marker.on('click', () => {
          if (onLocatieClick) onLocatieClick(loc);
        });

        const popup = L.popup({ className: 'dark-popup', closeButton: false }).setContent(`
          <div style="font-family:sans-serif;min-width:140px;">
            <strong style="font-size:14px;color:#F27A00;">${loc.naam}</strong><br/>
            <span style="font-size:11px;color:#aaa;">${loc.type}</span><br/>
            <span style="font-size:11px;color:#888;">${loc.adres}</span>
          </div>
        `);
        marker.bindPopup(popup);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
      <div ref={mapRef} style={{ height: hoogte, width: '100%' }} />
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 10px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.8);
        }
        .dark-popup .leaflet-popup-tip { background: #1a1a1a; }
        .leaflet-container { background: #111; }
      `}</style>
    </div>
  );
}
