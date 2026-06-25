'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

export default function AdminBonScans() {
  const [scans, setScans] = useState([]);
  const [laden, setLaden] = useState(true);
  const [filter, setFilter] = useState('wacht');
  const [bewerk, setBewerk] = useState(null); // { scan, dranken }
  const [melding, setMelding] = useState('');

  useEffect(() => { laad(); }, [filter]);

  async function laad() {
    setLaden(true);
    const { data } = await supabase.from('bon_scans').select('*')
      .eq('status', filter).order('aangemaakt_op', { ascending: false });
    setScans(data || []);
    setLaden(false);
  }

  function toonMeld(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  async function keur(id, status) {
    await supabase.from('bon_scans').update({ status }).eq('id', id);
    setScans(s => s.filter(x => x.id !== id));
    toonMeld(status === 'goedgekeurd' ? '✓ Goedgekeurd en prijzen bijgewerkt' : 'Afgewezen');
  }

  async function slaBewerkOp() {
    await supabase.from('bon_scans').update({
      locatie_naam: bewerk.locatie_naam,
      dranken: bewerk.dranken,
    }).eq('id', bewerk.id);
    setScans(s => s.map(x => x.id === bewerk.id ? { ...x, ...bewerk } : x));
    setBewerk(null);
    toonMeld('Opgeslagen ✓');
  }

  async function goedkeurEnVerwerk(scan) {
    // Zoek venue op naam
    const { data: venues } = await supabase.from('venues').select('id, naam').ilike('naam', `%${scan.locatie_naam}%`).limit(5);
    if (!venues?.length) {
      alert(`Geen locatie gevonden voor "${scan.locatie_naam}". Wijs handmatig toe.`);
      return;
    }
    const venue = venues[0];

    // Sla prijzen op
    const drankenPayload = scan.dranken.map(d => ({ naam: d.naam, prijs: d.prijs, venue_id: venue.id }));
    await supabase.from('dranken').upsert(drankenPayload, { onConflict: 'naam,venue_id' });
    await supabase.from('bon_scans').update({ status: 'goedgekeurd', venue_id: venue.id }).eq('id', scan.id);
    setScans(s => s.filter(x => x.id !== scan.id));
    toonMeld(`✓ ${scan.dranken.length} prijzen opgeslagen bij ${venue.naam}`);
  }

  const wachtend = scans.filter(s => s.status === 'wacht').length;

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-4xl">
        <h1 className="text-4xl font-black uppercase mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          Bon Scanner
        </h1>
        <p className="text-gray-500 text-sm mb-6">Gescande bonnetjes nakijken en goedkeuren</p>

        {melding && (
          <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>
        )}

        <div className="flex gap-2 mb-6">
          {[['wacht','Wacht op keuring'],['goedgekeurd','Goedgekeurd'],['afgewezen','Afgewezen']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === v ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
              {l}
            </button>
          ))}
        </div>

        {laden ? (
          <p className="text-gray-600 text-sm text-center py-20">Laden...</p>
        ) : scans.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-20">Geen scans gevonden</p>
        ) : (
          <div className="space-y-4">
            {scans.map(scan => (
              <div key={scan.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                <div className="flex gap-4 p-4">
                  {/* Bon afbeelding */}
                  {scan.afbeelding_url && (
                    <a href={scan.afbeelding_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={scan.afbeelding_url} alt="bon" className="w-24 h-32 object-cover rounded-lg border border-[#2a2a2a] hover:opacity-80 transition-opacity" />
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-white font-black text-lg" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                          {scan.locatie_naam || <span className="text-gray-500 italic">Locatie onbekend</span>}
                        </p>
                        <p className="text-gray-600 text-xs">{new Date(scan.aangemaakt_op).toLocaleString('nl-NL')}</p>
                      </div>
                      {filter === 'wacht' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setBewerk({ ...scan })}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:text-white">
                            Bewerk
                          </button>
                          <button onClick={() => keur(scan.id, 'afgewezen')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-900/40 hover:bg-red-950/30">
                            Afwijzen
                          </button>
                          <button onClick={() => goedkeurEnVerwerk(scan)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-black"
                            style={{ backgroundColor: '#F27A00' }}>
                            ✓ Goedkeuren
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Dranken tabel */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {(scan.dranken || []).map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-[#0d0d0d] rounded-lg px-3 py-1.5">
                          <span className="text-gray-300 text-xs truncate">{d.naam}</span>
                          <span className="text-oranje text-xs font-bold ml-2 flex-shrink-0">€{Number(d.prijs).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bewerk modal */}
        {bewerk && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="w-full max-w-lg rounded-2xl border border-[#2a2a2a] p-6 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: '#141414' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black uppercase text-lg" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Bewerk scan</h2>
                <button onClick={() => setBewerk(null)} className="text-gray-600 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Locatienaam</label>
                  <input value={bewerk.locatie_naam || ''} onChange={e => setBewerk(b => ({ ...b, locatie_naam: e.target.value }))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Dranken</label>
                  {bewerk.dranken.map((d, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={d.naam} onChange={e => setBewerk(b => ({ ...b, dranken: b.dranken.map((x,j) => j===i ? {...x, naam: e.target.value} : x) }))}
                        placeholder="Naam" className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje" />
                      <input type="number" step="0.01" value={d.prijs} onChange={e => setBewerk(b => ({ ...b, dranken: b.dranken.map((x,j) => j===i ? {...x, prijs: parseFloat(e.target.value)} : x) }))}
                        placeholder="€" className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje" />
                      <button onClick={() => setBewerk(b => ({ ...b, dranken: b.dranken.filter((_,j) => j!==i) }))}
                        className="text-red-400 hover:text-red-300 px-2">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setBewerk(b => ({ ...b, dranken: [...b.dranken, { naam: '', prijs: 0 }] }))}
                    className="text-xs text-oranje hover:text-orange-400 mt-1">+ Drank toevoegen</button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={slaBewerkOp}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase text-black"
                    style={{ backgroundColor: '#F27A00' }}>Opslaan</button>
                  <button onClick={() => setBewerk(null)}
                    className="px-4 py-2.5 rounded-xl text-sm text-gray-500 border border-[#2a2a2a] hover:text-white">Annuleer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
