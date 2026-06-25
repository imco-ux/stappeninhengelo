'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const UnsplashPicker = dynamic(() => import('@/components/UnsplashPicker'), { ssr: false });

const CATEGORIEEN = ['Nieuws', 'Feature', 'Events', 'Tip', 'Aanbieding'];
const catKleur = {
  Nieuws:     'bg-oranje/20 text-oranje',
  Feature:    'bg-purple-950/50 text-purple-400',
  Events:     'bg-green-950/50 text-green-400',
  Tip:        'bg-blue-950/50 text-blue-400',
  Aanbieding: 'bg-yellow-950/50 text-yellow-400',
};

const leegForm = {
  titel: '', subtitel: '', inhoud: '', foto: '',
  categorie: 'Nieuws', gepubliceerd: true,
  tagged_type: '', tagged_naam: '', tagged_slug: '',
};
const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje transition-colors';

export default function AdminNieuws() {
  const [tab, setTab]             = useState('eigen');
  const [items, setItems]         = useState([]);
  const [laden, setLaden]         = useState(true);
  const [form, setForm]           = useState(leegForm);
  const [bewerkId, setBewerkId]   = useState(null);
  const [toonForm, setToonForm]   = useState(false);
  const [bezig, setBezig]         = useState(false);
  const [fotoBezig, setFotoBezig] = useState(false);
  const [melding, setMelding]     = useState('');
  const [foutMelding, setFoutMelding] = useState('');

  const [venues, setVenues]       = useState([]);
  const [events, setEvents]       = useState([]);

  // Google Nieuws
  const [google, setGoogle]           = useState([]);
  const [googleLaden, setGoogleLaden] = useState(false);
  const [geblokkeerd, setGeblokkeerd] = useState([]);

  useEffect(() => { laad(); laadVenuesEvents(); laadGeblokkeerd(); }, []);

  async function laad() {
    setLaden(true);
    const grens = new Date();
    grens.setDate(grens.getDate() - 60);
    const { data } = await supabase.from('nieuws').select('*')
      .gte('created_at', grens.toISOString())
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLaden(false);
  }

  async function laadVenuesEvents() {
    const [venRes, evRes] = await Promise.all([
      supabase.from('venues').select('id, naam').eq('actief', true).order('naam'),
      supabase.from('events').select('id, title, slug, is_centrumbreed').eq('goedgekeurd', true)
        .gte('datum', new Date().toISOString().split('T')[0]).order('datum').limit(50),
    ]);
    setVenues(venRes.data || []);
    setEvents(evRes.data || []);
  }

  function laadGeblokkeerd() {
    try {
      setGeblokkeerd(JSON.parse(localStorage.getItem('nieuws_geblokkeerd') || '[]'));
    } catch {}
  }

  async function laadGoogle() {
    setGoogleLaden(true);
    const r = await fetch('/api/google-nieuws');
    const d = await r.json();
    setGoogle(d.artikelen || []);
    setGoogleLaden(false);
  }

  function bewerk(item) {
    setForm({
      titel: item.titel || '',
      subtitel: item.subtitel || '',
      inhoud: item.inhoud || '',
      foto: item.foto || '',
      categorie: item.categorie || 'Nieuws',
      gepubliceerd: item.gepubliceerd ?? true,
      tagged_type: item.tagged?.type || '',
      tagged_naam: item.tagged?.naam || '',
      tagged_slug: item.tagged?.slug || '',
    });
    setBewerkId(item.id);
    setFoutMelding('');
    setToonForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nieuw() {
    setForm(leegForm);
    setBewerkId(null);
    setFoutMelding('');
    setToonForm(true);
  }

  function upd(v, val) { setForm(f => ({ ...f, [v]: val })); }

  async function uploadFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `nieuws-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('venue-fotos').upload(naam, file, { contentType: file.type, upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('venue-fotos').getPublicUrl(naam);
      upd('foto', data.publicUrl);
    } else {
      toonMelding('Upload mislukt: ' + error.message, true);
    }
    setFotoBezig(false);
  }

  function kiesTag(type, naam, slug) {
    upd('tagged_type', type);
    upd('tagged_naam', naam);
    upd('tagged_slug', slug);
  }

  async function opslaanForm(e) {
    e.preventDefault();
    setBezig(true);
    setFoutMelding('');

    const tagged = form.tagged_type ? {
      type: form.tagged_type,
      naam: form.tagged_naam,
      slug: form.tagged_slug,
    } : null;

    const payload = {
      titel: form.titel,
      subtitel: form.subtitel,
      inhoud: form.inhoud,
      foto: form.foto || null,
      categorie: form.categorie,
      gepubliceerd: form.gepubliceerd,
      tagged,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (bewerkId) {
      ({ error } = await supabase.from('nieuws').update(payload).eq('id', bewerkId));
    } else {
      ({ error } = await supabase.from('nieuws').insert(payload));
    }

    if (error) {
      setFoutMelding('Fout bij opslaan: ' + error.message);
      setBezig(false);
      return;
    }

    toonMelding(bewerkId ? 'Bericht opgeslagen ✓' : 'Bericht aangemaakt ✓');
    setBezig(false);
    setToonForm(false);
    laad();
  }

  async function verwijder(id) {
    if (!confirm('Bericht permanent verwijderen?')) return;
    await supabase.from('nieuws').delete().eq('id', id);
    setItems(i => i.filter(x => x.id !== id));
    toonMelding('Bericht verwijderd');
  }

  async function togglePubliceer(item) {
    const nieuwStatus = !item.gepubliceerd;
    const { error } = await supabase.from('nieuws').update({ gepubliceerd: nieuwStatus }).eq('id', item.id);
    if (error) { toonMelding('Fout: ' + error.message, true); return; }
    setItems(its => its.map(x => x.id === item.id ? { ...x, gepubliceerd: nieuwStatus } : x));
    toonMelding(nieuwStatus ? 'Bericht gepubliceerd ✓' : 'Bericht offline gehaald');
  }

  function blokkeerArtikel(artikel) {
    const n = [...geblokkeerd, artikel.link];
    setGeblokkeerd(n);
    localStorage.setItem('nieuws_geblokkeerd', JSON.stringify(n));
    toonMelding('Artikel verborgen ✓');
  }

  function deblokkeerArtikel(link) {
    const n = geblokkeerd.filter(l => l !== link);
    setGeblokkeerd(n);
    localStorage.setItem('nieuws_geblokkeerd', JSON.stringify(n));
    toonMelding('Artikel weer zichtbaar');
  }

  function toonMelding(t, fout = false) {
    if (fout) setFoutMelding(t);
    else { setMelding(t); setTimeout(() => setMelding(''), 3000); }
  }

  const tagLabel = form.tagged_type ? `${form.tagged_type === 'venue' ? '📍' : form.tagged_type === 'centrumbreed' ? '🏙️' : '🎉'} ${form.tagged_naam}` : null;

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Nieuws & Highlights
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {items.length} eigen berichten · {items.filter(i => i.gepubliceerd).length} gepubliceerd
            </p>
          </div>
          {tab === 'eigen' && (
            <button onClick={nieuw}
              className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
              + Nieuw bericht
            </button>
          )}
        </div>

        {melding && (
          <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#1e1e1e] pb-4">
          {[['eigen','✏️ Eigen berichten'],['google','📰 Google Nieuws']].map(([v,l]) => (
            <button key={v} onClick={() => { setTab(v); if (v === 'google' && !google.length) laadGoogle(); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === v ? 'bg-oranje text-black' : 'text-gray-500 border border-[#2a2a2a] hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'eigen' && (
          <>
            {/* Formulier */}
            {toonForm && (
              <div className="mb-8 rounded-xl border border-oranje/30 p-6" style={{ backgroundColor: '#141414' }}>
                <div className="flex items-center justify-between mb-5">
                  <p className="font-black uppercase text-sm text-oranje" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                    {bewerkId ? 'Bericht bewerken' : 'Nieuw bericht'}
                  </p>
                  <button onClick={() => setToonForm(false)} className="text-gray-600 hover:text-white">✕</button>
                </div>

                {foutMelding && (
                  <div className="mb-4 bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">{foutMelding}</div>
                )}

                <form onSubmit={opslaanForm} className="space-y-5">

                  {/* Foto */}
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Foto</label>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-24 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex-shrink-0 flex items-center justify-center">
                        {form.foto
                          ? <img src={form.foto} alt="" className="w-full h-full object-cover" />
                          : <span className="text-gray-700 text-xs text-center px-2">Geen foto</span>}
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex gap-2 flex-wrap">
                          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] text-xs text-gray-300 hover:border-oranje hover:text-oranje transition-colors">
                            {fotoBezig
                              ? <><div className="w-3 h-3 border-2 border-oranje border-t-transparent rounded-full animate-spin" />Uploaden...</>
                              : <><span>↑</span> Upload</>}
                            <input type="file" accept="image/*" onChange={uploadFoto} className="hidden" disabled={fotoBezig} />
                          </label>
                          <UnsplashPicker zoekterm={form.titel} onKies={url => upd('foto', url)} />
                          {form.foto && (
                            <button type="button" onClick={() => upd('foto', '')} className="text-xs text-red-400 hover:text-red-300">Verwijder</button>
                          )}
                        </div>
                        <input value={form.foto} onChange={e => upd('foto', e.target.value)}
                          placeholder="Of plak een URL..."
                          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-oranje" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Titel *</label>
                    <input value={form.titel} onChange={e => upd('titel', e.target.value)} required className={INP} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Subtitel / samenvatting</label>
                      <input value={form.subtitel} onChange={e => upd('subtitel', e.target.value)} className={INP} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Categorie</label>
                      <select value={form.categorie} onChange={e => upd('categorie', e.target.value)} className={INP}>
                        {CATEGORIEEN.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Inhoud / tekst</label>
                    <textarea value={form.inhoud} onChange={e => upd('inhoud', e.target.value)} rows={6} className={INP + ' resize-none'} />
                  </div>

                  {/* Taggen */}
                  <div className="rounded-xl border border-[#2a2a2a] p-4 space-y-3" style={{ backgroundColor: '#0d0d0d' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Koppel aan locatie of event</p>
                      {form.tagged_type && (
                        <button type="button" onClick={() => { upd('tagged_type',''); upd('tagged_naam',''); upd('tagged_slug',''); }}
                          className="text-xs text-red-400 hover:text-red-300">Verwijder koppeling</button>
                      )}
                    </div>
                    {tagLabel && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-oranje/10 border border-oranje/30">
                        <span className="text-sm text-oranje font-bold">{tagLabel}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Venues */}
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase mb-1.5">📍 Locatie</p>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {venues.map(v => {
                            const slug = v.naam.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
                            return (
                              <button key={v.id} type="button"
                                onClick={() => kiesTag('venue', v.naam, slug)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${form.tagged_type === 'venue' && form.tagged_naam === v.naam ? 'bg-oranje text-black font-bold' : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'}`}>
                                {v.naam}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Events */}
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase mb-1.5">🎉 Event</p>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {events.filter(e => !e.is_centrumbreed).map(e => (
                            <button key={e.id} type="button"
                              onClick={() => kiesTag('event', e.title, e.slug)}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${form.tagged_type === 'event' && form.tagged_naam === e.title ? 'bg-oranje text-black font-bold' : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'}`}>
                              {e.title}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Centrumbreed events */}
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase mb-1.5">🏙️ Centrumbreed</p>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {events.filter(e => e.is_centrumbreed).map(e => (
                            <button key={e.id} type="button"
                              onClick={() => kiesTag('centrumbreed', e.title, e.slug)}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${form.tagged_type === 'centrumbreed' && form.tagged_naam === e.title ? 'bg-oranje text-black font-bold' : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'}`}>
                              {e.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Publicatie */}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => upd('gepubliceerd', !form.gepubliceerd)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.gepubliceerd ? 'bg-green-600' : 'bg-[#333]'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.gepubliceerd ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-sm text-gray-400">
                      {form.gepubliceerd
                        ? <span className="text-green-400 font-semibold">Live — zichtbaar op de site</span>
                        : 'Concept — niet zichtbaar'}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
                    <button type="submit" disabled={bezig}
                      className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                      style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                      {bezig ? 'Opslaan...' : bewerkId ? 'Wijzigingen opslaan' : 'Aanmaken & publiceren'}
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
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-[#141414] animate-pulse" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-[#1e1e1e] p-16 text-center" style={{ backgroundColor: '#141414' }}>
                <p className="text-gray-600 text-sm mb-4">Nog geen berichten aangemaakt.</p>
                <button onClick={nieuw} className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  Eerste bericht →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden flex" style={{ backgroundColor: '#141414' }}>
                    <div className="w-28 h-24 flex-shrink-0 bg-[#0d0d0d] flex items-center justify-center overflow-hidden border-r border-[#1e1e1e]">
                      {item.foto
                        ? <img src={item.foto} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                        : <span className="text-gray-700 text-xs">Geen foto</span>}
                    </div>
                    <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${catKleur[item.categorie] || 'bg-gray-900 text-gray-500'}`}>
                          {item.categorie}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.gepubliceerd ? 'bg-green-950/50 text-green-400' : 'bg-gray-900 text-gray-600'}`}>
                          {item.gepubliceerd ? '● Live' : '○ Concept'}
                        </span>
                        {item.tagged?.naam && (
                          <span className="text-[10px] text-oranje/70 border border-oranje/20 px-2 py-0.5 rounded-full">
                            {item.tagged.type === 'venue' ? '📍' : item.tagged.type === 'centrumbreed' ? '🏙️' : '🎉'} {item.tagged.naam}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-700 ml-auto">
                          {new Date(item.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="font-bold text-white text-sm truncate">{item.titel}</p>
                      {item.subtitel && <p className="text-xs text-gray-500 truncate">{item.subtitel}</p>}
                    </div>
                    <div className="flex flex-col justify-center gap-1.5 px-4 flex-shrink-0 border-l border-[#1e1e1e]">
                      <button onClick={() => bewerk(item)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-black"
                        style={{ backgroundColor: '#F27A00' }}>
                        Bewerk
                      </button>
                      <button onClick={() => togglePubliceer(item)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${item.gepubliceerd ? 'border-red-900/40 text-red-400 hover:bg-red-950/30' : 'border-green-900/40 text-green-400 hover:bg-green-950/30'}`}>
                        {item.gepubliceerd ? 'Offline' : 'Publiceer'}
                      </button>
                      <button onClick={() => verwijder(item.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-[#2a2a2a] hover:text-red-400 hover:border-red-900/40 transition-colors">
                        Verwijder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Google Nieuws tab */}
        {tab === 'google' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-600">Automatisch opgehaald via Google Nieuws. Verberg artikelen die niet relevant zijn.</p>
              <button onClick={laadGoogle}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-oranje transition-colors flex-shrink-0 ml-4">
                ↻ Vernieuwen
              </button>
            </div>
            {googleLaden ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-xl bg-[#141414] animate-pulse" />)}</div>
            ) : google.length === 0 ? (
              <div className="rounded-xl border border-[#1e1e1e] p-16 text-center text-gray-600 text-sm" style={{ backgroundColor: '#141414' }}>
                Klik op "Vernieuwen" om artikelen te laden.
              </div>
            ) : (
              <div className="space-y-3">
                {google.map((item, i) => {
                  const isGeblokkeerd = geblokkeerd.includes(item.link);
                  return (
                    <div key={i} className={`rounded-xl border overflow-hidden flex ${isGeblokkeerd ? 'opacity-40 border-red-900/30' : 'border-[#1e1e1e]'}`} style={{ backgroundColor: '#141414' }}>
                      <div className="w-28 h-24 flex-shrink-0 bg-[#0d0d0d] flex items-center justify-center overflow-hidden border-r border-[#1e1e1e]">
                        {item.foto ? <img src={item.foto} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /> : <span className="text-gray-700 text-[10px] text-center px-2">{item.bron}</span>}
                      </div>
                      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-600 bg-[#1e1e1e] px-2 py-0.5 rounded-full">{item.bron}</span>
                          {item.datum && <span className="text-[10px] text-gray-700">{item.datum}</span>}
                          {isGeblokkeerd && <span className="text-[10px] font-bold text-red-500 ml-auto">● Verborgen</span>}
                        </div>
                        <p className="font-bold text-white text-sm line-clamp-2 leading-snug">{item.titel}</p>
                      </div>
                      <div className="flex flex-col justify-center gap-1.5 px-4 flex-shrink-0 border-l border-[#1e1e1e]">
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 border border-[#2a2a2a] hover:text-white hover:border-oranje transition-colors text-center">
                          Bekijk ↗
                        </a>
                        {isGeblokkeerd ? (
                          <button onClick={() => deblokkeerArtikel(item.link)} className="px-4 py-1.5 rounded-lg text-xs font-bold border border-green-900/40 text-green-400 hover:bg-green-950/30 transition-colors">
                            Toon weer
                          </button>
                        ) : (
                          <button onClick={() => blokkeerArtikel(item)} className="px-4 py-1.5 rounded-lg text-xs font-bold border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors">
                            Verbergen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
