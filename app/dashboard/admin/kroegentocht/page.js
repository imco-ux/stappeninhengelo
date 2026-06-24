'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const leegForm = { naam: '', adres: '', omschrijving: '', volgorde: '', actief: true };

export default function AdminKroegentocht() {
  const [stops, setStops]       = useState([]);
  const [laden, setLaden]       = useState(true);
  const [form, setForm]         = useState(leegForm);
  const [bewerkId, setBewerkId] = useState(null);
  const [toonForm, setToonForm] = useState(false);
  const [opslaan, setOpslaan]   = useState(false);
  const [melding, setMelding]   = useState('');

  useEffect(() => { laad(); }, []);

  async function laad() {
    setLaden(true);
    const { data } = await supabase.from('kroegentocht').select('*').order('volgorde', { ascending: true });
    setStops(data || []);
    setLaden(false);
  }

  function bewerk(s) {
    setForm({ naam: s.naam||'', adres: s.adres||'', omschrijving: s.omschrijving||'', volgorde: s.volgorde||'', actief: s.actief??true });
    setBewerkId(s.id); setToonForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nieuw() { setForm({ ...leegForm, volgorde: stops.length + 1 }); setBewerkId(null); setToonForm(true); }
  function upd(v, val) { setForm(f => ({ ...f, [v]: val })); }

  async function opslaanForm(e) {
    e.preventDefault();
    setOpslaan(true);
    const payload = { naam: form.naam, adres: form.adres, omschrijving: form.omschrijving, volgorde: parseInt(form.volgorde)||null, actief: form.actief };
    if (bewerkId) { await supabase.from('kroegentocht').update(payload).eq('id', bewerkId); toonMelding('Stop opgeslagen ✓'); }
    else { await supabase.from('kroegentocht').insert(payload); toonMelding('Stop aangemaakt ✓'); }
    setOpslaan(false); setToonForm(false); laad();
  }

  async function verwijder(id) {
    if (!confirm('Stop verwijderen?')) return;
    await supabase.from('kroegentocht').delete().eq('id', id);
    setStops(s => s.filter(x => x.id !== id));
    toonMelding('Stop verwijderd');
  }

  async function verschuif(id, richting) {
    const idx = stops.findIndex(s => s.id === id);
    const nieuw = [...stops];
    const wissel = idx + richting;
    if (wissel < 0 || wissel >= nieuw.length) return;
    [nieuw[idx], nieuw[wissel]] = [nieuw[wissel], nieuw[idx]];
    const updates = nieuw.map((s, i) => supabase.from('kroegentocht').update({ volgorde: i + 1 }).eq('id', s.id));
    await Promise.all(updates);
    laad();
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Kroegentocht</h1>
            <p className="text-gray-500 text-sm mt-1">{stops.length} stops · sleep of gebruik pijlen om volgorde aan te passen</p>
          </div>
          <button onClick={nieuw}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuwe stop
          </button>
        </div>

        {melding && <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>}

        {toonForm && (
          <div className="mb-6 rounded-xl border border-[#F27A00]/30 p-6" style={{ backgroundColor: '#141414' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black uppercase text-sm" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
                {bewerkId ? 'Stop bewerken' : 'Nieuwe stop'}
              </p>
              <button onClick={() => setToonForm(false)} className="text-gray-600 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={opslaanForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Naam *</label>
                  <input value={form.naam} onChange={e=>upd('naam',e.target.value)} required
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Volgorde #</label>
                  <input type="number" min="1" value={form.volgorde} onChange={e=>upd('volgorde',e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Adres</label>
                  <input value={form.adres} onChange={e=>upd('adres',e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Omschrijving</label>
                  <textarea value={form.omschrijving} onChange={e=>upd('omschrijving',e.target.value)} rows={2}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="actief2" checked={form.actief} onChange={e=>upd('actief',e.target.checked)} className="accent-oranje" />
                  <label htmlFor="actief2" className="text-sm text-gray-400 cursor-pointer">Actief (zichtbaar op de route)</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={opslaan}
                  className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {opslaan ? 'Opslaan...' : bewerkId ? 'Opslaan' : 'Aanmaken'}
                </button>
                <button type="button" onClick={() => setToonForm(false)}
                  className="px-6 py-2.5 rounded-lg text-sm text-gray-400 border border-[#333] hover:text-white">Annuleren</button>
              </div>
            </form>
          </div>
        )}

        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : stops.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] p-16 text-center" style={{ backgroundColor: '#141414' }}>
            <p className="text-gray-600 text-sm mb-4">Nog geen stops toegevoegd.</p>
            <button onClick={nieuw} className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>Eerste stop →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {stops.map((s, idx) => (
              <div key={s.id} className="rounded-xl border border-[#1e1e1e] p-4 flex items-center gap-4" style={{ backgroundColor: '#141414' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                  style={{ backgroundColor: s.actief ? '#F27A00' : '#333' }}>
                  {s.volgorde || idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{s.naam}</p>
                  {s.adres && <p className="text-xs text-gray-500">{s.adres}</p>}
                  {s.omschrijving && <p className="text-xs text-gray-600 truncate">{s.omschrijving}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => verschuif(s.id, -1)} disabled={idx === 0}
                    className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 border border-[#2a2a2a]">↑</button>
                  <button onClick={() => verschuif(s.id, 1)} disabled={idx === stops.length - 1}
                    className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 border border-[#2a2a2a]">↓</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => bewerk(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-black"
                    style={{ backgroundColor: '#F27A00' }}>Bewerk</button>
                  <button onClick={() => verwijder(s.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-900/40 hover:bg-red-950/30 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
