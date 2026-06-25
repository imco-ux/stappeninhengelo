'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { berekenOpenStatus } from '@/lib/openingstijden';

const GoogleVenueMap = dynamic(() => import('@/components/GoogleVenueMap'), { ssr: false });

const typeKleurMap = {
  // Cafés
  'Café':                    '#60a5fa', // blauw
  'Bruin café':              '#92400e', // bruin
  'Bruin Café':              '#92400e',
  'Grand Café':              '#a78bfa', // paars
  'Muziekcafé':              '#34d399', // groen
  'Feestcafé':               '#F27A00', // oranje
  'Danscafé':                '#f472b6', // roze
  'Speciaalbiercafé':        '#fbbf24', // geel
  // Clubs
  'Club':                    '#a855f7', // paars
  'Nachtclub':               '#c084fc',
  // Bars
  'Cocktailbar':             '#06b6d4', // cyaan
  'Wijnbar':                 '#e879f9', // magenta
  'Sportbar':                '#4ade80',
  'Sports bar':              '#4ade80',
  'Bistro / Cocktails':      '#06b6d4',
  'Cocktailbar / Lounge':    '#67e8f9',
  // Eten & drinken
  'Restaurant / Bar':        '#fb923c',
  'Restaurant / Borrel':     '#fb923c',
  'Brouwerij / Restaurant':  '#a3e635',
  // Overig
  'Karaoke':                 '#ec4899',
  'Karaokebar':              '#ec4899',
  'Terras':                  '#4ade80',
  'Terras/Bar':              '#4ade80',
  'Lounge':                  '#818cf8',
  // Eten (laat open)
  'Cafetaria':               '#f97316',
  'Döner / Shoarma':         '#ef4444',
  'Snackbar':                '#f97316',
  'Friettent':               '#facc15',
  'Pizzeria':                '#dc2626',
  'Burger':                  '#ea580c',
  'Sushi / Aziatisch':       '#e879f9',
  'Eetcafé':                 '#fb923c',
};

