'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const DREMPEL_DAGEN = 21;

function drempelDatum() {
  const d = new Date();
  d.setDate(d.getDate() - DREMPEL_DAGEN);
  return d.toISOString();
}

function eventDatumIso(ev) {
  if (!ev.datum) return null;
  return new Date(ev.datum + 'T23:59:59').toISOString();
}

export default function AdminArchief() {
  const [events, setEvents]   = useState([]);
  const [nieuws, setNieuws]   = useState([]);
  const [laden, setLaden]     = useState(true);
  const [tab, setTab]         = useState('events');
  const [melding, setMelding] = useState('');

  useEffect(() => { laad(); }, []);

  async function laad() {
    setLaden(true);
    const grens = drempelDatum();

    const [evRes, niRes] = await Promise.all([
      supabase.from('events').select('*').lt('datum', grens.slice(0,10)).order('datum', { ascending: false }),
      supabase.from('nieuws').select('*').lt('created_at', grens).order('created_at', { ascending: false }),
    ]);

    setEvents(evRes.data || []);
    setNieuws(niRes.data || []);
    setLaden(false);
  }

  async function verwijderEvent(id) {
    if (!confirm('Event permanent verwijderen?')) return;
    await supabase.from('events').delete().eq('id', id);
    setEvents(e => e.filter(x => x.id !== id));
    toonMelding('Event verwijderd');
  }

  async function verwijderNieuws(id) {
    if (!confirm('Bericht permanent verwijderen?')) return;
    await supabase.from('nieuws').delete().eq('id', id);
    setNieuws(n => n.filter(x => x.id !== id));
    toonMelding('Bericht verwijderd');
  }

  async function verwijderAlleEvents() {
    if (!confirm(`Alle ${events.length} events uit het archief verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    const ids = events.map(e => e.id);
    await supabase.from('events').delete().in('id', ids);
    setEvents([]);
    toonMelding(`${ids.length} events verwijderd`);
  }

  async function verwijderAlleNieuws() {
    if (!confirm(`Alle ${nieuws.length} berichten uit het archief verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    const ids = nieuws.map(n => n.id);
    await supabase.from('nieuws').delete().in('id', ids);
    setNieuws([]);
    toonMelding(`${ids.length} berichten verwijderd`);
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  const totaal = events.length + nieuws.length;

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Archief
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Items ouder dan {DREMPEL_DAGEN} dagen worden automatisch gearchiveerd · {totaal} item{totaal !== 1 ? 's' : ''} in archief
          </p>
        </div>

        {melding && (
          <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#1e1e1e] pb-4">
          <button onClick={() => setTab('events')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'events' ? 'bg-oranje text-black' : 'text-gray-500 border border-[#2a2a2a] hover:text-white'}`}>
            📅 Events {events.length > 0 && <span className="ml-1 opacity-70">({events.length})</span>}
          </button>
          <button onClick={() => setTab('nieuws')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === 'nieuws' ? 'bg-oranje text-black' : 'text-gray-500 border border-[#2a2a2a] hover:text-white'}`}>
            📰 Nieuws {nieuws.length > 0 && <span className="ml-1 opacity-70">({nieuws.length})</span>}
          </button>
        </div>

        {laden ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-[#141414] animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* === EVENTS === */}
            {tab === 'events' && (
              events.length === 0 ? (
                <div className="rounded-xl border border-[#1e1e1e] p-16 text-center text-gray-600 text-sm" style={{ backgroundColor: '#141414' }}>
                  Geen gearchiveerde events.
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={verwijderAlleEvents}
                      className="px-4 py-2 rounded-lg text-xs font-bold border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors">
                      Alles verwijderen ({events.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {events.map(ev => (
                      <div key={ev.id} className="rounded-xl border border-[#1e1e1e] p-4 flex items-center gap-4" style={{ backgroundColor: '#141414' }}>
                        {/* Datum blok */}
                        <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 bg-[#1a1a1a]">
                          <span className="text-[9px] font-bold text-gray-600 uppercase leading-none">
                            {ev.datum ? MAANDEN[new Date(ev.datum + 'T12:00:00').getMonth()] : '–'}
                          </span>
                          <span className="text-lg font-black text-gray-400 leading-none">
                            {ev.datum ? new Date(ev.datum + 'T12:00:00').getDate() : '–'}
                          </span>
                        </div>

                        {ev.poster_url && (
                          <img src={ev.poster_url} alt="" className="w-8 h-10 rounded object-cover flex-shrink-0 opacity-50" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-400 text-sm truncate">{ev.title}</p>
                          <p className="text-xs text-gray-600 truncate">{ev.venue_naam} · {ev.type}</p>
                        </div>

                        <span className="text-[10px] text-gray-700 flex-shrink-0">
                          {ev.datum ? new Date(ev.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </span>

                        <button onClick={() => verwijderEvent(ev.id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors flex-shrink-0">
                          Verwijder
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}

            {/* === NIEUWS === */}
            {tab === 'nieuws' && (
              nieuws.length === 0 ? (
                <div className="rounded-xl border border-[#1e1e1e] p-16 text-center text-gray-600 text-sm" style={{ backgroundColor: '#141414' }}>
                  Geen gearchiveerde nieuwsberichten.
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={verwijderAlleNieuws}
                      className="px-4 py-2 rounded-lg text-xs font-bold border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors">
                      Alles verwijderen ({nieuws.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {nieuws.map(item => (
                      <div key={item.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden flex" style={{ backgroundColor: '#141414' }}>
                        <div className="w-20 h-16 flex-shrink-0 bg-[#0d0d0d] overflow-hidden border-r border-[#1e1e1e] flex items-center justify-center">
                          {item.foto
                            ? <img src={item.foto} alt="" className="w-full h-full object-cover opacity-50" onError={e => e.target.style.display='none'} />
                            : <span className="text-gray-700 text-xs">–</span>}
                        </div>
                        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-0.5">
                          <p className="font-bold text-gray-400 text-sm truncate">{item.titel}</p>
                          <p className="text-[10px] text-gray-700">
                            {new Date(item.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {item.categorie && ` · ${item.categorie}`}
                          </p>
                        </div>
                        <div className="flex items-center px-4 border-l border-[#1e1e1e]">
                          <button onClick={() => verwijderNieuws(item.id)}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors">
                            Verwijder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
