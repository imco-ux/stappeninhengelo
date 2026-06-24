'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

export default function AdminGebruikers() {
  const [gebruikers, setGebruikers] = useState([]);
  const [venues, setVenues]         = useState([]);
  const [laden, setLaden]           = useState(true);
  const [melding, setMelding]       = useState('');
  const [koppelenId, setKoppelenId] = useState(null);
  const [gekozenVenue, setGekozenVenue] = useState('');

  useEffect(() => { laad(); }, []);

  async function laad() {
    setLaden(true);
    const [gbRes, veRes] = await Promise.all([
      supabase.from('gebruikers').select('*').order('created_at', { ascending: false }),
      supabase.from('venues').select('id, naam, eigenaar_id').order('naam'),
    ]);
    setGebruikers(gbRes.data || []);
    setVenues(veRes.data || []);
    setLaden(false);
  }

  async function toggleGoedkeuring(gb) {
    await supabase.from('gebruikers').update({ goedgekeurd: !gb.goedgekeurd }).eq('id', gb.id);
    setGebruikers(gs => gs.map(g => g.id === gb.id ? { ...g, goedgekeurd: !g.goedgekeurd } : g));
    toonMelding(gb.goedgekeurd ? 'Toegang ingetrokken' : 'Gebruiker goedgekeurd ✓');
  }

  async function koppelVenue(gebruiker) {
    if (!gekozenVenue) return;
    await supabase.from('venues').update({ eigenaar_id: gebruiker.user_id }).eq('id', gekozenVenue);
    const venue = venues.find(v => v.id === gekozenVenue);
    toonMelding(`${venue?.naam} gekoppeld aan ${gebruiker.naam || gebruiker.email} ✓`);
    setKoppelenId(null);
    setGekozenVenue('');
    laad();
  }

  async function ontkoppelVenue(venueId) {
    await supabase.from('venues').update({ eigenaar_id: null }).eq('id', venueId);
    toonMelding('Venue ontkoppeld');
    laad();
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  // Venues gekoppeld aan elke gebruiker
  function venuesVanGebruiker(userId) {
    return venues.filter(v => v.eigenaar_id === userId);
  }

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Gebruikers</h1>
          <p className="text-gray-500 text-sm mt-1">
            {gebruikers.length} geregistreerd · {gebruikers.filter(g => !g.goedgekeurd).length} wachten op goedkeuring
          </p>
        </div>

        {melding && (
          <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>
        )}

        {/* Jouw eigen account toevoegen als je dat nog niet gedaan hebt */}
        <div className="mb-6 rounded-xl border border-[#1e1e1e] p-5" style={{ backgroundColor: '#141414' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Jouw admin account</p>
          <p className="text-sm text-gray-400 mb-3">
            Nieuwe gebruikers verschijnen hier automatisch zodra ze zich registreren via het aanmeldformulier.
          </p>
          <a href="https://supabase.com/dashboard/project/zrmfjziydyegaraiidop/auth/users"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] text-xs text-gray-400 hover:text-white transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Alle auth-gebruikers in Supabase →
          </a>
        </div>

        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : gebruikers.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] p-16 text-center" style={{ backgroundColor: '#141414' }}>
            <p className="text-gray-600 text-sm">Nog geen gebruikers geregistreerd via het aanmeldformulier.</p>
            <p className="text-gray-700 text-xs mt-2">Zodra een café-eigenaar zich aanmeldt via /dashboard/register verschijnt hij hier.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gebruikers.map(gb => {
              const gekoppeld = venuesVanGebruiker(gb.user_id);
              const isKoppelen = koppelenId === gb.id;
              return (
                <div key={gb.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                  <div className="p-5 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                      style={{ backgroundColor: gb.goedgekeurd ? '#F27A00' : '#333', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                      {(gb.naam || gb.email || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">{gb.naam || '—'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gb.goedgekeurd ? 'bg-green-950/50 text-green-400' : 'bg-yellow-950/50 text-yellow-500'}`}>
                          {gb.goedgekeurd ? 'Goedgekeurd' : 'Wacht op goedkeuring'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1a1a1a] text-gray-500">
                          {gb.rol || 'eigenaar'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{gb.email}</p>
                      {gb.telefoon && <p className="text-xs text-gray-600 mt-0.5">{gb.telefoon}</p>}

                      {/* Gekoppelde venues */}
                      {gekoppeld.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {gekoppeld.map(v => (
                            <div key={v.id} className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-lg px-3 py-1.5">
                              <span className="text-xs font-bold text-white">📍 {v.naam}</span>
                              <button onClick={() => ontkoppelVenue(v.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors ml-1 text-xs">✕</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Venue koppelen UI */}
                      {isKoppelen && (
                        <div className="mt-3 flex gap-2 items-center">
                          <select value={gekozenVenue} onChange={e => setGekozenVenue(e.target.value)}
                            className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje">
                            <option value="">— Kies een venue —</option>
                            {venues
                              .filter(v => !v.eigenaar_id)
                              .map(v => (
                                <option key={v.id} value={v.id}>{v.naam}</option>
                              ))
                            }
                          </select>
                          <button onClick={() => koppelVenue(gb)} disabled={!gekozenVenue}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-40"
                            style={{ backgroundColor: '#F27A00' }}>
                            Koppel
                          </button>
                          <button onClick={() => { setKoppelenId(null); setGekozenVenue(''); }}
                            className="px-4 py-2 rounded-lg text-sm text-gray-500 border border-[#333] hover:text-white">
                            Annuleer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Acties */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setKoppelenId(isKoppelen ? null : gb.id); setGekozenVenue(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:text-white transition-colors">
                        {isKoppelen ? 'Annuleer' : '+ Venue koppelen'}
                      </button>
                      <button onClick={() => toggleGoedkeuring(gb)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={{
                          backgroundColor: gb.goedgekeurd ? 'transparent' : '#F27A00',
                          color: gb.goedgekeurd ? '#f87171' : 'black',
                          border: gb.goedgekeurd ? '1px solid #7f1d1d' : 'none',
                        }}>
                        {gb.goedgekeurd ? 'Intrekken' : 'Goedkeuren'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
