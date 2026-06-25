'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow } from '@react-google-maps/api';
import { berekenOpenStatus } from '@/lib/openingstijden';

const HENGELO_CENTER = { lat: 52.26581668300409, lng: 6.791295405966277 };
const LIBRARIES = ['places'];

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d0d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#282828' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#252525' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d150d' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111111' }] },
  { featureType: 'transit.station', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
];

function gemiddeldePrijs(dranken, drankFilter, globaleFallback) {
  if (!dranken || dranken.length === 0) return null;
  if (drankFilter) {
    const gevonden = dranken.find(d => d.naam === drankFilter);
    return gevonden ? gevonden.prijs : (globaleFallback?.[drankFilter] ?? null);
  }
  // Alle categorieën meetellen — ontbrekende prijzen vervangen door globaal gemiddelde
  const categorieen = Object.keys(globaleFallback || {});
  if (categorieen.length === 0) {
    if (dranken.length === 0) return null;
    return dranken.reduce((s, d) => s + d.prijs, 0) / dranken.length;
  }
  const prijzen = categorieen.map(cat => {
    const eigen = dranken.find(d => d.naam === cat);
    return eigen ? eigen.prijs : (globaleFallback[cat] ?? null);
  }).filter(p => p !== null);
  return prijzen.length > 0 ? prijzen.reduce((a, b) => a + b, 0) / prijzen.length : null;
}

function pinKleur(prijs, gemiddelde, spread) {
  if (prijs === null) return '#F27A00';
  if (prijs <= gemiddelde - spread * 0.2) return '#22c55e';
  if (prijs >= gemiddelde + spread * 0.2) return '#ef4444';
  return '#F27A00';
}

