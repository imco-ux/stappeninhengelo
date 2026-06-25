'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const PlacesInput = dynamic(() => import('@/components/PlacesInput'), { ssr: false });
const UnsplashPicker = dynamic(() => import('@/components/UnsplashPicker'), { ssr: false });

const TYPES = [
  // Drank
  'Feestcafé','Club','Café','Karaokebar','Muziekcafé','Grand Café','Wijnbar','Biercafé','Cocktailbar / Lounge','Brouwerij','Danscafé','Bruin Café','Speciaalbiercafé','Restaurant / Borrel','Restaurant / Bar','Bar & Keuken',
  // Eten (laat open)
  'Cafetaria','Döner / Shoarma','Snackbar','Friettent','Pizzeria','Burger','Sushi / Aziatisch','Eetcafé',
];

const DAGEN = [
  { key: 'Ma', label: 'Maandag' },
  { key: 'Di', label: 'Dinsdag' },
  { key: 'Wo', label: 'Woensdag' },
  { key: 'Do', label: 'Donderdag' },
  { key: 'Vr', label: 'Vrijdag' },
  { key: 'Za', label: 'Zaterdag' },
  { key: 'Zo', label: 'Zondag' },
];
const leegTijden = () => Object.fromEntries(DAGEN.map(d => [d.key, { open: '', sluit: '', gesloten: false }]));

const leegForm = {
  naam: '', type: 'Café', adres: '', lat: null, lng: null,
  telefoon: '', website: '', instagram: '',
  leeftijd: '18+', omschrijving: '', actief: true,
  logo_url: '', fotos: [],
  openingstijden: leegTijden(),
  kroegentocht_actief: false,
  kroegentocht_gewicht: 1,
  extra_knoppen: [{ label: '', url: '' }, { label: '', url: '' }],
};