// Genereer Tailwind-vrije inline kleur per type
function getTypeKleur(type) {
  if (!type) return '#888';
  // Directe match
  if (typeKleurMap[type]) return typeKleurMap[type];
  // Gedeeltelijke match (bijv. "Café" in "Grand Café")
  const lower = type.toLowerCase();
  if (lower.includes('feest')) return '#F27A00';
  if (lower.includes('bruin')) return '#92400e';
  if (lower.includes('grand')) return '#a78bfa';
  if (lower.includes('muziek')) return '#34d399';
  if (lower.includes('dans')) return '#f472b6';
  if (lower.includes('speciaal')) return '#fbbf24';
  if (lower.includes('club')) return '#a855f7';
  if (lower.includes('cocktail')) return '#06b6d4';
  if (lower.includes('wijn')) return '#e879f9';
  if (lower.includes('sport')) return '#4ade80';
  if (lower.includes('restaurant')) return '#fb923c';
  if (lower.includes('brouwerij')) return '#a3e635';
  if (lower.includes('karaoke')) return '#ec4899';
  if (lower.includes('terras')) return '#4ade80';
  if (lower.includes('lounge')) return '#818cf8';
  if (lower.includes('café') || lower.includes('cafe')) return '#60a5fa';
  if (lower.includes('bar')) return '#67e8f9';
  // Fallback: hash de string naar een vaste kleur
  const hue = [...type].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export default function LocatiesPage() {
  const [locaties, setLocaties] = useState([]);
  const [laden, setLaden]       = useState(true);
  const [zoek, setZoek]         = useState('');
  const [type, setType]         = useState('Alle');
  const [nurOpen, setNurOpen]   = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoverId, setHoverId]   = useState(null);

  useEffect(() => {
    const vandaag = new Date().toISOString().slice(0, 10);
    Promise.all([
      supabase.from('venues').select('*').eq('actief', true).order('naam'),
      supabase.from('acties').select('venue_id, hot, geldig_tot, onbepaalde_tijd, vaste_dagen')
        .eq('gepubliceerd', true)
        .or(`onbepaalde_tijd.eq.true,geldig_tot.gte.${vandaag}`),
    ]).then(([{ data: venues }, { data: actiesData }]) => {
      const actiesPerVenue = {};
      for (const a of actiesData || []) {
        if (!a.venue_id) continue;
        if (!actiesPerVenue[a.venue_id]) actiesPerVenue[a.venue_id] = { count: 0, hot: false };
        actiesPerVenue[a.venue_id].count++;
        if (a.hot) actiesPerVenue[a.venue_id].hot = true;
      }
      setLocaties((venues || []).map(v => ({
        ...v, _id: v.id,
        slug: v.naam.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
        _acties: actiesPerVenue[v.id] || null,
      })));
      setLaden(false);
    });
  }, []);

  const ETEN_TYPES = ['Cafetaria','Döner / Shoarma','Snackbar','Friettent','Pizzeria','Burger','Sushi / Aziatisch','Eetcafé'];

  const types = useMemo(() => ['Alle', 'Eten 🍟', ...new Set(locaties.map(l => l.type).filter(t => !ETEN_TYPES.includes(t)))], [locaties]);

  const gefilterd = useMemo(() => locaties.filter(l => {
    const zoekOk = (l.naam||'').toLowerCase().includes(zoek.toLowerCase()) ||
                   (l.adres||'').toLowerCase().includes(zoek.toLowerCase()) ||
                   (l.omschrijving||'').toLowerCase().includes(zoek.toLowerCase());
    const typeOk = type === 'Alle' || (type === 'Eten 🍟' ? ETEN_TYPES.includes(l.type) : l.type === type);
    const openOk = !nurOpen || berekenOpenStatus(l.openingstijden)?.open === true;
    return zoekOk && typeOk && openOk;
  }), [locaties, zoek, type, nurOpen]);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Paginakop + zoekbalk */}
      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-end gap-8">
          <div className="flex-1">
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
            <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              LOCATIES
            </h1>
            <p className="text-gray-500 text-sm mt-1">Alle kroegen & clubs in Hengelo</p>
          </div>
          {/* Zoekbalk */}
          <div className="w-full lg:w-96">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={zoek}
                onChange={e => setZoek(e.target.value)}
                placeholder="Zoek op naam, adres, sfeer…"
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-10 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-oranje transition-colors"
              />
              {zoek && (
                <button onClick={() => setZoek('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">✕</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Kaart */}
      <section className="px-4 py-8 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <GoogleVenueMap
            locaties={locaties}
            mode="locaties"
            hoogte="380px"
            hoverId={hoverId}
            onHoverPin={setHoverId}
          />
        </div>
      </section>

      {/* Filterbar — sticky */}
      <section className="border-b border-[#1a1a1a]" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">

          {/* Filter knop */}
          <button onClick={() => setFilterOpen(o => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors flex-shrink-0 ${
              type !== 'Alle'
                ? 'bg-oranje border-oranje text-black'
                : 'border-[#333] text-gray-400 hover:border-oranje hover:text-white'
            }`}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {type === 'Alle' ? 'Filter' : type}
            {type !== 'Alle' && (
              <span onClick={e => { e.stopPropagation(); setType('Alle'); }}
                className="ml-1 hover:opacity-70">✕</span>
            )}
          </button>

          {/* Nu open toggle */}
          <button onClick={() => setNurOpen(o => !o)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors flex-shrink-0 ${
              nurOpen
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-[#333] text-gray-400 hover:border-green-500 hover:text-green-400'
            }`}>
            <span className={`w-2 h-2 rounded-full inline-block ${nurOpen ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
            Nu open
          </button>

          {/* Resultaatteller */}
          <span className="text-xs text-gray-600 flex-shrink-0">
            {gefilterd.length} locatie{gefilterd.length !== 1 ? 's' : ''}
            {zoek && <span className="ml-1 text-oranje">"{zoek}"</span>}
          </span>
        </div>

        {/* Uitklappanel met alle types */}
        {filterOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
            <div className="absolute left-0 right-0 z-40 border-t border-[#1a1a1a] px-4 py-4" style={{ backgroundColor: '#0f0f0f' }}>
              <div className="max-w-6xl mx-auto">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Type locatie</p>
                <div className="flex flex-wrap gap-2">
                  {types.map(t => {
                    const aantal = t === 'Alle' ? locaties.length : locaties.filter(l => l.type === t).length;
                    const actief = type === t;
                    return (
                      <button key={t} onClick={() => { setType(t); setFilterOpen(false); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-colors ${
                          actief
                            ? 'bg-oranje border-oranje text-black'
                            : 'border-[#2a2a2a] text-gray-300 hover:border-oranje hover:text-white bg-[#141414]'
                        }`}>
                        {t}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-normal ${actief ? 'bg-black/20' : 'bg-[#222] text-gray-500'}`}>
                          {aantal}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Locaties grid */}
      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {gefilterd.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <p className="text-2xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Geen locaties gevonden</p>
              <p className="text-sm mt-2">Probeer een andere zoekopdracht</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gefilterd.map((loc) => {
                const kleur = getTypeKleur(loc.type);
                return (
                  <a key={loc.id} href={`/locaties/${loc.slug}`}
                    onMouseEnter={() => setHoverId(loc.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={`bg-[#141414] rounded-xl overflow-hidden border transition-colors group flex flex-col ${hoverId === loc.id ? 'border-oranje shadow-[0_0_16px_rgba(242,122,0,0.25)]' : 'border-[#252525] hover:border-oranje'}`}>
                    <div className="relative w-full bg-[#0d0d0d] border-b border-[#1e1e1e] group-hover:border-oranje/40 transition-colors overflow-hidden" style={{ height: '150px' }}>
                      {/* Open/gesloten badge */}
                      {(() => {
                        const status = berekenOpenStatus(loc.openingstijden);
                        if (!status) return null;
                        return (
                          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: status.open ? 'rgba(22,163,74,0.85)' : 'rgba(127,29,29,0.85)',
                              backdropFilter: 'blur(4px)',
                              color: status.open ? '#bbf7d0' : '#fca5a5',
                              border: `1px solid ${status.open ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.4)'}`,
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block"
                              style={{ backgroundColor: status.open ? '#4ade80' : '#f87171', boxShadow: `0 0 6px ${status.open ? '#4ade80' : '#f87171'}` }} />
                            {status.open ? 'Open' : 'Gesloten'}
                          </div>
                        );
                      })()}
                      {loc.fotos?.[0] ? (
                        <img src={loc.fotos[0]} alt={loc.naam} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img src="/images/logo-small.png" alt="" className="w-12 h-12 object-contain opacity-10" />
                        </div>
                      )}
                      {loc.logo_url && (
                        <div className="absolute bottom-3 left-3 w-16 h-16 rounded-full overflow-hidden border-2 border-black bg-black shadow-xl">
                          <img src={loc.logo_url} alt={loc.naam} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                        {loc._acties && (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: loc._acties.hot ? '#F27A00' : 'rgba(242,122,0,0.85)', color: '#000', backdropFilter: 'blur(4px)' }}>
                            {loc._acties.hot ? '🔥 ' : ''}{loc._acties.count} actie{loc._acties.count > 1 ? 's' : ''}
                          </span>
                        )}
                        {loc.leeftijd && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/10">{loc.leeftijd}</span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-2 flex-1">
                      {loc.type && (
                        <span className="text-xs font-bold uppercase tracking-wide self-start flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: kleur }} />
                          <span style={{ color: kleur }}>{loc.type}</span>
                        </span>
                      )}
                      <h2 className="text-2xl font-black uppercase leading-tight group-hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                        {loc.naam}
                      </h2>
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span className="text-gray-500 text-xs">{loc.adres}</span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 flex-1">{loc.omschrijving}</p>
                      <span className="text-oranje text-sm font-bold uppercase tracking-wide mt-2">Bekijk locatie →</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
