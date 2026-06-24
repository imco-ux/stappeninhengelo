'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const LABEL_SUGGESTIES = ['50% KORT', '1+1', 'GRATIS', '2+1', 'HAPPY HOUR', 'DEAL'];

const leegForm = {
  titel: '', omschrijving: '', label: '',
  hot: false, gepubliceerd: true,
  foto_url: '',
  venue_id: '', event_id: '',
  geldigheid: 'datums',     // 'datums' | 'vaste_dagen' | 'onbepaald'
  geldig_van: '', geldig_tot: '',
  vaste_dagen: [],
  weken: 4,                 // voor vaste_dagen: aantal weken (1-8)
  onbepaalde_tijd: false,
};

const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje transition-colors';

function geldigheidsLabel(actie) {
  if (actie.onbepaalde_tijd) return 'Altijd geldig';
  if (actie.vaste_dagen?.length) return actie.vaste_dagen.map(d => DAGEN_KORT[d]).join(' · ');
  if (actie.geldig_tot) return `t/m ${new Date(actie.geldig_tot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return '–';
}

export default function AdminActies() {
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

  useEffect(() => { laad(); laadVenues(); laadEvents(); }, []);

  async function laad() {
    setLaden(true);
    const { data } = await supabase
      .from('acties')
      .select(`*, venue:venue_id(id, naam, logo_url, fotos), event:event_id(id, title, poster_url)`)
      .order('hot', { ascending: false })
      .order('geldig_tot', { ascending: true, nullsLast: true });
    setActies(data || []);
    setLaden(false);
  }

  async function laadVenues() {
    const { data } = await supabase.from('venues').select('id, naam, logo_url').order('naam');
    setVenues(data || []);
  }

  async function laadEvents() {
    const grens = new Date();
    grens.setDate(grens.getDate() - 7);
    const { data } = await supabase.from('events').select('id, title, datum, poster_url')
      .gte('datum', grens.toISOString().slice(0,10))
      .order('datum', { ascending: true });
    setEvents(data || []);
  }

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleDag(d) {
    setForm(f => ({
      ...f,
      vaste_dagen: f.vaste_dagen.includes(d)
        ? f.vaste_dagen.filter(x => x !== d)
        : [...f.vaste_dagen, d].sort(),
    }));
  }

  function bewerk(a) {
    let geldigheid = 'datums';
    if (a.onbepaalde_tijd) geldigheid = 'onbepaald';
    else if (a.vaste_dagen?.length) geldigheid = 'vaste_dagen';

    setForm({
      titel: a.titel || '',
      omschrijving: a.omschrijving || '',
      label: a.label || '',
      hot: a.hot ?? false,
      gepubliceerd: a.gepubliceerd ?? true,
      foto_url: a.foto_url || '',
      venue_id: a.venue_id || '',
      event_id: a.event_id || '',
      geldigheid,
      geldig_van: a.geldig_van || '',
      geldig_tot: a.geldig_tot || '',
      vaste_dagen: a.vaste_dagen || [],
      weken: 4,
      onbepaalde_tijd: a.onbepaalde_tijd ?? false,
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
    setBezig(true);

    // Bereken vaste_dagen geldig_tot als er weken zijn ingesteld
    let geldig_tot = form.geldig_tot || null;
    let geldig_van = form.geldig_van || null;
    let vaste_dagen = null;
    let onbepaalde_tijd = false;

    if (form.geldigheid === 'onbepaald') {
      onbepaalde_tijd = true;
      geldig_van = null;
      geldig_tot = null;
    } else if (form.geldigheid === 'vaste_dagen') {
      vaste_dagen = form.vaste_dagen;
      geldig_van = new Date().toISOString().slice(0,10);
      const eind = new Date();
      eind.setDate(eind.getDate() + (form.weken * 7));
      geldig_tot = eind.toISOString().slice(0,10);
    }

    const payload = {
      titel: form.titel,
      omschrijving: form.omschrijving || null,
      label: form.label.slice(0, 10) || null,
      hot: form.hot,
      gepubliceerd: form.gepubliceerd,
      foto_url: form.foto_url || null,
      venue_id: form.venue_id || null,
      event_id: form.event_id || null,
      geldig_van,
      geldig_tot,
      vaste_dagen,
      onbepaalde_tijd,
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

  async function toggleHot(a) {
    await supabase.from('acties').update({ hot: !a.hot }).eq('id', a.id);
    setActies(list => list.map(x => x.id === a.id ? { ...x, hot: !a.hot } : x));
  }

  async function togglePubliceer(a) {
    await supabase.from('acties').update({ gepubliceerd: !a.gepubliceerd }).eq('id', a.id);
    setActies(list => list.map(x => x.id === a.id ? { ...x, gepubliceerd: !a.gepubliceerd } : x));
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 3000); }

  const preview = form.venue_id
    ? venues.find(v => v.id === form.venue_id)
    : form.event_id
      ? events.find(e => e.id === form.event_id)
      : null;

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Acties</h1>
            <p className="text-gray-500 text-sm mt-1">{acties.length} acties · {acties.filter(a => a.hot).length} hot</p>
          </div>
          <button onClick={nieuw}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuwe actie
          </button>
        </div>

        {melding && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${melding.startsWith('Fout') ? 'bg-red-950/30 border border-red-800/40 text-red-400' : 'bg-green-950/30 border border-green-800/40 text-green-400'}`}>
            {melding}
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
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">
                    Label <span className="font-normal normal-case text-gray-700">max 10 tekens</span>
                  </label>
                  <input value={form.label} onChange={e => upd('label', e.target.value.toUpperCase().slice(0,10))}
                    maxLength={10} className={INP} placeholder="50% KORT" />
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {LABEL_SUGGESTIES.map(s => (
                      <button key={s} type="button" onClick={() => upd('label', s)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${form.label === s ? 'border-oranje text-oranje' : 'border-[#2a2a2a] text-gray-600 hover:border-oranje hover:text-oranje'}`}>
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

              {/* Koppeling: venue of event */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Koppel aan locatie</label>
                  <select value={form.venue_id} onChange={e => { upd('venue_id', e.target.value); if (e.target.value) upd('event_id', ''); }} className={INP}>
                    <option value="">— Geen —</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.naam}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Koppel aan event</label>
                  <select value={form.event_id} onChange={e => { upd('event_id', e.target.value); if (e.target.value) upd('venue_id', ''); }} className={INP}>
                    <option value="">— Geen —</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title} ({e.datum})</option>)}
                  </select>
                </div>
              </div>

              {/* Foto upload */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">
                  Eigen foto <span className="font-normal normal-case text-gray-700">4:5 verhouding aanbevolen · overschrijft de zaak/event foto</span>
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center" style={{ width: 72, height: 90 }}>
                    {form.foto_url
                      ? <img src={form.foto_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-gray-700 text-[10px] text-center px-1">4:5</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-gray-300 hover:border-oranje hover:text-oranje transition-colors">
                      {fotoBezig
                        ? <><div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />Uploaden...</>
                        : <>↑ Foto uploaden</>}
                      <input type="file" accept="image/*" onChange={uploadFoto} className="hidden" disabled={fotoBezig} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input value={form.foto_url} onChange={e => upd('foto_url', e.target.value)}
                        placeholder="Of plak een URL..." className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-oranje" />
                      {form.foto_url && <button type="button" onClick={() => upd('foto_url', '')} className="text-xs text-red-400 flex-shrink-0">Verwijder</button>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Geldigheid */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Geldigheid</label>
                <div className="flex gap-2 mb-3">
                  {[['datums','Specifieke datum(s)'],['vaste_dagen','Vaste dag(en)'],['onbepaald','Onbepaalde tijd']].map(([v,l]) => (
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
                      <input type="date" value={form.geldig_van} onChange={e => upd('geldig_van', e.target.value)}
                        className={INP + ' [color-scheme:dark]'} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Geldig t/m</label>
                      <input type="date" value={form.geldig_tot} onChange={e => upd('geldig_tot', e.target.value)}
                        className={INP + ' [color-scheme:dark]'} />
                    </div>
                  </div>
                )}

                {form.geldigheid === 'vaste_dagen' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-2">Welke dag(en)?</label>
                      <div className="flex gap-2 flex-wrap">
                        {DAGEN.map((d, i) => (
                          <button key={i} type="button" onClick={() => toggleDag(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.vaste_dagen.includes(i) ? 'bg-oranje border-oranje text-black' : 'border-[#2a2a2a] text-gray-500 hover:border-oranje hover:text-white'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 flex-shrink-0">Geldig voor</label>
                      <input type="range" min="1" max="8" value={form.weken} onChange={e => upd('weken', +e.target.value)}
                        className="flex-1 accent-oranje" />
                      <span className="text-sm font-bold text-white flex-shrink-0 w-20">{form.weken} week{form.weken > 1 ? 'en' : ''}</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Geldig t/m {(() => { const d = new Date(); d.setDate(d.getDate() + form.weken * 7); return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); })()}
                    </p>
                  </div>
                )}

                {form.geldigheid === 'onbepaald' && (
                  <div className="rounded-lg border border-[#2a2a2a] px-4 py-3 text-sm text-gray-500">
                    Actie blijft permanent zichtbaar tot je hem handmatig offline haalt.
                  </div>
                )}
              </div>

              {/* HOT + Gepubliceerd */}
              <div className="flex items-center gap-6 pt-1">
                <button type="button" onClick={() => upd('hot', !form.hot)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${form.hot ? 'bg-oranje border-oranje text-black' : 'border-[#2a2a2a] text-gray-500 hover:border-oranje hover:text-white'}`}>
                  🔥 HOT
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => upd('gepubliceerd', !form.gepubliceerd)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.gepubliceerd ? 'bg-green-600' : 'bg-[#333]'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.gepubliceerd ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className={`text-sm font-semibold ${form.gepubliceerd ? 'text-green-400' : 'text-gray-500'}`}>
                    {form.gepubliceerd ? 'Live' : 'Concept'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
                <button type="submit" disabled={bezig}
                  className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {bezig ? 'Opslaan...' : bewerkId ? 'Wijzigingen opslaan' : 'Aanmaken'}
                </button>
                <button type="button" onClick={() => setToonForm(false)}
                  className="px-6 py-2.5 rounded-lg text-sm text-gray-400 border border-[#333] hover:text-white">
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
            <p className="text-gray-600 text-sm mb-4">Nog geen acties aangemaakt.</p>
            <button onClick={nieuw} className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Eerste actie →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {acties.map(a => {
              const foto = a.foto_url || a.event?.poster_url || a.venue?.fotos?.[0] || null;
              const gekoppeld = a.venue?.naam || a.event?.title || '—';
              return (
                <div key={a.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden flex" style={{ backgroundColor: '#141414' }}>
                  {/* Foto */}
                  <div className="w-16 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1e1e1e] overflow-hidden flex items-center justify-center" style={{ minHeight: 80 }}>
                    {foto
                      ? <img src={foto} alt="" className="w-full h-full object-cover" />
                      : <span className="text-gray-700 text-xs">–</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.hot && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-oranje text-black">🔥 HOT</span>}
                      {a.label && <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 text-white bg-black/50">{a.label}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.gepubliceerd ? 'bg-green-950/50 text-green-400' : 'bg-gray-900 text-gray-600'}`}>
                        {a.gepubliceerd ? '● Live' : '○ Concept'}
                      </span>
                      <span className="text-[10px] text-gray-700 ml-auto">{geldigheidsLabel(a)}</span>
                    </div>
                    <p className="font-bold text-white text-sm truncate">{a.titel}</p>
                    <p className="text-xs text-gray-600 truncate">{gekoppeld}</p>
                  </div>

                  {/* Acties */}
                  <div className="flex flex-col justify-center gap-1.5 px-4 flex-shrink-0 border-l border-[#1e1e1e]">
                    <button onClick={() => toggleHot(a)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${a.hot ? 'bg-oranje border-oranje text-black' : 'border-[#2a2a2a] text-gray-600 hover:border-oranje hover:text-oranje'}`}>
                      🔥
                    </button>
                    <button onClick={() => bewerk(a)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-black"
                      style={{ backgroundColor: '#F27A00' }}>
                      Bewerk
                    </button>
                    <button onClick={() => togglePubliceer(a)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${a.gepubliceerd ? 'border-red-900/40 text-red-400 hover:bg-red-950/30' : 'border-green-900/40 text-green-400 hover:bg-green-950/30'}`}>
                      {a.gepubliceerd ? 'Offline' : 'Publiceer'}
                    </button>
                    <button onClick={() => verwijder(a.id)}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-[#2a2a2a] hover:text-red-400 transition-colors">
                      ✕
                    </button>
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
