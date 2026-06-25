'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventModal from '@/components/EventModal';
import EventPoster from '@/components/EventPoster';
import { supabase } from '@/lib/supabase';

const DAGEN = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

function dagNaam(iso) {
  const d = new Date(iso + 'T12:00:00');
  const n = DAGEN[d.getDay()];
  return n.charAt(0).toUpperCase() + n.slice(1);
}
function datumLabel(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

const typeFilters = ['Alle types', 'Feestcafé', 'Club', 'Karaoke', 'Live'];

const typeKleur = {
  Feestcafé: 'bg-oranje/10 text-oranje border-oranje/40',
  Club:       'bg-purple-900/20 text-purple-400 border-purple-500/40',
  Karaoke:    'bg-pink-900/20 text-pink-400 border-pink-500/40',
  Live:       'bg-green-900/20 text-green-400 border-green-500/40',
};

export default function AgendaPage() {
  const [events, setEvents]         = useState([]);
  const [laden, setLaden]           = useState(true);
  const [actieveDag, setActieveDag] = useState('Alle dagen');
  const [actieveType, setActieveType] = useState('Alle types');
  const [actief, setActief]         = useState(null);

  useEffect(() => {
    async function laad() {
      const [evRes, venRes] = await Promise.all([
        supabase.from('events').select('*').eq('goedgekeurd', true)
          .gte('datum', new Date().toISOString().split('T')[0])
          .is('centrumbreed_id', null)
          .order('datum', { ascending: true }),
        supabase.from('venues').select('id, naam, logo_url, eigenaar_id'),
      ]);
      const venueMap = {};
      for (const v of (venRes.data || [])) {
        venueMap[v.naam] = v;
        venueMap[v.eigenaar_id] = v;
      }
      setEvents((evRes.data || []).filter(e => !e.centrumbreed_id).map(e => {
        const vByNaam = venueMap[e.venue_naam] || null;
        return {
          ...e,
          _id: e.id,
          dag: dagNaam(e.datum),
          datumLabel: datumLabel(e.datum),
          venue: e.venue_naam,
          posterUrl: e.poster_url || null,
          venueLogo: vByNaam?.logo_url || null,
        };
      }));
      setLaden(false);
    }
    laad();
  }, []);

  // Unieke datums (ISO string) gesorteerd — voor de dagfilter-knoppen
  const alleDatums = useMemo(() => {
    const uniek = [...new Set(events.map(e => e.datum).filter(Boolean))].sort();
    return ['Alle dagen', ...uniek];
  }, [events]);

  const gefilterd = useMemo(() => {
    return events.filter(e => {
      const dagOk = actieveDag === 'Alle dagen' || e.datum === actieveDag;
      const typeOk = actieveType === 'Alle types' || e.type === actieveType;
      return dagOk && typeOk;
    });
  }, [events, actieveDag, actieveType]);

  const groepenPerDag = useMemo(() => {
    const map = new Map();
    for (const event of gefilterd) {
      if (!map.has(event.datum)) map.set(event.datum, []);
      map.get(event.datum).push(event);
    }
    return [...map.entries()];
  }, [gefilterd]);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
          <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>AGENDA</h1>
          <p className="text-gray-500 text-sm mt-1">{laden ? 'Laden...' : `${gefilterd.length} events gevonden`}</p>
        </div>
      </section>

      <section className="bg-black border-b border-[#1a1a1a] px-4 py-3">
        <div className="max-w-6xl mx-auto space-y-2">
          {/* Dagfilters */}
          <div className="flex gap-2 flex-wrap">
            {alleDatums.map((d) => {
              const ev = d !== 'Alle dagen' ? events.find(e => e.datum === d) : null;
              const MN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
              const label = d === 'Alle dagen' ? 'Alle dagen' : ev?.dag || dagNaam(d);
              const datStr = d !== 'Alle dagen' ? (() => { const dt = new Date(d + 'T12:00:00'); return `${dt.getDate()} ${MN[dt.getMonth()]}`; })() : null;
              return (
                <button key={d} onClick={() => setActieveDag(d)}
                  className={`text-xs font-bold uppercase tracking-wide px-4 py-1.5 rounded-full border transition-colors ${actieveDag === d ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje hover:text-oranje'}`}>
                  {label}
                  {datStr && (
                    <span className={`ml-1 ${actieveDag === d ? 'text-black/60' : 'text-gray-600'} font-normal normal-case`}>
                      {datStr}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Typefilters */}
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map((t) => (
              <button key={t} onClick={() => setActieveType(t)}
                className={`text-xs font-semibold uppercase px-4 py-1.5 rounded-full border transition-colors ${actieveType === t ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje hover:text-oranje'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {gefilterd.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <p className="text-2xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Geen events gevonden</p>
              <p className="text-sm mt-2">Probeer een andere filter</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groepenPerDag.map(([datum, dagEvents]) => (
                <div key={datum}>
                  {/* Dag-header met volledige datum */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex flex-col">
                      <span
                        className="px-4 py-1 rounded-full text-sm font-black uppercase text-black self-start"
                        style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}
                      >
                        {dagEvents[0]?.dag}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-semibold">{dagEvents[0]?.datumLabel}</span>
                    </div>
                    <div className="flex-1 h-px bg-[#1e1e1e]" />
                    <span className="text-gray-600 text-xs">{dagEvents.length} event{dagEvents.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {dagEvents.map((event) => {
                      return (
                        <button key={event._id}
                          onClick={() => event.is_centrumbreed ? (window.location.href = `/events/${event.slug}`) : setActief(event)}
                          className={`text-left bg-[#141414] rounded-xl border group active:scale-[0.98] overflow-hidden ${event.hot ? 'hot-card' : 'border-[#252525] hover:border-oranje transition-all'} ${event.is_centrumbreed ? 'border-oranje/30' : ''}`}>
                          <div className="relative">
                            <EventPoster src={event.posterUrl} alt={event.title} leeftijd={event.leeftijd} />
                            {event.hot && (
                              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
                                style={{ backgroundColor: '#F27A00', color: '#000' }}>
                                <span className="hot-badge">🔥</span>
                                <span>HOT</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            {event.type && (() => {
                              const kleuren = { Feestcafé:'#F27A00', Club:'#a855f7', Karaoke:'#ec4899', Live:'#22c55e', Quiz:'#3b82f6', Borrel:'#eab308', Festival:'#ef4444' };
                              const kleur = kleuren[event.type] || '#888';
                              return (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: kleur }}>{event.type}</span>
                                </div>
                              );
                            })()}
                            <h3 className="text-base font-black uppercase leading-tight group-hover:text-oranje transition-colors mb-0.5" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mb-1">
                              {event.venueLogo && (
                                <div className="w-4 h-4 rounded-full overflow-hidden border border-[#333] bg-[#111] flex-shrink-0">
                                  <img src={event.venueLogo} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <p className="text-gray-400 text-xs truncate">{event.venue}</p>
                            </div>
                            {/* Artiesten */}
                            {(event.extra_info?.artiesten || event.artiesten) && (
                              <p className="text-gray-600 text-[10px] truncate mb-1">
                                🎤 {event.extra_info?.artiesten || event.artiesten}
                              </p>
                            )}
                            {/* Genres */}
                            {(event.extra_info?.genres?.length > 0) && (
                              <div className="flex gap-1 flex-wrap mb-1">
                                {event.extra_info.genres.slice(0, 2).map(g => (
                                  <span key={g} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-oranje/10 text-oranje/70">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{event.tijd}</span>
                              <span className={`font-bold ${event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}`}>{event.prijs}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </section>

      <Footer />
      {actief && <EventModal event={actief} onClose={() => setActief(null)} />}
    </main>
  );
}
