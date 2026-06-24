'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const DRANKEN = [
  { naam: 'Bier', emoji: '🍺', kleur: '#F59E0B' },
  { naam: 'Wijn', emoji: '🍷', kleur: '#A855F7' },
  { naam: 'Mixdrank', emoji: '🍹', kleur: '#22C55E' },
  { naam: 'Cocktail', emoji: '🍸', kleur: '#ec4899', sub: 'Pornstar Martini' },
  { naam: 'Hard Seltzer', emoji: '🫧', kleur: '#38BDF8' },
  { naam: 'Shot', emoji: '🥃', kleur: '#F27A00' },
  { naam: 'Frisdrank', emoji: '🥤', kleur: '#6B7280' },
];

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

function datumKort(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

function PrijsGrafiek({ geschiedenis }) {
  if (!geschiedenis || geschiedenis.length === 0) {
    return (
      <div className="text-center py-8 text-gray-700 text-sm">
        Nog geen prijswijzigingen geregistreerd voor deze locatie.
      </div>
    );
  }

  const drankenMetData = DRANKEN.filter(d =>
    geschiedenis.some(g => g.drankje === d.naam)
  );

  if (drankenMetData.length === 0) return null;

  const W = 600, H = 160, PAD_L = 40, PAD_R = 16, PAD_T = 16, PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const alleWaarden = geschiedenis.map(g => g.prijs);
  const minP = Math.max(0, Math.min(...alleWaarden) - 0.5);
  const maxP = Math.max(...alleWaarden) + 0.5;
  const spread = maxP - minP || 1;

  const alleData = [...geschiedenis].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const minT = new Date(alleData[0].created_at).getTime();
  const maxT = new Date(alleData[alleData.length - 1].created_at).getTime();
  const tSpread = maxT - minT || 1;

  const px = t => PAD_L + ((new Date(t).getTime() - minT) / tSpread) * plotW;
  const py = p => PAD_T + (1 - (p - minP) / spread) * plotH;

  // Y-axis labels
  const yTicks = [minP, (minP + maxP) / 2, maxP];

  // X-axis labels (first and last)
  const xTicks = alleData.length > 1
    ? [alleData[0], alleData[alleData.length - 1]]
    : [alleData[0]];

  return (
    <div className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <p className="text-xs font-bold uppercase text-gray-500 tracking-widest">Prijsverloop</p>
      </div>
      <div className="p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '300px', maxHeight: '160px' }}>
          {/* Y-grid lines */}
          {yTicks.map((p, i) => (
            <g key={i}>
              <line x1={PAD_L} y1={py(p)} x2={W - PAD_R} y2={py(p)} stroke="#1e1e1e" strokeWidth="1" />
              <text x={PAD_L - 4} y={py(p) + 4} textAnchor="end" fontSize="9" fill="#555">
                €{p.toFixed(2)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xTicks.map((d, i) => (
            <text key={i} x={px(d.created_at)} y={H - 4} textAnchor="middle" fontSize="9" fill="#555">
              {datumKort(d.created_at)}
            </text>
          ))}

          {/* Lines per drankje */}
          {drankenMetData.map(d => {
            const data = alleData.filter(g => g.drankje === d.naam);
            if (data.length < 1) return null;
            if (data.length === 1) {
              return (
                <circle key={d.naam} cx={px(data[0].created_at)} cy={py(data[0].prijs)} r="4" fill={d.kleur} />
              );
            }
            const pts = data.map(g => `${px(g.created_at)},${py(g.prijs)}`).join(' ');
            return (
              <g key={d.naam}>
                <polyline points={pts} fill="none" stroke={d.kleur} strokeWidth="2" strokeLinejoin="round" />
                {data.map((g, i) => (
                  <circle key={i} cx={px(g.created_at)} cy={py(g.prijs)} r="3" fill={d.kleur}>
                    <title>{d.naam}: €{g.prijs.toFixed(2)} op {datumKort(g.created_at)}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 mt-2">
          {drankenMetData.map(d => (
            <div key={d.naam} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: d.kleur }} />
              {d.naam}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPrijzen() {
  const [venues, setVenues]           = useState([]);
  const [selectVenue, setSelectVenue] = useState(null);
  const [prijzen, setPrijzen]         = useState({});
  const [geschiedenis, setGeschiedenis] = useState([]);
  const [laden, setLaden]             = useState(true);
  const [bezig, setBezig]             = useState(false);
  const [melding, setMelding]         = useState('');
  const [syncBezig, setSyncBezig]     = useState(false);
  const [syncMelding, setSyncMelding] = useState('');

  useEffect(() => {
    supabase.from('venues').select('id, naam').order('naam').then(({ data }) => {
      setVenues(data || []);
      setLaden(false);
    });
  }, []);

  async function selecteerVenue(venue) {
    setSelectVenue(venue);
    const [prijsRes, histRes] = await Promise.all([
      supabase.from('bierprijzen').select('*').eq('venue_id', venue.id),
      supabase.from('prijs_geschiedenis').select('*').eq('venue_id', venue.id).order('created_at', { ascending: true }),
    ]);
    const map = {};
    (prijsRes.data || []).forEach(r => { map[r.drankje] = String(r.prijs); });
    setPrijzen({ ...Object.fromEntries(DRANKEN.map(d => [d.naam, ''])), ...map });
    setGeschiedenis(histRes.data || []);
  }

  async function syncPrijzen() {
    if (!selectVenue) return;
    setSyncBezig(true);
    setSyncMelding('');
    const { data: vd } = await supabase.from('venues').select('website,google_reviews').eq('id', selectVenue.id).single();
    const res = await fetch('/api/sync-prijzen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam: selectVenue.naam, website: vd?.website || null, googleReviews: vd?.google_reviews || [] }),
    });
    const data = await res.json();
    setSyncBezig(false);
    if (!res.ok || !data.prijzen) { setSyncMelding('❌ Ophalen mislukt'); return; }
    if (data.aantalGevonden === 0) { setSyncMelding('⚠️ Geen prijzen gevonden op de website of in reviews'); return; }
    setPrijzen(prev => {
      const nieuw = { ...prev };
      for (const [d, p] of Object.entries(data.prijzen)) {
        if (DRANKEN.find(dr => dr.naam === d)) nieuw[d] = String(p);
      }
      return nieuw;
    });
    setSyncMelding(`✓ ${data.aantalGevonden} prijs${data.aantalGevonden !== 1 ? 'en' : ''} gevonden via ${data.bronnen.join(', ')} — controleer en sla op`);
  }

  async function opslaanPrijzen(e) {
    e.preventDefault();
    if (!selectVenue) return;
    setBezig(true);

    const { data: { user } } = await supabase.auth.getUser();

    const rijen = DRANKEN
      .filter(d => prijzen[d.naam] !== '')
      .map(d => ({
        venue_id: selectVenue.id,
        venue_naam: selectVenue.naam,
        drankje: d.naam,
        prijs: parseFloat(prijzen[d.naam]),
        updated_at: new Date().toISOString(),
      }));

    await supabase.from('bierprijzen').delete().eq('venue_id', selectVenue.id);
    if (rijen.length > 0) await supabase.from('bierprijzen').insert(rijen);

    // Sla prijswijzigingen op in geschiedenis
    const historieRijen = rijen.map(r => ({
      venue_id: selectVenue.id,
      venue_naam: selectVenue.naam,
      drankje: r.drankje,
      prijs: r.prijs,
      gewijzigd_door: user?.email || null,
    }));
    if (historieRijen.length > 0) {
      await supabase.from('prijs_geschiedenis').insert(historieRijen);
    }

    // Herlaad geschiedenis
    const { data: histData } = await supabase.from('prijs_geschiedenis').select('*').eq('venue_id', selectVenue.id).order('created_at', { ascending: true });
    setGeschiedenis(histData || []);

    setMelding('Prijzen opgeslagen ✓');
    setTimeout(() => setMelding(''), 3000);
    setBezig(false);
  }

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Drankprijzen</h1>
          <p className="text-gray-500 text-sm mt-1">Stel drankprijzen in per locatie en bekijk het prijsverloop.</p>
        </div>

        {melding && <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>}

        <div className="grid grid-cols-3 gap-6">
          {/* Venue lijst */}
          <div className="col-span-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Locatie kiezen</p>
            {laden ? (
              <p className="text-gray-600 text-sm">Laden...</p>
            ) : venues.length === 0 ? (
              <p className="text-gray-600 text-sm">Geen locaties. <a href="/dashboard/admin/locaties" className="text-oranje">Voeg er een toe →</a></p>
            ) : (
              <div className="space-y-1">
                {venues.map(v => (
                  <button key={v.id} onClick={() => selecteerVenue(v)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: selectVenue?.id === v.id ? '#F27A00' : '#141414',
                      color: selectVenue?.id === v.id ? 'black' : '#888',
                      border: '1px solid',
                      borderColor: selectVenue?.id === v.id ? '#F27A00' : '#1e1e1e',
                    }}>
                    {v.naam}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prijzen editor + grafiek */}
          <div className="col-span-2 space-y-4">
            {!selectVenue ? (
              <div className="rounded-xl border border-[#1e1e1e] p-10 text-center" style={{ backgroundColor: '#141414' }}>
                <p className="text-gray-600 text-sm">Selecteer een locatie om de drankprijzen te bewerken.</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-col gap-2">
                  <button type="button" onClick={syncPrijzen} disabled={syncBezig}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm font-bold text-gray-300 hover:border-oranje hover:text-oranje transition-colors disabled:opacity-50 self-start">
                    {syncBezig
                      ? <><div className="w-3.5 h-3.5 border-2 border-oranje border-t-transparent rounded-full animate-spin" />Bezig...</>
                      : <><span>🔍</span> Prijzen automatisch ophalen</>}
                  </button>
                  {syncMelding && (
                    <p className={`text-xs px-3 py-1.5 rounded-lg border ${syncMelding.startsWith('✓') ? 'border-green-500/30 bg-green-500/5 text-green-400' : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500'}`}>
                      {syncMelding}
                    </p>
                  )}
                </div>
                <form onSubmit={opslaanPrijzen}>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Prijzen voor {selectVenue.naam}</p>
                  <div className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                    <div className="divide-y divide-[#1e1e1e]">
                      {DRANKEN.map(d => (
                        <div key={d.naam} className="flex items-center justify-between px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{d.emoji}</span>
                            <div>
                              <span className="font-semibold text-white text-sm">{d.naam}</span>
                              {d.sub && <p className="text-xs text-gray-600">{d.sub}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-sm">€</span>
                            <input type="number" min="0" step="0.10"
                              value={prijzen[d.naam] || ''}
                              onChange={e => setPrijzen(p => ({ ...p, [d.naam]: e.target.value }))}
                              placeholder="0.00"
                              className="w-24 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-oranje" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={bezig}
                    className="mt-4 w-full py-3 rounded-xl font-black uppercase text-black disabled:opacity-50"
                    style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                    {bezig ? 'Opslaan...' : 'Prijzen opslaan →'}
                  </button>
                  <p className="text-center text-gray-700 text-xs mt-2">Laat een veld leeg als dit drankje niet geserveerd wordt.</p>
                </form>

                {/* Prijsgrafiek */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Prijsverloop grafiek</p>
                  <PrijsGrafiek geschiedenis={geschiedenis} />
                </div>

                {/* Geschiedenis tabel */}
                {geschiedenis.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Recente wijzigingen</p>
                    <div className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                      <div className="divide-y divide-[#1e1e1e] max-h-48 overflow-y-auto">
                        {[...geschiedenis].reverse().slice(0, 30).map((g, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{DRANKEN.find(d=>d.naam===g.drankje)?.emoji || '🍺'}</span>
                              <span className="text-sm text-gray-300">{g.drankje}</span>
                              {g.gewijzigd_door && <span className="text-[10px] text-gray-600">door {g.gewijzigd_door}</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white text-sm">€{Number(g.prijs).toFixed(2)}</span>
                              <span className="text-[10px] text-gray-600">{datumKort(g.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