function locSlug(loc) {
  return loc.slug || (loc.naam || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Custom pin als HTML-element via OverlayView — toont logo of eerste letter
function CustomPin({ loc, kleur, isActief, isHover, onClick, onMouseEnter, onMouseLeave, openStatus }) {
  const verhoogd = isActief || isHover;
  return (
    <OverlayView
      position={{ lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'relative',
          width: 48,
          height: 60,
          transform: `translate(-50%, -100%) scale(${verhoogd ? 1.35 : 1})`,
          cursor: 'pointer',
          filter: isActief
            ? 'drop-shadow(0 0 10px rgba(242,122,0,0.9))'
            : isHover
              ? 'drop-shadow(0 0 8px rgba(242,122,0,0.7))'
              : 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
          transition: 'filter 0.15s, transform 0.15s',
          transformOrigin: '50% 100%',
          zIndex: verhoogd ? 10 : 1,
        }}
      >
        {/* Pin SVG vorm */}
        <svg width="48" height="60" viewBox="0 0 48 60" style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}>
          <defs>
            <clipPath id={`circle-clip-${loc.id || loc.naam}`}>
              <circle cx="24" cy="20" r="13" />
            </clipPath>
          </defs>
          {/* Pin lichaam */}
          <path
            d="M24 2C14.1 2 6 10.1 6 20C6 33.8 24 58 24 58C24 58 42 33.8 42 20C42 10.1 33.9 2 24 2Z"
            fill={kleur}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1.5"
          />
          {/* Binnenste cirkel achtergrond */}
          <circle cx="24" cy="20" r="13" fill="rgba(0,0,0,0.28)" />
        </svg>

        {/* Logo of letter in de cirkel */}
        <div style={{
          position: 'absolute',
          top: 7,
          left: 11,
          width: 26,
          height: 26,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {loc.logo_url ? (
            <img
              src={loc.logo_url}
              alt={loc.naam}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              color: 'white',
              fontWeight: 900,
              fontSize: 13,
              fontFamily: 'Arial Black, Arial, sans-serif',
              userSelect: 'none',
              lineHeight: 1,
            }}>
              {(loc.naam || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Open/gesloten indicator dot */}
        {openStatus && (
          <div style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 11,
            height: 11,
            borderRadius: '50%',
            backgroundColor: openStatus.open ? '#4ade80' : '#f87171',
            border: '2px solid #000',
            boxShadow: `0 0 6px 2px ${openStatus.open ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)'}`,
          }} />
        )}
      </div>
    </OverlayView>
  );
}

function HoverTooltip({ loc, mode, prijzenData, drankFilter }) {
  const foto = loc.fotos?.[0] || null;
  const slug = locSlug(loc);
  const openStatus = berekenOpenStatus(loc.openingstijden);

  return (
    <a href={`/locaties/${slug}`} style={{
      position: 'absolute',
      bottom: 72,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 220,
      backgroundColor: '#141414',
      border: '1px solid #333',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      pointerEvents: 'auto',
      cursor: 'pointer',
      fontFamily: 'Work Sans, sans-serif',
      zIndex: 100,
      textDecoration: 'none',
      display: 'block',
    }}>
      {foto && (
        <img src={foto} alt={loc.naam} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 3, fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {loc.naam}
        </p>
        {openStatus && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            backgroundColor: openStatus.open ? 'rgba(22,163,74,0.2)' : 'rgba(127,29,29,0.3)',
            color: openStatus.open ? '#4ade80' : '#f87171',
            marginBottom: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: openStatus.open ? '#4ade80' : '#f87171', display: 'inline-block' }} />
            {openStatus.open ? `Open · sluit ${openStatus.sluitOm}` : 'Gesloten'}
          </span>
        )}
        <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{loc.type}</p>
        {mode === 'prijzen' && prijzenData?.dranken?.length > 0 && (
          <div style={{ marginTop: 6, borderTop: '1px solid #222', paddingTop: 6 }}>
            {(drankFilter ? prijzenData.dranken.filter(d => d.naam === drankFilter) : prijzenData.dranken.slice(0, 3)).map(d => (
              <div key={d.naam} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 2 }}>
                <span>{d.naam}</span>
                <span style={{ fontWeight: 700, color: '#F27A00' }}>€{d.prijs.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Pijltje naar beneden */}
      <div style={{
        position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
        width: 14, height: 7, overflow: 'hidden',
      }}>
        <div style={{
          width: 10, height: 10, backgroundColor: '#333',
          transform: 'rotate(45deg)', margin: '0 auto', marginTop: -5,
        }} />
      </div>
    </a>
  );
}

function InfoPopup({ loc, mode, prijzenData, drankFilter }) {
  const foto = loc.fotos?.[0] || null;
  const slug = locSlug(loc);

  if (mode === 'prijzen') {
    const dranken = prijzenData?.dranken || [];
    const zichtbaar = drankFilter ? dranken.filter(d => d.naam === drankFilter) : dranken;
    return (
      <div style={{ fontFamily: 'Work Sans, sans-serif', minWidth: 200, maxWidth: 240, overflow: 'hidden' }}>
        {foto && (
          <img src={foto} alt={loc.naam} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block', marginBottom: 8, borderRadius: 4 }} />
        )}
        <div style={{ padding: '0 2px' }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#111', marginBottom: 2 }}>{loc.naam}</p>
          <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{loc.type}</p>
          {zichtbaar.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {zichtbaar.map(d => (
                <div key={d.naam} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #eee', paddingBottom: 3 }}>
                  <span style={{ color: '#555' }}>{d.naam}</span>
                  <span style={{ fontWeight: 800, color: '#F27A00' }}>€{d.prijs.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#999' }}>Geen prijzen beschikbaar</p>
          )}
          <a href={`/locaties/${slug}`}
            style={{ display: 'block', marginTop: 10, fontSize: 12, fontWeight: 700, color: '#F27A00', textDecoration: 'none', paddingTop: 6, borderTop: '1px solid #eee' }}>
            Bekijk {loc.naam} →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Work Sans, sans-serif', minWidth: 200, maxWidth: 240, overflow: 'hidden' }}>
      {foto && (
        <img src={foto} alt={loc.naam} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block', marginBottom: 8, borderRadius: 4 }} />
      )}
      <div style={{ padding: '0 2px' }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: '#111', marginBottom: 2 }}>{loc.naam}</p>
        {(() => {
          const s = berekenOpenStatus(loc.openingstijden);
          if (!s) return null;
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              backgroundColor: s.open ? '#dcfce7' : '#fee2e2',
              color: s.open ? '#16a34a' : '#dc2626',
              marginBottom: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.open ? '#4ade80' : '#f87171', display: 'inline-block' }} />
              {s.open ? `Open · sluit ${s.sluitOm}` : s.openstOm ? `Gesloten · opent ${s.dagLabel} ${s.openstOm}` : 'Gesloten'}
            </span>
          );
        })()}
        <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{loc.type}</p>
        <p style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{loc.adres}</p>
        {loc.leeftijd && <p style={{ fontSize: 11, color: '#777', marginBottom: 6 }}>Leeftijd: <strong>{loc.leeftijd}</strong></p>}
        {loc.tags && loc.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {loc.tags.map(t => (
              <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, backgroundColor: '#fff5ec', color: '#F27A00', border: '1px solid #fdd5a8', fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>
        )}
        <a href={`/locaties/${slug}`}
          style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#F27A00', textDecoration: 'none', paddingTop: 6, borderTop: '1px solid #eee' }}>
          Ontdek {loc.naam} →
        </a>
      </div>
    </div>
  );
}

export default function GoogleVenueMap({
  locaties = [],
  bierprijzen = [],
  mode = 'locaties',
  hoogte = '420px',
  drankFilter = null,
  hoverId = null,
  onHoverPin = null,
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-map-script',
    libraries: LIBRARIES,
  });

  const [actief, setActief] = useState(null);
  const [hoverLoc, setHoverLoc] = useState(null);
  const [hoverKaart, setHoverKaart] = useState(false);
  const onUnmount = useCallback(() => {}, []);

  if (!apiKey || apiKey === 'JOUW_GOOGLE_MAPS_API_KEY_HIER') {
    return (
      <div className="w-full rounded-xl border border-[#1e1e1e] flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-8 gap-3" style={{ height: hoogte }}>
        <p className="text-gray-400 text-sm font-semibold">Google Maps API key ontbreekt</p>
      </div>
    );
  }

  if (loadError) return (
    <div className="w-full rounded-xl border border-red-900/40 bg-red-950/20 flex items-center justify-center text-red-400 text-sm p-8" style={{ height: hoogte }}>
      Fout bij laden van Google Maps.
    </div>
  );

  if (!isLoaded) return (
    <div className="w-full rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] flex items-center justify-center" style={{ height: hoogte }}>
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
        Kaart laden…
      </div>
    </div>
  );

  // Prijzenkleuren berekenen
  let prijzenMap = {};
  if (mode === 'prijzen' && bierprijzen.length > 0) {
    // Bereken globaal gemiddelde per categorie als fallback voor ontbrekende prijzen
    const alleCategorieen = ['Bier', 'Wijn', 'Mixdrank', 'Cocktail', 'Hard Seltzer', 'Shot', 'Frisdrank'];
    const globaleFallback = {};
    alleCategorieen.forEach(cat => {
      const prijzen = bierprijzen.flatMap(v => v.dranken || []).filter(d => d.naam === cat).map(d => d.prijs);
      if (prijzen.length > 0) globaleFallback[cat] = prijzen.reduce((a, b) => a + b, 0) / prijzen.length;
    });

    const alleGemiddeldes = bierprijzen.map(v => gemiddeldePrijs(v.dranken, drankFilter, globaleFallback)).filter(Boolean);
    const avg = alleGemiddeldes.reduce((a, b) => a + b, 0) / alleGemiddeldes.length;
    const spread = (Math.max(...alleGemiddeldes) - Math.min(...alleGemiddeldes)) || 1;
    bierprijzen.forEach(v => {
      const heeftEigenPrijzen = (v.dranken || []).length > 0;
      const prijs = gemiddeldePrijs(v.dranken, drankFilter, globaleFallback);
      const kleur = heeftEigenPrijzen ? pinKleur(prijs, avg, spread) : '#555555';
      prijzenMap[v.slug] = { prijs, kleur, dranken: v.dranken };
    });
  }

  const hoogtePx = parseInt(hoogte) || 420;
  const hoverHoogte = hoogtePx + 150;

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-[#1e1e1e]"
      style={{
        height: hoverKaart ? `${hoverHoogte}px` : hoogte,
        transition: 'height 0.35s ease',
      }}
      onMouseEnter={() => setHoverKaart(true)}
      onMouseLeave={() => setHoverKaart(false)}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={HENGELO_CENTER}
        zoom={18}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: 'cooperative',
          scrollwheel: false,
        }}
        onUnmount={onUnmount}
        onClick={() => setActief(null)}
      >
        {locaties
          .filter(loc => loc.lat && loc.lng)
          .map((loc) => {
            const kleur = mode === 'prijzen'
              ? (prijzenMap[locSlug(loc)]?.kleur || '#666')
              : '#F27A00';
            const openStatus = berekenOpenStatus(loc.openingstijden);

            const pinId = loc.id || loc._id || loc.naam;
            const isHovered = hoverLoc?.id === loc.id || hoverLoc?.naam === loc.naam;
            return (
              <React.Fragment key={pinId}>
                <CustomPin
                  loc={loc}
                  kleur={kleur}
                  isActief={actief?.id === loc.id || actief?.naam === loc.naam}
                  isHover={(hoverId === loc.id || hoverId === loc._id) || isHovered}
                  onClick={() => { window.location.href = `/locaties/${locSlug(loc)}`; }}
                  onMouseEnter={() => { onHoverPin?.(loc.id || loc._id); setHoverLoc(loc); }}
                  onMouseLeave={() => { onHoverPin?.(null); setHoverLoc(null); }}
                  openStatus={openStatus}
                />
                {isHovered && !actief && (
                  <OverlayView
                    position={{ lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) }}
                    mapPaneName={OverlayView.FLOAT_PANE}
                  >
                    <HoverTooltip loc={loc} mode={mode} prijzenData={prijzenMap[locSlug(loc)]} drankFilter={drankFilter} />
                  </OverlayView>
                )}
              </React.Fragment>
            );
          })}

        {actief && actief.lat && actief.lng && (
          <InfoWindow
            position={{ lat: parseFloat(actief.lat), lng: parseFloat(actief.lng) }}
            onCloseClick={() => setActief(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -62) }}
          >
            <InfoPopup
              loc={actief}
              mode={mode}
              prijzenData={prijzenMap[locSlug(actief)]}
              drankFilter={drankFilter}
            />
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
