'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { supabase } from '@/lib/supabase';

const PlacesInput = dynamic(() => import('@/components/PlacesInput'), { ssr: false });

const TYPES = ['Feestcafé','Club','Café','Karaokebar','Muziekcafé','Grand Café','Wijnbar','Biercafé','Cocktailbar','Brouwerij','Danscafé'];

const TAG_OPTIES = [
  'Bruin café','Terras','Dansvloer','Live muziek','Cocktails','Bierspeciaalzaak',
  'Sports bar','Karaoke','Studenten','Whiskey bar','Wijnbar','Tapas','Feestcafé',
  'Rooftop','Biljart','Darts','Pooltafel','Buitenterras','Foodpairing','DJ',
];

const DAGEN = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
const leegTijden = () => Object.fromEntries(DAGEN.map(d => [d, { open: '', sluit: '', gesloten: false }]));

const leegForm = {
  naam: '', type: 'Café', adres: '', lat: null, lng: null,
  telefoon: '', website: '', instagram: '', leeftijd: '18+',
  omschrijving: '', logo_url: '', fotos: [], tags: [],
  openingstijden: leegTijden(),
  knop_label: '', knop_url: '',
  meta_pixel_id: '', tiktok_pixel_id: '',
};

function FotoUploadSlot({ index, url, onChange, onVerwijder, bucket }) {
  const [bezig, setBezig] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `${bucket}-${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(naam, file, { upsert: true });
    if (error) {
      alert(`Upload mislukt (${bucket}): ${error.message}`);
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(naam);
      onChange(data.publicUrl);
    }
    setBezig(false);
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center"
      style={{ aspectRatio: '4/3', minHeight: 100 }}>
      {url ? (
        <>
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={onVerwijder}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors">
            ✕
          </button>
        </>
      ) : (
        <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#141414] transition-colors">
          {bezig ? (
            <div className="w-5 h-5 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="24" height="24" fill="none" stroke="#444" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span className="text-xs text-gray-600">Foto uploaden</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={bezig} />
        </label>
      )}
    </div>
  );
}

export default function ProfielPage() {
  const [mijnVenues, setMijnVenues] = useState([]);
  const [actieveVenue, setActieveVenue] = useState(null);
  const [form, setForm] = useState(leegForm);
  const [laden, setLaden] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState('');
  const [logoBezig, setLogoBezig] = useState(false);
  const [syncBezig, setSyncBezig] = useState(false);
  const [aiBezig, setAiBezig] = useState(false);

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('venues').select('*').eq('eigenaar_id', user.id).order('naam');
      const venues = data || [];
      setMijnVenues(venues);
      if (venues.length > 0) laadVenueInForm(venues[0]);
      setLaden(false);
    }
    laad();
  }, []);

  function laadVenueInForm(v) {
    setActieveVenue(v);
    setForm({
      naam: v.naam || '', type: v.type || 'Café', adres: v.adres || '',
      lat: v.lat ?? null, lng: v.lng ?? null,
      telefoon: v.telefoon || '', website: v.website || '',
      instagram: v.instagram || '', leeftijd: v.leeftijd || '18+',
      omschrijving: v.omschrijving || '',
      logo_url: v.logo_url || '',
      fotos: Array.isArray(v.fotos) ? v.fotos : [],
      tags: Array.isArray(v.tags) ? v.tags : [],
      openingstijden: v.openingstijden && Object.keys(v.openingstijden).length > 0
        ? { ...leegTijden(), ...v.openingstijden }
        : leegTijden(),
      knop_label: v.knop_label || '', knop_url: v.knop_url || '',
      meta_pixel_id: v.meta_pixel_id || '', tiktok_pixel_id: v.tiktok_pixel_id || '',
    });
  }

  function upd(veld, val) { setForm(f => ({ ...f, [veld]: val })); }

  async function genereerOmschrijving() {
    if (!actieveVenue) return;
    setAiBezig(true);
    try {
      const res = await fetch('/api/ai-omschrijving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: actieveVenue.naam,
          type: form.type,
          adres: form.adres,
          tags: form.tags,
          reviews: actieveVenue.google_reviews,
          openingstijden: form.openingstijden,
        }),
      });
      const data = await res.json();
      if (data.omschrijving) upd('omschrijving', data.omschrijving);
      else setMelding('AI kon geen omschrijving genereren');
    } catch (e) {
      setMelding('Fout: ' + e.message);
    }
    setAiBezig(false);
  }

  async function syncMetGoogle() {
    if (!actieveVenue) return;
    setSyncBezig(true);
    setMelding('');
    try {
      const res = await fetch('/api/sync-venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: actieveVenue.naam, adres: actieveVenue.adres, venueId: actieveVenue.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMelding('Fout: ' + data.error);
      } else {
        // Vul form in met gevonden data
        setForm(f => ({
          ...f,
          ...(data.adres     && { adres: data.adres }),
          ...(data.telefoon  && { telefoon: data.telefoon }),
          ...(data.website   && { website: data.website }),
          ...(data.logo_url  && { logo_url: data.logo_url }),
          ...(data.fotos?.length && { fotos: data.fotos }),
          ...(data.openingstijden && { openingstijden: { ...f.openingstijden, ...data.openingstijden } }),
        }));
        // Sla ook rating + reviews direct op
        const extra = {};
        if (data.google_rating)          extra.google_rating = data.google_rating;
        if (data.google_reviews?.length) extra.google_reviews = data.google_reviews;
        if (Object.keys(extra).length) {
          await supabase.from('venues').update(extra).eq('id', actieveVenue.id);
        }
        const velden = [
          data.adres && 'adres', data.telefoon && 'telefoon', data.website && 'website',
          data.fotos?.length && `${data.fotos.length} foto's`,
          data.openingstijden && 'openingstijden',
          data.google_rating && `⭐ ${data.google_rating}`,
          data.google_reviews?.length && `${data.google_reviews.length} reviews`,
        ].filter(Boolean);
        setMelding(`Google sync geslaagd: ${velden.join(', ')} — sla op om te bevestigen`);
      }
    } catch (e) {
      setMelding('Fout: ' + e.message);
    }
    setSyncBezig(false);
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `logo-${actieveVenue.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('venue-logos').upload(naam, file, { upsert: true });
    if (error) {
      alert(`Logo upload mislukt: ${error.message}`);
    } else {
      const { data } = supabase.storage.from('venue-logos').getPublicUrl(naam);
      upd('logo_url', data.publicUrl);
    }
    setLogoBezig(false);
  }

  function setFoto(index, url) {
    const nieuw = [...form.fotos];
    nieuw[index] = url;
    upd('fotos', nieuw.filter(Boolean));
  }

  function verwijderFoto(index) {
    const nieuw = [...form.fotos];
    nieuw.splice(index, 1);
    upd('fotos', nieuw);
  }

  function toggleTag(tag) {
    if (form.tags.includes(tag)) {
      upd('tags', form.tags.filter(t => t !== tag));
    } else {
      upd('tags', [...form.tags, tag]);
    }
  }

  async function opslaan(e) {
    e.preventDefault();
    if (!actieveVenue) return;
    setBezig(true);

    const fotosVolledig = Array(3).fill(null).map((_, i) => form.fotos[i] || null).filter(Boolean);

    const { error } = await supabase.from('venues').update({
      naam: form.naam, type: form.type, adres: form.adres,
      lat: form.lat, lng: form.lng,
      telefoon: form.telefoon, website: form.website,
      instagram: form.instagram, leeftijd: form.leeftijd,
      omschrijving: form.omschrijving,
      logo_url: form.logo_url || null,
      fotos: fotosVolledig,
      tags: form.tags,
      openingstijden: form.openingstijden,
      knop_label: form.knop_label || null,
      knop_url: form.knop_url || null,
      meta_pixel_id: form.meta_pixel_id || null,
      tiktok_pixel_id: form.tiktok_pixel_id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', actieveVenue.id);

    setMelding(error ? 'Fout: ' + error.message : 'Opgeslagen ✓');
    setTimeout(() => setMelding(''), 3000);
    if (!error) {
      const { data } = await supabase.from('venues').select('*').eq('id', actieveVenue.id).single();
      if (data) {
        setActieveVenue(data);
        setMijnVenues(vs => vs.map(v => v.id === data.id ? data : v));
      }
    }
    setBezig(false);
  }

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-oranje transition-colors';

  // Zorg dat fotos altijd 3 slots heeft (leeg = null)
  const fotoSlots = [form.fotos[0] || null, form.fotos[1] || null, form.fotos[2] || null];

  return (
    <DashboardShell>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Mijn Locatie{mijnVenues.length !== 1 ? 's' : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mijnVenues.length === 0
              ? 'Je bent nog niet gekoppeld aan een locatie.'
              : `${mijnVenues.length} locatie${mijnVenues.length !== 1 ? 's' : ''} onder jouw beheer.`}
          </p>
        </div>

        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : mijnVenues.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] p-16 text-center" style={{ backgroundColor: '#141414' }}>
            <p className="text-gray-500 text-sm">Je bent nog niet gekoppeld aan een locatie.</p>
            <p className="text-gray-700 text-xs mt-2">Neem contact op met de beheerder om jouw zaak te koppelen.</p>
          </div>
        ) : (
          <>
            {/* Venue selector bij meerdere */}
            {mijnVenues.length > 1 && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Kies locatie</p>
                <div className="flex gap-2 flex-wrap">
                  {mijnVenues.map(v => (
                    <button key={v.id} onClick={() => laadVenueInForm(v)}
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                      style={{
                        backgroundColor: actieveVenue?.id === v.id ? '#F27A00' : '#141414',
                        color: actieveVenue?.id === v.id ? 'black' : '#888',
                        border: '1px solid',
                        borderColor: actieveVenue?.id === v.id ? '#F27A00' : '#1e1e1e',
                      }}>
                      {v.naam}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {melding && (
              <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${melding.includes('Fout') ? 'bg-red-950/30 border border-red-800/40 text-red-400' : 'bg-green-950/30 border border-green-800/40 text-green-400'}`}>
                {melding}
              </div>
            )}

            <form onSubmit={opslaan} className="space-y-5">

              {/* Logo */}
              <div className="rounded-xl border border-[#1e1e1e] p-6" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Logo</p>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center flex-shrink-0">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-gray-700" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                        {(form.naam || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
                      {logoBezig ? (
                        <div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                      )}
                      Logo uploaden
                      <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" disabled={logoBezig} />
                    </label>
                    {form.logo_url && (
                      <button type="button" onClick={() => upd('logo_url', '')}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 block">
                        Verwijder logo
                      </button>
                    )}
                    <p className="text-xs text-gray-600 mt-1">Wordt zichtbaar als pin op de kaart.</p>
                  </div>
                </div>
              </div>

              {/* Sfeerbeelden */}
              <div className="rounded-xl border border-[#1e1e1e] p-6" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">Sfeerbeelden <span className="font-normal normal-case text-gray-700">— max 3 foto's</span></p>
                <p className="text-xs text-gray-700 mb-4">De eerste foto is zichtbaar in de kaart-popup.</p>
                <div className="grid grid-cols-3 gap-3">
                  {fotoSlots.map((url, i) => (
                    <FotoUploadSlot
                      key={i}
                      index={i}
                      url={url}
                      onChange={newUrl => setFoto(i, newUrl)}
                      onVerwijder={() => verwijderFoto(i)}
                      bucket="venue-fotos"
                    />
                  ))}
                </div>
              </div>

              {/* Basisinfo */}
              <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Basisinfo</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Naam *</label>
                    <input value={form.naam} onChange={e => upd('naam', e.target.value)} required className={INP} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Type</label>
                    <select value={form.type} onChange={e => upd('type', e.target.value)} className={INP}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Leeftijd</label>
                    <input value={form.leeftijd} onChange={e => upd('leeftijd', e.target.value)}
                      placeholder="18+ / Iedereen" className={INP} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Adres</label>
                    <PlacesInput
                      value={form.adres}
                      onChange={v => upd('adres', v)}
                      onPlace={({ adres, lat, lng }) => setForm(f => ({ ...f, adres, lat, lng }))}
                      placeholder="Zoek adres op Google Maps..."
                    />
                    {form.lat && <p className="text-[11px] text-gray-600 mt-1">📍 {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}</p>}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Omschrijving</label>
                      <button type="button" onClick={genereerOmschrijving} disabled={aiBezig}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border border-purple-800/50 text-purple-400 hover:border-purple-500 hover:text-purple-300 transition-colors disabled:opacity-40">
                        {aiBezig
                          ? <><div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />Genereren...</>
                          : <>✨ Genereer met AI</>}
                      </button>
                    </div>
                    <textarea value={form.omschrijving} onChange={e => upd('omschrijving', e.target.value)} rows={3}
                      placeholder="Vertel bezoekers wat jullie zaak bijzonder maakt..."
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-xl border border-[#1e1e1e] p-6" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIES.map(tag => {
                    const actief = form.tags.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                        style={{
                          backgroundColor: actief ? '#F27A00' : 'transparent',
                          borderColor: actief ? '#F27A00' : '#2a2a2a',
                          color: actief ? 'black' : '#666',
                        }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {form.tags.length > 0 && (
                  <p className="text-xs text-gray-600 mt-3">{form.tags.length} tag{form.tags.length !== 1 ? 's' : ''} geselecteerd</p>
                )}
              </div>

              {/* Contact */}
              <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Contact & Socials</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Telefoon</label>
                    <input type="tel" value={form.telefoon} onChange={e => upd('telefoon', e.target.value)}
                      placeholder="074-123 4567" className={INP} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Website</label>
                    <input type="url" value={form.website} onChange={e => upd('website', e.target.value)}
                      placeholder="https://mijnzaak.nl" className={INP} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Instagram</label>
                    <div className="flex items-center bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg overflow-hidden focus-within:border-oranje transition-colors">
                      <span className="px-3 text-gray-600 text-sm">@</span>
                      <input value={form.instagram} onChange={e => upd('instagram', e.target.value)}
                        placeholder="jouwzaak"
                        className="flex-1 bg-transparent px-2 py-3 text-white text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Openingstijden */}
              <div className="rounded-xl border border-[#1e1e1e] p-6" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Openingstijden</p>
                <div className="space-y-2">
                  {DAGEN.map(dag => {
                    const t = form.openingstijden[dag] || { open: '', sluit: '', gesloten: false };
                    return (
                      <div key={dag} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-8 flex-shrink-0">{dag}</span>
                        {t.gesloten ? (
                          <span className="text-xs text-gray-600 flex-1">Gesloten</span>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <input type="time" value={t.open}
                              onChange={e => upd('openingstijden', { ...form.openingstijden, [dag]: { ...t, open: e.target.value } })}
                              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje w-32" />
                            <span className="text-gray-600 text-sm">–</span>
                            <input type="time" value={t.sluit}
                              onChange={e => upd('openingstijden', { ...form.openingstijden, [dag]: { ...t, sluit: e.target.value } })}
                              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje w-32" />
                          </div>
                        )}
                        <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                          <input type="checkbox" checked={!!t.gesloten}
                            onChange={e => upd('openingstijden', { ...form.openingstijden, [dag]: { ...t, gesloten: e.target.checked } })}
                            className="w-3.5 h-3.5 accent-oranje" />
                          <span className="text-xs text-gray-600">Gesloten</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Eigen knop */}
              <div className="rounded-xl border border-[#1e1e1e] p-6" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">Eigen knop op je pagina</p>
                <p className="text-xs text-gray-700 mb-4">Zichtbaar als grote knop op je locatiepagina — bijv. voor reserveringen, tickets of je menu.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Knoptekst</label>
                    <input value={form.knop_label} onChange={e => upd('knop_label', e.target.value)}
                      placeholder="Bijv. Reserveer tafel" maxLength={30} className={INP} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Link (URL)</label>
                    <input value={form.knop_url} onChange={e => upd('knop_url', e.target.value)}
                      placeholder="https://..." type="url" className={INP} />
                  </div>
                </div>
              </div>

              {/* Pixels */}
              <div className="rounded-xl border border-[#1e1e1e] p-6" style={{ backgroundColor: '#141414' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">Tracking pixels</p>
                <p className="text-xs text-gray-700 mb-4">Vul je pixel-ID in. Deze wordt alleen geladen op jouw locatiepagina.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Meta Pixel ID</label>
                    <input value={form.meta_pixel_id} onChange={e => upd('meta_pixel_id', e.target.value)}
                      placeholder="123456789012345" className={INP} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">TikTok Pixel ID</label>
                    <input value={form.tiktok_pixel_id} onChange={e => upd('tiktok_pixel_id', e.target.value)}
                      placeholder="C1A2B3D4E5F6..." className={INP} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={bezig}
                className="w-full py-4 rounded-xl font-black uppercase text-black text-base disabled:opacity-50"
                style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {bezig ? 'Opslaan...' : `${actieveVenue?.naam || 'Locatie'} opslaan →`}
              </button>

              <button type="button" onClick={syncMetGoogle} disabled={syncBezig}
                className="w-full py-3.5 rounded-xl font-bold text-sm border border-[#333] text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {syncBezig
                  ? <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Synchroniseren met Google...</>
                  : <><span>🔄</span> Synchroniseren met Google Maps</>}
              </button>
            </form>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