export default function AdminLocaties() {
  const [venues, setVenues]     = useState([]);
  const [laden, setLaden]       = useState(true);
  const [form, setForm]         = useState(leegForm);
  const [bewerkId, setBewerkId] = useState(null);
  const [toonForm, setToonForm] = useState(false);
  const [bezig, setBezig]         = useState(false);
  const [zoek, setZoek]           = useState('');
  const [melding, setMelding]     = useState('');
  const [syncBezig, setSyncBezig] = useState({});
  const [aiBezig, setAiBezig]     = useState(false);
  const [logoBezig, setLogoBezig] = useState(false);
  const [fotoBezig, setFotoBezig] = useState({});

  useEffect(() => { laadVenues(); }, []);

  async function laadVenues() {
    setLaden(true);
    const { data } = await supabase.from('venues').select('*').order('naam');
    setVenues(data || []);
    setLaden(false);
  }

  function bewerk(v) {
    const basisTijden = leegTijden();
    const opTijden = v.openingstijden || {};
    const tijden = Object.fromEntries(DAGEN.map(d => [d.key, {
      open: opTijden[d.key]?.open || '',
      sluit: opTijden[d.key]?.sluit || '',
      gesloten: opTijden[d.key]?.gesloten || false,
    }]));
    setForm({
      naam: v.naam || '', type: v.type || 'Café', adres: v.adres || '',
      lat: v.lat ?? null, lng: v.lng ?? null,
      telefoon: v.telefoon || '', website: v.website || '', instagram: v.instagram || '',
      leeftijd: v.leeftijd || '18+', omschrijving: v.omschrijving || '', actief: v.actief ?? true,
      logo_url: v.logo_url || '', fotos: Array.isArray(v.fotos) ? v.fotos : [],
      openingstijden: tijden,
      kroegentocht_actief: v.kroegentocht_actief || false,
      kroegentocht_gewicht: v.kroegentocht_gewicht || 1,
      extra_knoppen: Array.isArray(v.extra_knoppen) && v.extra_knoppen.length === 2
        ? v.extra_knoppen
        : [{ label: v.extra_knoppen?.[0]?.label||'', url: v.extra_knoppen?.[0]?.url||'' }, { label: v.extra_knoppen?.[1]?.label||'', url: v.extra_knoppen?.[1]?.url||'' }],
    });
    setBewerkId(v.id);
    setToonForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nieuw() { setForm(leegForm); setBewerkId(null); setToonForm(true); }

  function upd(veld, val) { setForm(f => ({ ...f, [veld]: val })); }

  async function opslaanForm(e) {
    e.preventDefault();
    setBezig(true);
    const payload = {
      naam: form.naam, type: form.type, adres: form.adres,
      lat: form.lat ?? null, lng: form.lng ?? null,
      telefoon: form.telefoon, website: form.website, instagram: form.instagram,
      leeftijd: form.leeftijd, omschrijving: form.omschrijving,
      actief: form.actief,
      logo_url: form.logo_url || null,
      fotos: form.fotos.filter(Boolean),
      openingstijden: form.openingstijden,
      kroegentocht_actief: form.kroegentocht_actief,
      kroegentocht_gewicht: form.kroegentocht_gewicht || 1,
      extra_knoppen: form.extra_knoppen.filter(k => k.label.trim()),
      updated_at: new Date().toISOString(),
    };
    if (bewerkId) {
      const { error } = await supabase.from('venues').update(payload).eq('id', bewerkId);
      if (error) { toonMelding('❌ Opslaan mislukt: ' + error.message); setBezig(false); return; }
      toonMelding('Locatie opgeslagen ✓');
    } else {
      const { error } = await supabase.from('venues').insert(payload);
      if (error) { toonMelding('❌ Aanmaken mislukt: ' + error.message); setBezig(false); return; }
      toonMelding('Locatie aangemaakt ✓');
    }
    setBezig(false);
    setToonForm(false);
    laadVenues();
  }

  async function verwijder(id) {
    if (!confirm('Locatie verwijderen?')) return;
    await supabase.from('venues').delete().eq('id', id);
    setVenues(v => v.filter(x => x.id !== id));
    toonMelding('Locatie verwijderd');
  }

  async function toggleActief(v) {
    await supabase.from('venues').update({ actief: !v.actief }).eq('id', v.id);
    setVenues(vs => vs.map(x => x.id === v.id ? { ...x, actief: !x.actief } : x));
  }

  async function syncGoogle(v) {
    setSyncBezig(prev => ({ ...prev, [v.id]: true }));
    try {
      const res = await fetch('/api/sync-venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: v.naam, adres: v.adres, venueId: v.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toonMelding(`❌ ${v.naam}: ${data.error}`);
      } else {
        const update = {};
        if (data.adres)          update.adres = data.adres;
        if (data.telefoon)       update.telefoon = data.telefoon;
        if (data.website)        update.website = data.website;
        if (data.lat)            update.lat = data.lat;
        if (data.lng)            update.lng = data.lng;
        if (data.openingstijden) update.openingstijden = data.openingstijden;
        if (data.fotos?.length)       update.fotos = data.fotos;
        if (data.logo_url)            update.logo_url = data.logo_url;
        if (data.google_rating)       update.google_rating = data.google_rating;
        if (data.google_reviews?.length) update.google_reviews = data.google_reviews;
        update.updated_at = new Date().toISOString();

        await supabase.from('venues').update(update).eq('id', v.id);
        setVenues(vs => vs.map(x => x.id === v.id ? { ...x, ...update } : x));

        const velden = [
          data.adres && 'adres',
          data.telefoon && 'telefoon',
          data.website && 'website',
          data.lat && 'coördinaten',
          data.openingstijden && 'openingstijden',
          data.logo_url && 'logo',
          data.fotos?.length && `${data.fotos.length} foto${data.fotos.length !== 1 ? "'s" : ''}`,
          data.google_rating && `⭐ ${data.google_rating}`,
          data.google_reviews?.length && `${data.google_reviews.length} reviews`,
        ].filter(Boolean);
        toonMelding(`✓ ${data.gevonden || v.naam} gesynchroniseerd: ${velden.join(', ')}`);
      }
    } catch (e) {
      toonMelding('❌ Sync mislukt: ' + e.message);
    }
    setSyncBezig(prev => ({ ...prev, [v.id]: false }));
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file || !bewerkId) return;
    setLogoBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `logo-${bewerkId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('venue-logos').upload(naam, file, { upsert: true });
    if (error) { toonMelding('Logo upload mislukt: ' + error.message); }
    else {
      const { data } = supabase.storage.from('venue-logos').getPublicUrl(naam);
      upd('logo_url', data.publicUrl);
    }
    setLogoBezig(false);
  }

  async function uploadFoto(file, index) {
    if (!file || !bewerkId) return;
    setFotoBezig(p => ({ ...p, [index]: true }));
    const ext = file.name.split('.').pop();
    const naam = `foto-${bewerkId}-${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage.from('venue-fotos').upload(naam, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('venue-fotos').getPublicUrl(naam);
      const nieuw = [...form.fotos];
      nieuw[index] = data.publicUrl;
      upd('fotos', nieuw.filter(Boolean));
    }
    setFotoBezig(p => ({ ...p, [index]: false }));
  }

  async function genereerOmschrijving() {
    if (!form.naam) return;
    setAiBezig(true);
    try {
      const huidigVenue = bewerkId ? venues.find(v => v.id === bewerkId) : null;
      const res = await fetch('/api/ai-omschrijving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: form.naam, type: form.type, adres: form.adres,
          reviews: huidigVenue?.google_reviews,
          openingstijden: huidigVenue?.openingstijden,
        }),
      });
      const data = await res.json();
      if (data.omschrijving) upd('omschrijving', data.omschrijving);
      else toonMelding('AI kon geen omschrijving genereren');
    } catch (e) {
      toonMelding('AI fout: ' + e.message);
    }
    setAiBezig(false);
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 5000); }

  const gefilterd = venues.filter(v => v.naam?.toLowerCase().includes(zoek.toLowerCase()));

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje';

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Locaties</h1>
            <p className="text-gray-500 text-sm mt-1">{venues.length} locaties · {venues.filter(v=>v.actief).length} actief</p>
          </div>
          <button onClick={nieuw}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuwe locatie
          </button>
        </div>

        {melding && <div className="mb-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm">{melding}</div>}

        {/* Formulier */}
        {toonForm && (
          <div className="mb-6 rounded-xl border border-[#F27A00]/30 p-6" style={{ backgroundColor: '#141414' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black uppercase text-sm" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
                {bewerkId ? 'Locatie bewerken' : 'Nieuwe locatie'}
              </p>
              <button onClick={() => setToonForm(false)} className="text-gray-600 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={opslaanForm} className="space-y-4">

              {/* Logo + Foto's — alleen bij bewerken */}
              {bewerkId && (
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#1e1e1e]">
                  {/* Logo */}
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Logo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center flex-shrink-0">
                        {form.logo_url
                          ? <img src={form.logo_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-lg font-black text-gray-700" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{(form.naam||'?').charAt(0)}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-xs text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
                          {logoBezig ? <div className="w-3 h-3 border border-oranje border-t-transparent rounded-full animate-spin" /> : '↑'}
                          Uploaden
                          <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" disabled={logoBezig} />
                        </label>
                        {form.logo_url && (
                          <button type="button" onClick={() => upd('logo_url', '')} className="text-xs text-red-400 hover:text-red-300">Verwijder</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sfeerbeelden */}
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Sfeerbeelden <span className="normal-case font-normal text-gray-600">(max 3)</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0,1,2].map(i => {
                        const url = form.fotos[i] || null;
                        return (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center" style={{ aspectRatio:'4/3' }}>
                            {url ? (
                              <>
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => { const f=[...form.fotos]; f.splice(i,1); upd('fotos',f.filter(Boolean)); }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-red-600">✕</button>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                {fotoBezig[i] ? (
                                  <div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <label className="cursor-pointer text-gray-600 hover:text-oranje transition-colors text-lg leading-none">
                                      +
                                      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadFoto(e.target.files[0], i)} className="hidden" />
                                    </label>
                                    <div onClick={e => e.stopPropagation()}>
                                      <UnsplashPicker zoekterm={form.naam} onKies={url => { const f=[...form.fotos]; f[i]=url; upd('fotos',f); }} />
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Naam *</label>
                  <input value={form.naam} onChange={e=>upd('naam',e.target.value)} required className={INP} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Type</label>
                  <select value={form.type} onChange={e=>upd('type',e.target.value)} className={INP}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Leeftijd</label>
                  <input value={form.leeftijd} onChange={e=>upd('leeftijd',e.target.value)}
                    placeholder="18+ / Iedereen / 21+" className={INP} />
                </div>

                {/* Adres via Google Places — vult lat/lng automatisch in */}
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Adres (Google Maps)</label>
                  <PlacesInput
                    value={form.adres}
                    onChange={v => upd('adres', v)}
                    onPlace={({ adres, lat, lng }) => setForm(f => ({ ...f, adres, lat, lng }))}
                    placeholder="Zoek adres op Google Maps..."
                  />
                  {form.lat && (
                    <p className="text-[11px] text-gray-600 mt-1">
                      📍 Coördinaten: {form.lat?.toFixed(5)}, {form.lng?.toFixed(5)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Telefoon</label>
                  <input value={form.telefoon} onChange={e=>upd('telefoon',e.target.value)} className={INP} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e=>upd('website',e.target.value)} placeholder="https://" className={INP} />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Instagram</label>
                  <div className="flex items-center bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-600 text-sm">@</span>
                    <input value={form.instagram} onChange={e=>upd('instagram',e.target.value)} placeholder="goodfellows_hengelo"
                      className="flex-1 bg-transparent py-2.5 pr-3 text-white text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase text-gray-500">Omschrijving</label>
                    <button type="button" onClick={genereerOmschrijving} disabled={aiBezig || !form.naam}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border border-purple-800/50 text-purple-400 hover:border-purple-500 hover:text-purple-300 transition-colors disabled:opacity-40">
                      {aiBezig
                        ? <><div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />Genereren...</>
                        : <>✨ Genereer met AI</>}
                    </button>
                  </div>
                  <textarea value={form.omschrijving} onChange={e=>upd('omschrijving',e.target.value)} rows={3}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
                </div>

                {/* Openingstijden */}
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Openingstijden</label>
                  <div className="space-y-2">
                    {DAGEN.map(({ key, label }) => {
                      const t = form.openingstijden?.[key] || { open: '', sluit: '', gesloten: false };
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                          <input type="checkbox" checked={!!t.gesloten}
                            onChange={e => upd('openingstijden', { ...form.openingstijden, [key]: { ...t, gesloten: e.target.checked } })}
                            className="accent-oranje" />
                          <span className="text-xs text-gray-600 w-14">Gesloten</span>
                          {!t.gesloten && (
                            <>
                              <input type="time" value={t.open || ''}
                                onChange={e => upd('openingstijden', { ...form.openingstijden, [key]: { ...t, open: e.target.value } })}
                                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-oranje" />
                              <span className="text-gray-600 text-xs">–</span>
                              <input type="time" value={t.sluit || ''}
                                onChange={e => upd('openingstijden', { ...form.openingstijden, [key]: { ...t, sluit: e.target.value } })}
                                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-oranje" />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Kroegentocht */}
                <div className="col-span-2 border-t border-[#1e1e1e] pt-4">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-3">Kroegentocht</label>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id="kroeg_actief" checked={form.kroegentocht_actief}
                      onChange={e => upd('kroegentocht_actief', e.target.checked)} className="accent-oranje" />
                    <label htmlFor="kroeg_actief" className="text-sm text-gray-400 cursor-pointer">Doet mee aan kroegentocht</label>
                  </div>
                  {form.kroegentocht_actief && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Gewicht (1–5 · hogere waarde = vaker geselecteerd)</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min="1" max="5" value={form.kroegentocht_gewicht || 1}
                          onChange={e => upd('kroegentocht_gewicht', parseInt(e.target.value))}
                          className="flex-1 accent-oranje" />
                        <span className="text-oranje font-bold text-sm w-4">{form.kroegentocht_gewicht || 1}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra knoppen */}
                <div className="col-span-2 border-t border-[#1e1e1e] pt-4">
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-3">Extra knoppen <span className="normal-case font-normal text-gray-600">(optioneel)</span></label>
                  {[0, 1].map(i => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        value={form.extra_knoppen[i]?.label || ''}
                        onChange={e => { const k=[...form.extra_knoppen]; k[i]={...k[i],label:e.target.value}; upd('extra_knoppen',k); }}
                        placeholder={`Knop ${i+1} label (bijv. "Menu")`}
                        className={INP + ' flex-1'}
                      />
                      <input
                        type="url"
                        value={form.extra_knoppen[i]?.url || ''}
                        onChange={e => { const k=[...form.extra_knoppen]; k[i]={...k[i],url:e.target.value}; upd('extra_knoppen',k); }}
                        placeholder="https://... (optioneel)"
                        className={INP + ' flex-1'}
                      />
                    </div>
                  ))}
                </div>

                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="actief" checked={form.actief} onChange={e=>upd('actief',e.target.checked)} className="accent-oranje" />
                  <label htmlFor="actief" className="text-sm text-gray-400 cursor-pointer">Actief (zichtbaar op de site)</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 flex-wrap">
                <button type="submit" disabled={bezig}
                  className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {bezig ? 'Opslaan...' : bewerkId ? 'Opslaan' : 'Aanmaken'}
                </button>
                {bewerkId && (
                  <button type="button"
                    onClick={() => { const v = venues.find(x => x.id === bewerkId); if (v) syncGoogle(v); }}
                    disabled={bewerkId ? syncBezig[bewerkId] : false}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold border border-blue-800/50 text-blue-400 hover:border-blue-500 hover:text-blue-300 transition-colors disabled:opacity-40">
                    {syncBezig[bewerkId] ? '⏳ Syncing...' : '🔄 Sync met Google'}
                  </button>
                )}
                <button type="button" onClick={() => setToonForm(false)}
                  className="px-6 py-2.5 rounded-lg text-sm text-gray-400 border border-[#333] hover:text-white">Annuleren</button>
              </div>
            </form>
          </div>
        )}

        {/* Zoek */}
        <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek locatie..."
          className="w-full mb-4 bg-[#141414] border border-[#1e1e1e] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#333]" />

        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : (
          <div className="space-y-2">
            {gefilterd.map(v => (
              <div key={v.id} className="rounded-xl border border-[#1e1e1e] p-4 flex items-center gap-4" style={{ backgroundColor: '#141414' }}>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#333] bg-[#0d0d0d] flex items-center justify-center font-black text-sm text-black flex-shrink-0">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt={v.naam} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ backgroundColor: '#F27A00', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                      {v.naam?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{v.naam}</p>
                  <p className="text-xs text-gray-500 truncate">{v.type} · {v.adres} · {v.leeftijd}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {v.lat && <p className="text-[10px] text-gray-700">📍 {Number(v.lat).toFixed(4)}, {Number(v.lng).toFixed(4)}</p>}
                    {v.openingstijden && Object.values(v.openingstijden).some(t => t?.open || t?.gesloten)
                      ? <span className="text-[10px] text-green-600">🕐 tijden ingevuld</span>
                      : <span className="text-[10px] text-gray-700">🕐 geen tijden</span>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${v.actief ? 'bg-green-950/50 text-green-400' : 'bg-gray-900 text-gray-600'}`}>
                  {v.actief ? 'Actief' : 'Verborgen'}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  {v.instagram && (
                    <a href={`https://instagram.com/${v.instagram}`} target="_blank" rel="noopener noreferrer"
                      title={`@${v.instagram}`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-pink-400 hover:border-pink-500 hover:text-pink-300 transition-colors">
                      IG
                    </a>
                  )}
                  {v.website && (
                    <a href={v.website} target="_blank" rel="noopener noreferrer"
                      title={v.website}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-blue-400 hover:border-blue-500 hover:text-blue-300 transition-colors">
                      🌐
                    </a>
                  )}
                  <button onClick={() => syncGoogle(v)} disabled={syncBezig[v.id]}
                    title="Openingstijden ophalen van Google"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-40">
                    {syncBezig[v.id] ? '⏳' : '🔄 Google'}
                  </button>
                  <button onClick={() => toggleActief(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:text-white transition-colors">
                    {v.actief ? 'Verberg' : 'Activeer'}
                  </button>
                  <button onClick={() => bewerk(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-black"
                    style={{ backgroundColor: '#F27A00' }}>
                    Bewerk
                  </button>
                  <button onClick={() => verwijder(v.id)}
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
