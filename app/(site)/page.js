'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import QuickNav from '@/components/QuickNav';
import Highlights from '@/components/Highlights';
import Footer from '@/components/Footer';
import EventModal from '@/components/EventModal';
import InstallBanner from '@/components/InstallBanner';
import PushToestemming from '@/components/PushToestemming';
import EventPoster from '@/components/EventPoster';
import { supabase } from '@/lib/supabase';
import { berekenOpenStatus } from '@/lib/openingstijden';

const GoogleVenueMap = dynamic(() => import('@/components/GoogleVenueMap'), { ssr: false });

const ALLE_DAGEN = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
const DAGEN_NL = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MAANDEN_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

function dagNaam(iso) {
  const d = new Date(iso + 'T12:00:00');
  const n = DAGEN_NL[d.getDay()];
  return n.charAt(0).toUpperCase() + n.slice(1);
}

const typeKleur = {
  Feestcafé: '#F27A00',
  Club:       '#a855f7',
  Karaoke:    '#ec4899',
  Live:       '#22c55e',
  Quiz:       '#3b82f6',
  Borrel:     '#eab308',
  Festival:   '#ef4444',
};

const MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
function weekDatums() {
  const nu = new Date();
  const dag = nu.getDay();
  const vrijdag = new Date(nu);
  vrijdag.setDate(nu.getDate() + ((5 - dag + 7) % 7 || 7));
  const zondag = new Date(vrijdag);
  zondag.setDate(vrijdag.getDate() + 2);
  return `${vrijdag.getDate()} – ${zondag.getDate()} ${MAANDEN_NL[zondag.getMonth()]} ${zondag.getFullYear()}`;
}

function EventKaart({ event, onClick }) {
  const kleur = typeKleur[event.type] || '#888';
  return (
    <button
      onClick={() => event.is_centrumbreed ? (window.location.href = `/events/${event.slug}`) : onClick(event)}
      className={`w-full text-left bg-[#141414] rounded-xl border group active:scale-[0.98] overflow-hidden ${event.hot ? 'hot-card' : 'border-[#252525] hover:border-oranje transition-all'} ${event.is_centrumbreed ? 'border-oranje/30' : ''}`}
    >
      <div className="relative">
        <EventPoster src={event.posterUrl} alt={event.title} leeftijd={event.leeftijd} />
        {/* HOT badge op de poster */}
        {event.hot && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ backgroundColor: '#F27A00', color: '#000' }}>
            <span className="hot-badge">🔥</span>
            <span>HOT</span>
          </div>
        )}
      </div>

      {/* Info — compacter op mobiel */}
      <div className="p-2.5 sm:p-4">
        {/* Type pill */}
        {event.type && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: kleur }}>{event.type}</span>
          </div>
        )}
        <h3
          className="text-base sm:text-xl font-black uppercase leading-tight group-hover:text-oranje transition-colors mb-0.5"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          {event.title}
        </h3>
        <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1.5 truncate">{event.venue}</p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {event.tijd}
          </div>
          <span className={`font-bold ${event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}`}>
            {event.prijs}
          </span>
        </div>

        {/* Adres verbergen op mobiel om ruimte te sparen */}
        <div className="hidden sm:flex mt-2 items-center gap-1 text-xs text-gray-600">
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="truncate">{event.adres}</span>
        </div>

        <div className="mt-2 pt-2 border-t border-[#1e1e1e] text-oranje text-xs font-bold uppercase tracking-wide">
          Tik voor details →
        </div>
      </div>
    </button>
  );
}

function datumLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MAANDEN_NL[d.getMonth()]} ${d.getFullYear()}`;
}

function slugify(naam) {
  return (naam || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function Home() {
  const [actief, setActief]       = useState(null);
  const [events, setEvents]       = useState([]);
  const [locaties, setLocaties]   = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [zoek, setZoek]           = useState('');
  const [zoekResultaten, setZoekResultaten] = useState([]);
  const [toonZoek, setToonZoek]   = useState(false);
  const zoekRef = useRef(null);

  useEffect(() => {
    function handleKlikBuiten(e) {
      if (zoekRef.current && !zoekRef.current.contains(e.target)) {
        setToonZoek(false);
      }
    }
    document.addEventListener('mousedown', handleKlikBuiten);
    return () => document.removeEventListener('mousedown', handleKlikBuiten);
  }, []);

  useEffect(() => {
    const vandaag = new Date().toISOString().split('T')[0];
    Promise.all([
      supabase.from('events').select('*').eq('goedgekeurd', true).gte('datum', vandaag).is('centrumbreed_id', null).order('datum').limit(20),
      supabase.from('venues').select('*').eq('actief', true),
      supabase.from('nieuws').select('*').eq('gepubliceerd', true).order('created_at', { ascending: false }).limit(6),
    ]).then(([evRes, veRes, niRes]) => {
      const venueMap = {};
      for (const v of (veRes.data || [])) venueMap[v.naam] = v;
      setEvents((evRes.data || []).filter(e => !e.centrumbreed_id).map(e => {
        const v = venueMap[e.venue_naam] || null;
        return {
          ...e, _id: e.id, dag: dagNaam(e.datum),
          datumLabel: datumLabel(e.datum),
          venue: e.venue_naam, posterUrl: e.poster_url || null,
          venueLogo: v?.logo_url || null,
          venueSlug: v ? slugify(v.naam) : null,
        };
      }));
      setLocaties(veRes.data || []);
      const handmatig = (niRes.data || []).map(n => ({
        _id: n.id, titel: n.titel, subtitel: n.subtitel, foto: n.foto, categorie: n.categorie, extern: false,
      }));
      setHighlights(handmatig);

      // Vul aan met Google Nieuws als er minder dan 3 handmatige zijn
      if (handmatig.length < 6) {
        fetch('/api/google-nieuws')
          .then(r => r.json())
          .then(d => {
            const extra = (d.artikelen || []).slice(0, 6 - handmatig.length).map((a, i) => ({
              _id: `google-${i}`, titel: a.titel, subtitel: a.bron, foto: a.foto,
              categorie: 'Nieuws', datum: a.datum, href: a.link, extern: true,
            }));
            setHighlights([...handmatig, ...extra]);
          })
          .catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    if (!zoek.trim()) { setZoekResultaten([]); return; }
    const q = zoek.toLowerCase();
    const evResults = events.filter(e =>
      e.title?.toLowerCase().includes(q) || e.venue_naam?.toLowerCase().includes(q)
    ).slice(0, 4).map(e => ({ type: 'event', item: e }));
    const locResults = locaties.filter(l =>
      l.naam?.toLowerCase().includes(q) || l.type?.toLowerCase().includes(q)
    ).slice(0, 3).map(l => ({ type: 'locatie', item: l }));
    setZoekResultaten([...evResults, ...locResults]);
  }, [zoek, events, locaties]);

  const groepen = useMemo(() => {
    const g = {};
    for (const e of events) {
      if (!e.datum) continue;
      if (!g[e.datum]) g[e.datum] = [];
      g[e.datum].push(e);
    }
    return g;
  }, [events]);

  const groepenEntries = Object.entries(groepen);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Langzaam zoomende achtergrond */}
        <img src="/images/banner-background.png" alt="" aria-hidden
          className="hero-zoom absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.62)' }} />
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#F27A00' }} />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-6 sm:py-16 flex flex-col lg:flex-row items-center gap-10">

          {/* Links: tekst */}
          <div className="flex-1 w-full">
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-2">Stappen In Hengelo</p>
            <h1 className="font-black uppercase leading-none mb-2"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: 'clamp(1.8rem, 7vw, 4.5rem)' }}>
              HIER KUN JE DEZE<br />
              WEEK STAPPEN<br />
              <span style={{ color: '#F27A00' }}>IN HENGELO</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium">{weekDatums()}</p>
          </div>

          {/* Rechts: zoek & filter — alleen zichtbaar vanaf sm */}
          <div className="hidden sm:block w-full lg:w-96 flex-shrink-0" ref={zoekRef}>
            <div className="rounded-2xl border border-white/10 p-5" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Zoek events & locaties</p>

              {/* Zoekveld + uitklapdropdown */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" width="16" height="16" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={zoek}
                  onChange={e => { setZoek(e.target.value); setToonZoek(true); }}
                  onFocus={() => setToonZoek(true)}
                  placeholder="Feestje, club, DJ, locatie..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-oranje transition-colors"
                />
                {zoek && (
                  <button onClick={() => { setZoek(''); setZoekResultaten([]); setToonZoek(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white z-10">✕</button>
                )}

                {/* Dropdown — absoluut, verandert hoogte van hero NIET */}
                {toonZoek && zoekResultaten.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden z-50" style={{ backgroundColor: '#111', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}>
                    {zoekResultaten.map(({ type, item }) => (
                      type === 'event' ? (
                        <button key={item.id} onMouseDown={() => { if (item.is_centrumbreed) { window.location.href = `/events/${item.slug}`; } else { setActief(item); setToonZoek(false); setZoek(''); } }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                            {item.posterUrl
                              ? <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-oranje text-xs">🎉</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.venue} · {item.datumLabel}</p>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#F27A00', color: '#000' }}>event</span>
                        </button>
                      ) : (() => {
                          const status = berekenOpenStatus(item.openingstijden);
                          return (
                            <a key={item.id} href={`/locaties/${slugify(item.naam)}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a1a1a] border border-[#333] flex-shrink-0 flex items-center justify-center">
                                {item.logo_url
                                  ? <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
                                  : <span className="text-xs font-black text-gray-500">{item.naam.charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-white truncate">{item.naam}</p>
                                  {status && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: status.open ? 'rgba(22,163,74,0.2)' : 'rgba(127,29,29,0.3)',
                                        color: status.open ? '#4ade80' : '#f87171',
                                      }}>
                                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: status.open ? '#4ade80' : '#f87171' }} />
                                      {status.open ? 'Open' : 'Gesloten'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{item.type} · {item.adres}</p>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 bg-[#222] px-1.5 py-0.5 rounded flex-shrink-0">locatie</span>
                            </a>
                          );
                        })()
                    ))}
                  </div>
                )}

                {toonZoek && zoek && zoekResultaten.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-[#111] px-4 py-3 z-50">
                    <p className="text-xs text-gray-600 text-center">Geen resultaten voor "{zoek}"</p>
                  </div>
                )}
              </div>


              {/* Snelfilters */}
              <div className="mt-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Snel naar</p>
                <div className="flex flex-wrap gap-2">
                  {['Agenda', 'Locaties', 'Prijzen', 'Kroegentocht'].map((label, i) => {
                    const hrefs = ['/agenda', '/locaties', '/prijzen', '/kroegentocht'];
                    return (
                      <a key={label} href={hrefs[i]}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Installatie banner (alleen mobiel) ── */}
      <InstallBanner />
      <PushToestemming />

      {/* ── Events per dag ── */}
      <section className="px-4 py-10 bg-black">
        <div className="max-w-6xl mx-auto space-y-12">
          {groepenEntries.map(([datum, dagEvents]) => (
            <div key={datum}>
              {/* Dag header */}
              <div className="flex items-center gap-4 mb-5">
                <span
                  className="px-4 py-1 rounded-full text-sm font-black uppercase text-black"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}
                >
                  {dagEvents[0]?.dag}
                </span>
                <span className="text-gray-600 text-xs">{dagEvents[0]?.datumLabel}</span>
                <div className="flex-1 h-px bg-[#1e1e1e]" />
                <span className="text-gray-600 text-xs">{dagEvents.length} event{dagEvents.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Grid — 2 kolommen mobiel, 3 desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {dagEvents.map((event) => (
                  <EventKaart key={event._id} event={event} onClick={setActief} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto mt-10 text-center">
          <a
            href="/agenda"
            className="inline-block px-8 py-3 rounded-lg border border-oranje text-oranje font-bold uppercase tracking-wide text-sm hover:bg-oranje hover:text-black transition-colors"
          >
            Volledige agenda bekijken →
          </a>
        </div>
      </section>

      {/* ── Navigatie ── */}
      <QuickNav />

      {/* ── Kaart van Hengelo ── */}
      <section className="px-4 py-12 bg-black border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-black uppercase mb-2"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            HENGELO OP DE KAART
          </h2>
          <p className="text-gray-500 text-sm mb-6">Klik op een pin voor meer info over de locatie</p>
          <GoogleVenueMap
            locaties={locaties}
            mode="locaties"
            hoogte="380px"
          />
        </div>
      </section>

      {/* ── Highlights ── */}
      <Highlights items={highlights} />

      <Footer />

      {/* ── Event modal ── */}
      {actief && <EventModal event={actief} onClose={() => setActief(null)} />}
    </main>
  );
}
