'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const TYPES = ['groep', 'persoon', 'drinker'];
const TYPE_LABEL = { groep: '👥 Groep', persoon: '🎯 Persoon', drinker: '🍺 Drinker' };

export default function AdminKroegentocht() {
  const [opdrachten, setOpdrachten] = useState([]);
  const [venues, setVenues] = useState([]);
  const [laden, setLaden] = useState(true);
  const [melding, setMelding] = useState('');
  const [toonForm, setToonForm] = useState(false);
  const [bewerkId, setBewerkId] = useState(null);
  const [filter, setFilter] = useState('alle');
  const [form, setForm] = useState({ tekst: '', type: 'groep', venue_id: '' });
  const [bezig, setBezig] = useState(false);

  useEffect(() => { laad(); }, []);

  async function laad() {
    setLaden(true);
    const [opRes, venRes] = await Promise.all([
      supabase.from('kroegentocht_opdrachten').select('*, venues(naam)').order('created_at', { ascending: false }),
      supabase.from('venues').select('id, naam').eq('actief', true).order('naam'),
    ]);
    setOpdrachten(opRes.data || []);
    setVenues(venRes.data || []);
    setLaden(false);
  }

  function upd(v, w) { setForm(f => ({ ...f, [v]: w })); }

  function nieuw() {
    setForm({ tekst: '', type: 'groep', venue_id: '' });
    setBewerkId(null);
    setToonForm(true);
  }

  function bewerkOp(op) {
    setForm({ tekst: op.tekst, type: op.type || 'groep', venue_id: op.venue_id || '' });
    setBewerkId(op.id);
    setToonForm(true);
  }

  async function opslaan(e) {
    e.preventDefault();
    setBezig(true);
    const payload = {
      tekst: form.tekst,
      type: form.type,
      venue_id: form.venue_id || null,
      goedgekeurd: true,
    };
    if (bewerkId) {
      await supabase.from('kroegentocht_opdrachten').update(payload).eq('id', bewerkId);
    } else {
      await supabase.from('kroegentocht_opdrachten').insert(payload);
    }
    toonMeld('Opgeslagen ✓');
    setToonForm(false);
    setBezig(false);
    laad();
  }

  async function keur(id, goed) {
    await supabase.from('kroegentocht_opdrachten').update({ goedgekeurd: goed }).eq('id', id);
    setOpdrachten(ops => ops.map(o => o.id === id ? { ...o, goedgekeurd: goed } : o));
    toonMeld(goed ? 'Goedgekeurd ✓' : 'Op hold gezet');
  }

  async function verwijder(id) {
    if (!confirm('Opdracht verwijderen?')) return;
    await supabase.from('kroegentocht_opdrachten').delete().eq('id', id);
    setOpdrachten(ops => ops.filter(o => o.id !== id));
  }

  function toonMeld(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  const gefilterd = opdrachten.filter(o =>
    filter === 'alle' ? true : filter === 'wacht' ? !o.goedgekeurd : o.goedgekeurd
  );
  const wachtend = opdrachten.filter(o => !o.goedgekeurd).length;

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje';

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Kroegentocht Opdrachten
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {opdrachten.filter(o => o.goedgekeurd).length} actief
              {wachtend > 0 && <span className="text-yellow-400 ml-2">· {wachtend} wacht op goedkeuring</span>}
            </p>
          </div>
          <button onClick={nieuw}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuwe opdracht
          </button>
        </div>

        {melding && <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>}

        {toonForm && (
          <div className="mb-6 rounded-xl border border-[#F27A00]/30 p-6" style={{ backgroundColor: '#141414' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black uppercase text-sm text-oranje" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {bewerkId ? 'Opdracht bewerken' : 'Nieuwe opdracht'}
              </p>
              <button onClick={() => setToonForm(false)} className="text-gray-600 hover:text-white">✕</button>
            </div>
            <form onSubmit={opslaan} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Opdracht tekst *</label>
                <textarea value={form.tekst} onChange={e => upd('tekst', e.target.value)} required rows={3}
                  placeholder="Gebruik {naam} voor een willekeurig persoon, {drinker} voor iemand die drinkt, {allen} voor iedereen..."
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
                <p className="text-xs text-gray-600 mt-1">
                  Variabelen: <code className="text-oranje/70">{'{naam}'}</code> willekeurig persoon · <code className="text-oranje/70">{'{drinker}'}</code> iemand die drinkt · <code className="text-oranje/70">{'{allen}'}</code> iedereen
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Type</label>
                  <select value={form.type} onChange={e => upd('type', e.target.value)} className={INP}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Locatie (optioneel)</label>
                  <select value={form.venue_id} onChange={e => upd('venue_id', e.target.value)} className={INP}>
                    <option value="">— Alle locaties —</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.naam}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={bezig}
                  className="px-5 py-2 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {bezig ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button type="button" onClick={() => setToonForm(false)}
                  className="px-5 py-2 rounded-lg text-sm text-gray-500 border border-[#2a2a2a] hover:text-white">
                  Annuleer
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {[['alle','Alle'],['goedgekeurd','Actief'],['wacht','Wacht op keuring']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === v ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
              {l}{v === 'wacht' && wachtend > 0 ? ` (${wachtend})` : ''}
            </button>
          ))}
        </div>

        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : (
          <div className="space-y-2">
            {gefilterd.map(op => (
              <div key={op.id} className={`rounded-xl border p-4 ${op.goedgekeurd ? 'border-[#1e1e1e] bg-[#141414]' : 'border-yellow-800/40 bg-yellow-950/10'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-[#1e1e1e] text-gray-400 flex-shrink-0 mt-0.5">
                    {TYPE_LABEL[op.type] || op.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-relaxed">{op.tekst}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {op.venues?.naam ? `📍 ${op.venues.naam}` : '🌐 Alle locaties'}
                      {!op.goedgekeurd && <span className="ml-2 text-yellow-500">⏳ Wacht op goedkeuring</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!op.goedgekeurd && (
                      <button onClick={() => keur(op.id, true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-900/50 text-green-400 hover:bg-green-900 transition-colors">
                        ✓ Keur goed
                      </button>
                    )}
                    {op.goedgekeurd && (
                      <button onClick={() => keur(op.id, false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-500 hover:text-yellow-400 transition-colors">
                        On hold
                      </button>
                    )}
                    <button onClick={() => bewerkOp(op)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-black"
                      style={{ backgroundColor: '#F27A00' }}>
                      Bewerk
                    </button>
                    <button onClick={() => verwijder(op.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-900/40 hover:bg-red-950/30 transition-colors">✕</button>
                  </div>
                </div>
              </div>
            ))}
            {gefilterd.length === 0 && (
              <div className="text-center py-12 text-gray-600 text-sm">Geen opdrachten gevonden</div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
