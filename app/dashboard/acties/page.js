'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { supabase } from '@/lib/supabase';

const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const LABEL_SUGGESTIES = ['50% KORT', '1+1', 'GRATIS', '2+1', 'HAPPY HOUR', 'DEAL'];

const leegForm = {
  titel: '', omschrijving: '', label: '',
  foto_url: '', venue_id: '', event_id: '',
  geldigheid: 'datums',
  geldig_van: '', geldig_tot: '',
  vaste_dagen: [], weken: 4,
};

const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje transition-colors';

function geldigLabel(a) {
  if (a.onbepaalde_tijd) return 'Altijd geldig';
  if (a.vaste_dagen?.length) return a.vaste_dagen.map(d => DAGEN_KORT[d]).join(' · ');
  if (a.geldig_tot) return `t/m ${new Date(a.geldig_tot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`;
  return '–';
}

export default function PartnerActies() {
  const [acties, setActies]       = useState([]);
  const [venues, setVenues]       = useState([]);
  const [events, setEvents]       = useState([]);
  const [laden, setLaden]         = useState(true);
  const [form, setForm]           = useState(leegForm);
  const [bewerkId, setBewerkId]   = useState(null);
  const [toonForm, setToonForm]   = useState(false);
  const [bezig, setBezig]         = useState(false);
  const [fotoBezig, setFotoBezig] = useState(false);
  const [melding, setMelding]     = useState('');

  useEffect(() => { laad(); }, []);

  async function laad() {
    setLaden(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [venueRes, eventRes] = await Promise.all([
      supabase.from('venues').select('id, naam, fotos, logo_url').eq('eigenaar_id', user.id).order('naam'),
      supabase.from('events').select('id, title, datum, poster_url').eq('eigenaar_id', user.id)
        .gte('datum', new Date().toISOString().slice(0,10)).order('datum'),
    ]);

    const myVenues = venueRes.data || [];
    const myEvents = eventRes.data || [];
    setVenues(myVenues);
    setEvents(myEvents);

    const venueIds = myVenues.map(v => v.id);
    if (venueIds.length > 0) {
      const { data } = await supabase.from('acties')
        .select('*')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false });
      setActies(data || []);
    }
    setLaden(false);
  }

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleDag(d) {
    setForm(f => ({
      ...f,
      vaste_dagen: f.vaste_dagen.includes(d) ? f.vaste_dagen.filter(x => x !== d) : [...f.vaste_dagen, d].sort(),
    }));
  }

  function bewerk(a) {
    let geldigheid = 'datums';
    if (a.onbepaalde_tijd) geldigheid = 'datums'; // partner kan geen onbepaald kiezen
    else if (a.vaste_dagen?.length) geldigheid = 'vaste_dagen';
    setForm({
      titel: a.titel || '', omschrijving: a.omschrijving || '', label: a.label || '',
      foto_url: a.foto_url || '', venue_id: a.venue_id || '', event_id: a.event_id || '',
      geldigheid, geldig_van: a.geldig_van || '', geldig_tot: a.geldig_tot || '',
      vaste_dagen: a.vaste_dagen || [], weken: 4,
    });
    setBewerkId(a.id);
    setToonForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nieuw() { setForm(leegForm); setBewerkId(null); setToonForm(true); }

  async function uploadFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `actie-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('venue-fotos').upload(naam, file, { contentType: file.type, upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('venue-fotos').getPublicUrl(naam);
      upd('foto_url', data.publicUrl);
    }
    setFotoBezig(false);
  }

  async function opslaan(e) {
    e.preventDefault();
    if (!form.venue_id && !form.event_id) { toonMelding('Koppel de actie aan een locatie of event'); return; }
    setBezig(true);

    let geldig_tot = form.geldig_tot || null;
    let geldig_van = form.geldig_van || null;
    let vaste_dagen = null;

    if (form.geldigheid === 'vaste_dagen') {
      vaste_dagen = form.vaste_dagen;
      geldig_van = new Date().toISOString().slice(0, 10);
      const eind = new Date();
      eind.setDate(eind.getDate() + form.weken * 7);
      geldig_tot = eind.toISOString().slice(0, 10);
    }

    const payload = {
      titel: form.titel, omschrijving: form.omschrijving || null,
      label: form.label.slice(0, 10) || null,
      hot: false, gepubliceerd: true,
      foto_url: form.foto_url || null,
      venue_id: form.venue_id || null,
      event_id: form.event_id || null,
      geldig_van, geldig_tot, vaste_dagen,
      onbepaalde_tijd: false,
    };

    if (bewerkId) {
      await supabase.from('acties').update(payload).eq('id', bewerkId);
      toonMelding('Actie opgeslagen ✓');
    } else {
      const { error } = await supabase.from('acties').insert(payload);
      if (error) { toonMelding('Fout: ' + error.message); setBezig(false); return; }
      toonMelding('Actie aangemaakt ✓');
    }
    setBezig(false);
    setToonForm(false);
    laad();
  }

  async function verwijder(id) {
    if (!confirm('Actie verwijderen?')) return;
    await supabase.from('acties').delete().eq('id', id);
    setActies(a => a.filter(x => x.id !== id));
    toonMelding('Actie verwijderd');
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  return (
    <DashboardShell>
      <div className="px-6 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Acties & Deals</h1>
            <p className="text-gray-500 text-sm mt-1">Zichtbaar op jouw locatiepagina en de actiespagina</p>
          </div>
          <button onClick={nieuw}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuwe actie
          </button>
        </div>

        {melding && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${melding.startsWith('Fout') || melding.startsWith('Koppel') ? 'bg-red-950/30 border border-red-800/40 text-red-400' : 'bg-green-950/30 border border-green-800/40 text-green-400'}`}>
            {melding}
          </div>
        )}

        {venues.length === 0 && !laden && (
          <div className="rounded-xl border border-yellow-900/30 bg-yellow-950/10 p-5 mb-6 text-sm text-yellow-400">
            Je hebt nog geen locatie aangemeld. Ga naar <a href="/dashboard/profiel" className="underline font-bold">Mijn Profiel</a> om je zaak toe te voegen.
          </div>
        )}

        {/* Formulier */}
        {toonForm && (
          <div className="mb-8 rounded-xl border border-oranje/30 p-6" style={{ backgroundColor: '#141414' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-black uppercase text-sm text-oranje" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {bewerkId ? 'Actie bewerken' : 'Nieuwe actie'}
              </p>
              <button onClick={() => setToonForm(false)} className="text-gray-600 hover:text-white">✕</button>
            </div>

            <form onSubmit={opslaan} className="space-y-5">
              {/* Titel + Label */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Titel *</label>
                  <input value={form.titel} onChange={e => upd('titel', e.target.value)} required className={INP} placeholder="Bijv. Happy Hour bier" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Label <span className="font-normal normal-case text-gray-700">max 10</span></label>
                  <input value={form.label} onChange={e => upd('label', e.target.value.toUpperCase().slice(0,10))} maxLength={10} className={INP} placeholder="50% KORT" />
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {LABEL_SUGGESTIES.map(s => (
                      <button key={s} type="button" onClick={() => upd('label', s)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${form.label === s ? 'border-oranje text-oranje' : 'border-[#2a2a2a] text-gray-600 hover:border-oranje'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Omschrijving */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Omschrijving</label>
                <textarea value={form.omschrijving} onChange={e => upd('omschrijving', e.target.value)}
                  rows={3} className={INP + ' resize-none'} placeholder="Bijv. Elke vrijdag van 17-19u bier voor €2,–" />
              </div>

              {/* Koppeling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Mijn locatie</label>
                  <select value={form.venue_id} onChange={e => { upd('venue_id', e.target.value); if (e.target.value) upd('event_id', ''); }} className={INP}>
                    <option value="">— Kies locatie —</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.naam}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Mijn event</label>
                  <select value={form.event_id} onChange={e => { upd('event_id', e.target.value); if (e.target.value) upd('venue_id', ''); }} className={INP}>
                    <option value="">— Kies event —</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title} ({e.datum})</option>)}
                  </select>
                </div>
              </div>

              {/* Foto */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Eigen foto <span className="font-normal normal-case text-gray-700">4:5 — optioneel</span></label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center" style={{ width: 56, height: 70 }}>
                    {form.foto_url ? <img src={form.foto_url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-700 text-[10px]">4:5</span>}
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-gray-300 hover:border-oranje hover:text-oranje transition-colors">
                    {fotoBezig ? <><div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />Uploaden...</> : <>↑ Uploaden</>}
                    <input type="file" accept="image/*" onChange={uploadFoto} className="hidden" disabled={fotoBezig} />
                  </label>
                  {form.foto_url && <button type="button" onClick={() => upd('foto_url', '')} className="text-xs text-red-400">Verwijder</button>}
                </div>
              </div>

              {/* Geldigheid */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Geldigheid</label>
                <div className="flex gap-2 mb-3">
                  {[['datums','Specifieke datum(s)'],['vaste_dagen','Vaste dag(en)']].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => upd('geldigheid', v)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${form.geldigheid === v ? 'bg-oranje border-oranje text-black' : 'border-[#2a2a2a] text-gray-400 hover:border-oranje hover:text-white'}`}>
                      {l}
                    </button>
                  ))}
                </div>

                {form.geldigheid === 'datums' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Geldig van</label>
                      <input type="date" value={form.geldig_van} onChange={e => upd('geldig_van', e.target.value)} className={INP + ' [color-scheme:dark]'} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Geldig t/m *</label>
                      <input type="date" value={form.geldig_tot} onChange={e => upd('geldig_tot', e.target.value)} required className={INP + ' [color-scheme:dark]'} />
                    </div>
                  </div>
                )}

                {form.geldigheid === 'vaste_dagen' && (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {DAGEN.map((d, i) => (
                        <button key={i} type="button" onClick={() => toggleDag(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.vaste_dagen.includes(i) ? 'bg-oranje border-oranje text-black' : 'border-[#2a2a2a] text-gray-500 hover:border-oranje'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">Geldig voor</span>
                      <input type="range" min="1" max="8" value={form.weken} onChange={e => upd('weken', +e.target.value)} className="flex-1 accent-oranje" />
                      <span className="text-sm font-bold text-white w-20">{form.weken} week{form.weken > 1 ? 'en' : ''}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
                <button type="submit" disabled={bezig}
                  className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {bezig ? 'Opslaan...' : bewerkId ? 'Wijzigingen opslaan' : 'Aanmaken'}
                </button>
                <button type="button" onClick={() => setToonForm(false)} className="px-6 py-2.5 rounded-lg text-sm text-gray-400 border border-[#333] hover:text-white">
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lijst */}
        {laden ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[#141414] animate-pulse" />)}</div>
        ) : acties.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] p-16 text-center" style={{ backgroundColor: '#141414' }}>
            <p className="text-gray-600 text-sm mb-2">Nog geen acties aangemaakt.</p>
            <p className="text-gray-700 text-xs mb-5">Maak een actie aan en die verschijnt automatisch op je locatiepagina.</p>
            <button onClick={nieuw} className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Eerste actie →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {acties.map(a => {
              const venue = venues.find(v => v.id === a.venue_id);
              const foto = a.foto_url || venue?.fotos?.[0] || null;
              return (
                <div key={a.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden flex" style={{ backgroundColor: '#141414' }}>
                  <div className="w-14 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1e1e1e] overflow-hidden flex items-center justify-center" style={{ minHeight: 72 }}>
                    {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-700 text-xs">–</span>}
                  </div>
                  <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.label && <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 text-white bg-black/50">{a.label}</span>}
                      <span className="text-[10px] text-gray-700">{geldigLabel(a)}</span>
                    </div>
                    <p className="font-bold text-white text-sm truncate">{a.titel}</p>
                    {a.omschrijving && <p className="text-xs text-gray-600 truncate">{a.omschrijving}</p>}
                  </div>
                  <div className="flex flex-col justify-center gap-1.5 px-4 flex-shrink-0 border-l border-[#1e1e1e]">
                    <button onClick={() => bewerk(a)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: '#F27A00' }}>Bewerk</button>
                    <button onClick={() => verwijder(a.id)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-[#2a2a2a] hover:text-red-400 transition-colors">Verwijder</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
