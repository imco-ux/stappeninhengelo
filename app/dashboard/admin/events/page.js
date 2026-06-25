'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const PlacesInput = dynamic(() => import('@/components/PlacesInput'), { ssr: false });

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const TYPES = ['Feestcafé','Club Night','Karaoke','Live Muziek','Quiz','Borrel','Festival','Overig'];
const PUBLIEK_OPTIES = [
  '18+ studenten', '20+ young professionals', '25+ uitgaanspubliek', '30+ volwassenen',
  'VIP / exclusief', 'LGBTQ+ friendly', 'Sportpubliek', 'Breed publiek',
  'Feestgangers', 'Muziekliefhebbers', 'Dansers', 'Locals / Hengeloërs',
];
const GENRE_OPTIES = [
  'House', 'Deep House', 'Tech House', 'Techno', 'Trance', 'Hardstyle',
  'R&B / Hip-hop', 'Afrobeats', 'Latin / Salsa', 'Reggaeton',
  'Pop', 'Top 40', 'Dance / EDM', 'Disco / Funk',
  'Live band', 'Jazz / Blues', 'Rock', 'Karaoke', 'Divers',
];
const PROMOTIE_OPTIES = ['Instagram', 'Facebook', 'TikTok', 'Flyers', 'Mond-tot-mond', 'E-mail nieuwsbrief', 'Ticketplatform', 'Anders'];

function formatDatum(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTijdstip(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoRij({ label, waarde }) {
  if (!waarde) return null;
  return (
    <div className="flex gap-2">
      <span className="text-gray-600 flex-shrink-0 w-28 text-xs">{label}</span>
      <span className="text-gray-300 text-xs">{waarde}</span>
    </div>
  );
}

function ChipTag({ label, kleur }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${kleur === 'oranje' ? 'border-oranje/30 text-oranje/80 bg-oranje/5' : 'border-[#333] text-gray-500'}`}>
      {label}
    </span>
  );
}

function MultiChips({ opties, gekozen, onChange, eigenWaarde, setEigenWaarde, placeholder }) {
  function toggle(v) {
    onChange(gekozen.includes(v) ? gekozen.filter(x => x !== v) : [...gekozen, v]);
  }
  function voegToe() {
    const v = eigenWaarde.trim();
    if (v && !gekozen.includes(v)) onChange([...gekozen, v]);
    setEigenWaarde('');
  }
  const alles = [...opties, ...gekozen.filter(g => !opties.includes(g))];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {alles.map(o => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${gekozen.includes(o) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
            {o}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={eigenWaarde} onChange={e => setEigenWaarde(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); voegToe(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-oranje" />
        <button type="button" onClick={voegToe}
          className="px-3 py-2 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
          + Voeg toe
        </button>
      </div>
    </div>
  );
}

const KNOP_KLEUREN = [
  { label: 'Oranje', value: '#F27A00', tekst: '#000' },
  { label: 'Wit', value: '#FFFFFF', tekst: '#000' },
  { label: 'Groen', value: '#22c55e', tekst: '#000' },
  { label: 'Paars', value: '#a855f7', tekst: '#fff' },
  { label: 'Rood', value: '#ef4444', tekst: '#fff' },
  { label: 'Blauw', value: '#3b82f6', tekst: '#fff' },
  { label: 'Zwart', value: '#1a1a1a', tekst: '#fff' },
  { label: 'Transparant', value: 'transparent', tekst: '#F27A00' },
];

const leegKnop = { label: '', url: '', kleur: '#F27A00', tekst: '#000' };

const leegForm = {
  title: '', type: 'Club Night', datum: '', tijd_start: '22:00', tijd_eind: '04:00',
  prijs: 'Gratis', prijs_bedrag: '', leeftijd: '18+', adres: '', omschrijving: '',
  ticket_url: '', ticket_shortcode: '', venue_naam: '', goedgekeurd: true, hot: false,
  is_centrumbreed: false,
  meta_pixel_id: '', tiktok_pixel_id: '',
  // extra_info velden
  artiesten: '', verwacht_bezoekers: '', publiek: [], genres: [],
  instagram_tags: '', crosspost_instagram: false, instagram_audio: '', promotie_kanalen: [],
  deelnemende_venues: [],
  extra_secties: [{ titel: '', tekst: '' }],
  extra_knoppen: [{ ...leegKnop }],
  banner_fotos: [],
  centrum_logo_url: '',
};

export default function AdminEvents() {
  const [events, setEvents]       = useState([]);
  const [laden, setLaden]         = useState(true);
  const [form, setForm]           = useState(leegForm);
  const [bewerkId, setBewerkId]   = useState(null);
  const [toonForm, setToonForm]   = useState(false);
  const [bezig, setBezig]         = useState(false);
  const [filter, setFilter]       = useState('alle');
  const [melding, setMelding]     = useState('');
  const [openDetail, setOpenDetail] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [aiBezig, setAiBezig]     = useState(false);
  const [venues, setVenues]        = useState([]);
  const [toonVenueLijst, setToonVenueLijst] = useState(false);
  const [eigenGenre, setEigenGenre] = useState('');
  const [eigenPubliek, setEigenPubliek] = useState('');
  const [subEvents, setSubEvents] = useState([]);
  const [bannerBezig, setBannerBezig] = useState({});
  const [centrumLogoBezig, setCentrumLogoBezig] = useState(false);

  useEffect(() => { laadEvents(); laadVenues(); }, []);

  async function laadEvents() {
    setLaden(true);
    const grens = new Date();
    grens.setDate(grens.getDate() - 21);
    const { data } = await supabase.from('events').select('*')
      .gte('datum', grens.toISOString().slice(0, 10))
      .order('datum', { ascending: true });
    setEvents(data || []);
    setLaden(false);
  }

  async function laadVenues() {
    const { data } = await supabase.from('venues').select('id, naam, adres, logo_url').order('naam');
    setVenues(data || []);
  }

  async function laadSubEvents(centrumId) {
    const { data } = await supabase.from('events').select('*')
      .eq('centrumbreed_id', centrumId).order('datum');
    setSubEvents(data || []);
  }

  async function toggleCentrumLink(eventId, huidig) {
    await supabase.from('events').update({ centrumbreed_link_goedgekeurd: !huidig }).eq('id', eventId);
    setSubEvents(s => s.map(e => e.id === eventId ? { ...e, centrumbreed_link_goedgekeurd: !huidig } : e));
    toonMelding(!huidig ? '✓ Koppeling goedgekeurd' : 'Koppeling verborgen');
  }

  async function uploadBannerFoto(file, index) {
    setBannerBezig(p => ({ ...p, [index]: true }));
    const ext = file.name.split('.').pop();
    const naam = `banner-${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage.from('posters').upload(naam, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('posters').getPublicUrl(naam);
      const banners = [...(form.banner_fotos || [])];
      banners[index] = data.publicUrl;
      upd('banner_fotos', banners.filter(Boolean));
    }
    setBannerBezig(p => ({ ...p, [index]: false }));
  }

  async function uploadCentrumLogo(file) {
    setCentrumLogoBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `centrum-logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posters').upload(naam, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('posters').getPublicUrl(naam);
      upd('centrum_logo_url', data.publicUrl);
    }
    setCentrumLogoBezig(false);
  }

  function kiesVenue(v) {
    setForm(f => ({ ...f, venue_naam: v.naam, adres: v.adres || f.adres }));
    setToonVenueLijst(false);
  }

  function upd(veld, val) { setForm(f => ({ ...f, [veld]: val })); }

  function bewerk(ev) {
    const [start, eind] = (ev.tijd || '22:00 – 04:00').split(' – ');
    const bedrag = ev.prijs?.startsWith('€') ? ev.prijs.replace('€','').replace(',–','').trim() : '';
    const ei = ev.extra_info || {};
    setForm({
      title: ev.title || '', type: ev.type || 'Club Night',
      datum: ev.datum || '', tijd_start: start?.trim() || '22:00',
      tijd_eind: eind?.trim() || '04:00',
      prijs: ev.prijs === 'Gratis' || !ev.prijs?.startsWith('€') ? 'Gratis' : 'Betaald',
      prijs_bedrag: bedrag, leeftijd: ev.leeftijd || '18+',
      adres: ev.adres || '', omschrijving: ev.omschrijving || '',
      ticket_url: ev.ticket_url || '', ticket_shortcode: ev.ticket_shortcode || '',
      venue_naam: ev.venue_naam || '', goedgekeurd: ev.goedgekeurd ?? true, hot: ev.hot ?? false,
      is_centrumbreed: ev.is_centrumbreed ?? false,
      meta_pixel_id: ev.meta_pixel_id || '', tiktok_pixel_id: ev.tiktok_pixel_id || '',
      artiesten: ei.artiesten || '', verwacht_bezoekers: ei.verwacht_bezoekers || '',
      publiek: ei.publiek || [], genres: ei.genres || [],
      instagram_tags: ei.instagram_tags || '',
      crosspost_instagram: ei.crosspost_instagram || false,
      instagram_audio: ei.instagram_audio || '',
      promotie_kanalen: ei.promotie_kanalen || [],
      deelnemende_venues: ei.deelnemende_venues || [],
      extra_secties: ei.extra_secties?.length ? ei.extra_secties : [{ titel: '', tekst: '' }],
      extra_knoppen: ei.extra_knoppen?.length ? ei.extra_knoppen
        : (ev.knop_label ? [{ label: ev.knop_label, url: ev.knop_url || '', kleur: '#F27A00', tekst: '#000' }] : [{ ...leegKnop }]),
      banner_fotos: ei.banner_fotos || [],
      centrum_logo_url: ei.centrum_logo_url || '',
    });
    setPosterFile(null);
    setPosterPreview(ev.poster_url || null);
    setBewerkId(ev.id);
    setSubEvents([]);
    if (ev.is_centrumbreed) laadSubEvents(ev.id);
    setToonForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nieuw() {
    setForm(leegForm);
    setPosterFile(null);
    setPosterPreview(null);
    setBewerkId(null);
    setToonForm(true);
  }

  function handlePosterChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  async function uploadPoster(file) {
    const ext = file.name.split('.').pop();
    const naam = `poster-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posters').upload(naam, file, { upsert: true });
    if (error) throw new Error('Upload mislukt: ' + error.message);
    const { data } = supabase.storage.from('posters').getPublicUrl(naam);
    return data.publicUrl;
  }

  async function genereerOmschrijving() {
    if (!form.title) { toonMelding('Vul eerst een naam in'); return; }
    setAiBezig(true);
    try {
      const res = await fetch('/api/ai-omschrijving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, type: form.type, venue: form.venue_naam,
          datum: form.datum, leeftijd: form.leeftijd,
          prijs: form.prijs === 'Gratis' ? 'Gratis' : `€${form.prijs_bedrag}`,
        }),
      });
      const data = await res.json();
      if (data.error) { toonMelding('AI fout: ' + data.error); return; }
      upd('omschrijving', data.tekst);
    } catch {
      toonMelding('AI kon geen tekst genereren');
    } finally {
      setAiBezig(false);
    }
  }

  async function opslaan_(e) {
    e.preventDefault();
    setBezig(true);

    const { data: { user } } = await supabase.auth.getUser();
    const prijs = form.prijs === 'Gratis' ? 'Gratis' : `€${form.prijs_bedrag},–`;
    const tijd  = `${form.tijd_start} – ${form.tijd_eind}`;

    let poster_url = posterPreview && !posterFile ? posterPreview : null;
    if (posterFile) {
      try { poster_url = await uploadPoster(posterFile); }
      catch (err) { toonMelding(err.message); setBezig(false); return; }
    }

    const payload = {
      title: form.title, type: form.type, datum: form.datum, tijd, prijs,
      leeftijd: form.leeftijd, adres: form.adres, omschrijving: form.omschrijving,
      ticket_url: form.ticket_url || null, ticket_shortcode: form.ticket_shortcode || null,
      venue_naam: form.venue_naam, goedgekeurd: form.goedgekeurd,
      eigenaar_id: user?.id, poster_url: poster_url || null,
      meta_pixel_id: form.meta_pixel_id || null, tiktok_pixel_id: form.tiktok_pixel_id || null,
      hot: form.hot,
      is_centrumbreed: form.is_centrumbreed,
      extra_info: {
        artiesten: form.artiesten || null,
        verwacht_bezoekers: form.verwacht_bezoekers || null,
        publiek: form.publiek,
        genres: form.genres,
        instagram_tags: form.instagram_tags || null,
        crosspost_instagram: form.crosspost_instagram,
        instagram_audio: form.instagram_audio || null,
        promotie_kanalen: form.promotie_kanalen,
        deelnemende_venues: form.deelnemende_venues,
        extra_secties: form.extra_secties.filter(s => s.titel || s.tekst),
        extra_knoppen: form.extra_knoppen.filter(k => k.label),
        banner_fotos: form.banner_fotos.filter(Boolean),
        centrum_logo_url: form.centrum_logo_url || null,
      },
    };

    if (bewerkId) {
      const { error } = await supabase.from('events').update(payload).eq('id', bewerkId);
      if (error) { toonMelding('Fout: ' + error.message); setBezig(false); return; }
      toonMelding('Event opgeslagen ✓');
    } else {
      payload.slug = form.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '-' + Date.now();
      payload.gemaakt_door = user?.email || null;
      const { error } = await supabase.from('events').insert(payload);
      if (error) { toonMelding('Fout: ' + error.message); setBezig(false); return; }
      toonMelding('Event aangemaakt ✓');
    }

    setBezig(false);
    setToonForm(false);
    laadEvents();
  }

  async function verwijder(id) {
    if (!confirm('Event verwijderen?')) return;
    await supabase.from('events').delete().eq('id', id);
    setEvents(ev => ev.filter(e => e.id !== id));
    toonMelding('Event verwijderd');
  }

  async function toggleGoedkeuring(ev) {
    const { error } = await supabase.from('events').update({ goedgekeurd: !ev.goedgekeurd }).eq('id', ev.id);
    if (error) { toonMelding('❌ ' + error.message); return; }
    setEvents(evs => evs.map(e => e.id === ev.id ? { ...e, goedgekeurd: !e.goedgekeurd } : e));
    toonMelding(!ev.goedgekeurd ? '✓ Event gepubliceerd' : 'Event verborgen');
  }

  function toonMelding(t) { setMelding(t); setTimeout(() => setMelding(''), 4000); }

  const gefilterd = events.filter(e =>
    filter === 'alle' ? true : filter === 'pending' ? !e.goedgekeurd : e.goedgekeurd
  );

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje';
  const SEC = 'rounded-xl border border-[#2a2a2a] p-4 space-y-3';

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Events</h1>
            <p className="text-gray-500 text-sm mt-1">{events.length} events · {events.filter(e=>!e.goedgekeurd).length} in behandeling</p>
          </div>
          <button onClick={nieuw}
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuw event
          </button>
        </div>

        {melding && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${melding.includes('Fout') || melding.includes('fout') || melding.includes('mislukt') ? 'bg-red-950/30 border border-red-800/40 text-red-400' : 'bg-green-950/30 border border-green-800/40 text-green-400'}`}>
            {melding}
          </div>
        )}

        {/* ── Formulier ── */}
        {toonForm && (
          <div className="mb-6 rounded-xl border border-[#F27A00]/30 p-6" style={{ backgroundColor: '#141414' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-black uppercase text-sm" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
                {bewerkId ? 'Event bewerken' : 'Nieuw event'}
              </p>
              <button onClick={() => setToonForm(false)} className="text-gray-600 hover:text-white text-sm">✕ Sluiten</button>
            </div>

            <form onSubmit={opslaan_} className="space-y-5">

              {/* Centrumbreed toggle */}
              <div className={`${SEC} border-2 ${form.is_centrumbreed ? 'border-oranje/50 bg-oranje/5' : 'border-[#2a2a2a]'}`} style={{ backgroundColor: form.is_centrumbreed ? 'rgba(242,122,0,0.05)' : '#0d0d0d' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: form.is_centrumbreed ? '#F27A00' : '#888' }}>
                      🏙️ Centrumbreed evenement
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">Overstijgt een enkele locatie — meerdere zaken doen mee</p>
                  </div>
                  <button type="button"
                    onClick={() => { upd('is_centrumbreed', !form.is_centrumbreed); if (!form.is_centrumbreed && bewerkId) laadSubEvents(bewerkId); }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_centrumbreed ? 'bg-oranje' : 'bg-[#333]'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_centrumbreed ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Basisinfo */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Basisinfo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Naam *</label>
                    <input value={form.title} onChange={e => upd('title', e.target.value)} required className={INP} />
                  </div>

                  {/* Venue */}
                  <div className="relative">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Locatie</label>
                    <input
                      value={form.venue_naam}
                      onChange={e => { upd('venue_naam', e.target.value); setToonVenueLijst(true); }}
                      onFocus={() => setToonVenueLijst(true)}
                      placeholder="Zoek of typ locatienaam..."
                      className={INP}
                    />
                    {toonVenueLijst && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border border-[#2a2a2a] bg-[#141414] shadow-xl max-h-52 overflow-y-auto">
                        {venues.filter(v => !form.venue_naam || v.naam.toLowerCase().includes(form.venue_naam.toLowerCase())).map(v => (
                          <button key={v.id} type="button" onMouseDown={() => kiesVenue(v)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1e1e1e] transition-colors text-left">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#333] bg-[#0d0d0d] flex-shrink-0 flex items-center justify-center">
                              {v.logo_url ? <img src={v.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-black text-gray-500">{v.naam.charAt(0)}</span>}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{v.naam}</p>
                              {v.adres && <p className="text-xs text-gray-600">{v.adres}</p>}
                            </div>
                          </button>
                        ))}
                        <button type="button" onMouseDown={() => setToonVenueLijst(false)} className="w-full text-center text-xs text-gray-700 py-2 border-t border-[#1e1e1e]">Sluiten</button>
                      </div>
                    )}
                    {toonVenueLijst && <div className="fixed inset-0 z-40" onClick={() => setToonVenueLijst(false)} />}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Type</label>
                    <select value={form.type} onChange={e => upd('type', e.target.value)} className={INP}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Datum *</label>
                    <input type="date" value={form.datum} onChange={e => upd('datum', e.target.value)} required className={INP + ' [color-scheme:dark]'} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Leeftijd</label>
                    <input value={form.leeftijd} onChange={e => upd('leeftijd', e.target.value)} placeholder="18+ / 21+" className={INP} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Starttijd</label>
                    <input type="time" value={form.tijd_start} onChange={e => upd('tijd_start', e.target.value)} className={INP + ' [color-scheme:dark]'} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Eindtijd</label>
                    <input type="time" value={form.tijd_eind} onChange={e => upd('tijd_eind', e.target.value)} className={INP + ' [color-scheme:dark]'} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Entree</label>
                    <select value={form.prijs} onChange={e => upd('prijs', e.target.value)} className={INP}>
                      <option>Gratis</option><option>Betaald</option>
                    </select>
                  </div>
                  {form.prijs === 'Betaald' ? (
                    <div>
                      <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Prijs (€)</label>
                      <input type="number" min="0" step="0.50" value={form.prijs_bedrag} onChange={e => upd('prijs_bedrag', e.target.value)} className={INP} />
                    </div>
                  ) : <div />}

                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Adres</label>
                    <PlacesInput value={form.adres} onChange={v => upd('adres', v)} placeholder="Zoek adres of locatie..." />
                  </div>
                </div>
              </div>

              {/* Poster */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Poster</p>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-20 rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#141414] flex items-center justify-center" style={{ aspectRatio: '4/5' }}>
                    {posterPreview
                      ? <img src={posterPreview} alt="poster" className="w-full h-full object-cover" />
                      : <svg width="24" height="24" fill="none" stroke="#444" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>}
                  </div>
                  <div className="space-y-2">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 text-xs hover:border-oranje hover:text-oranje transition-colors w-fit">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      {posterFile ? posterFile.name : 'Kies afbeelding'}
                      <input type="file" accept="image/*" onChange={handlePosterChange} className="hidden" />
                    </label>
                    {posterPreview && (
                      <button type="button" onClick={() => { setPosterFile(null); setPosterPreview(null); }} className="text-xs text-red-400 hover:text-red-300">
                        Verwijder poster
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Centrum logo + banner (alleen bij centrumbreed) */}
              {form.is_centrumbreed && (
                <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Centrum logo & banner foto's</p>

                  {/* Logo */}
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Event logo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#141414] flex items-center justify-center flex-shrink-0">
                        {form.centrum_logo_url
                          ? <img src={form.centrum_logo_url} alt="" className="w-full h-full object-cover" />
                          : <svg width="20" height="20" fill="none" stroke="#444" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
                      </div>
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 text-xs hover:border-oranje hover:text-oranje transition-colors">
                        {centrumLogoBezig ? <div className="w-3 h-3 border border-oranje border-t-transparent rounded-full animate-spin" /> : '↑'}
                        Logo uploaden
                        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadCentrumLogo(e.target.files[0])} className="hidden" />
                      </label>
                      {form.centrum_logo_url && (
                        <button type="button" onClick={() => upd('centrum_logo_url', '')} className="text-xs text-red-400 hover:text-red-300">Verwijder</button>
                      )}
                    </div>
                  </div>

                  {/* Banner fotos */}
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Banner foto's <span className="normal-case font-normal text-gray-600">(max 4)</span></label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0,1,2,3].map(i => {
                        const url = form.banner_fotos[i] || null;
                        return (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#141414] flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                            {url ? (
                              <>
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => { const f=[...form.banner_fotos]; f.splice(i,1); upd('banner_fotos',f.filter(Boolean)); }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-red-600">✕</button>
                              </>
                            ) : (
                              <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-[#1e1e1e] transition-colors">
                                {bannerBezig[i]
                                  ? <div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
                                  : <span className="text-gray-600 text-lg">+</span>}
                                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadBannerFoto(e.target.files[0], i)} className="hidden" disabled={bannerBezig[i]} />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Omschrijving */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Omschrijving</p>
                  <button type="button" onClick={genereerOmschrijving} disabled={aiBezig}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-purple-700/50 text-purple-400 hover:bg-purple-950/30 transition-colors disabled:opacity-50">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {aiBezig ? 'AI schrijft...' : 'Genereer met AI'}
                  </button>
                </div>
                <textarea value={form.omschrijving} onChange={e => upd('omschrijving', e.target.value)} rows={3}
                  placeholder="Beschrijving van het event..."
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
              </div>

              {/* Tickets */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Tickets</p>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Ticket URL</label>
                  <input type="url" value={form.ticket_url} onChange={e => upd('ticket_url', e.target.value)} placeholder="https://..." className={INP} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Ticketshop shortcode / embed</label>
                  <textarea value={form.ticket_shortcode} onChange={e => upd('ticket_shortcode', e.target.value)} rows={2}
                    placeholder="[ticketshop id=&quot;123&quot;] of embed code..."
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none font-mono" />
                </div>
              </div>

              {/* Line-up & Publiek */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Line-up & Publiek</p>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Artiesten / DJ's</label>
                  <input value={form.artiesten} onChange={e => upd('artiesten', e.target.value)} placeholder="DJ Snake, Armin van Buuren, ..." className={INP} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Verwacht aantal bezoekers</label>
                  <select value={form.verwacht_bezoekers} onChange={e => upd('verwacht_bezoekers', e.target.value)} className={INP}>
                    <option value="">— Kies een schatting —</option>
                    {['< 50', '50 – 100', '100 – 250', '250 – 500', '500 – 1000', '1000+'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Muziekgenre(s)</label>
                  <MultiChips opties={GENRE_OPTIES} gekozen={form.genres} onChange={v => upd('genres', v)}
                    eigenWaarde={eigenGenre} setEigenWaarde={setEigenGenre} placeholder="Eigen genre toevoegen..." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Welk publiek verwacht je?</label>
                  <MultiChips opties={PUBLIEK_OPTIES} gekozen={form.publiek} onChange={v => upd('publiek', v)}
                    eigenWaarde={eigenPubliek} setEigenWaarde={setEigenPubliek} placeholder="Eigen publiektype toevoegen..." />
                </div>
              </div>

              {/* Sociale media */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Sociale Media & Promotie</p>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Instagram accounts taggen</label>
                  <input value={form.instagram_tags} onChange={e => upd('instagram_tags', e.target.value)} placeholder="@jouwzaak, @djnaam" className={INP} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Crosspost Instagram</label>
                  <div className="flex gap-2">
                    {[['true','Ja, graag!'],['false','Nee']].map(([val,lab]) => (
                      <button key={val} type="button" onClick={() => upd('crosspost_instagram', val === 'true')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${String(form.crosspost_instagram) === val ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje'}`}>
                        {lab}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Instagram audio</label>
                  <input value={form.instagram_audio} onChange={e => upd('instagram_audio', e.target.value)} placeholder="Naam nummer of artiest" className={INP} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Promotie via</label>
                  <div className="flex flex-wrap gap-2">
                    {PROMOTIE_OPTIES.map(p => (
                      <button key={p} type="button"
                        onClick={() => upd('promotie_kanalen', form.promotie_kanalen.includes(p) ? form.promotie_kanalen.filter(x => x !== p) : [...form.promotie_kanalen, p])}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${form.promotie_kanalen.includes(p) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Knoppen */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Knoppen</p>
                  <button type="button" onClick={() => upd('extra_knoppen', [...form.extra_knoppen, { ...leegKnop }])}
                    className="text-xs text-gray-500 border border-[#333] px-3 py-1 rounded-lg hover:border-oranje hover:text-oranje transition-colors">
                    + Knop toevoegen
                  </button>
                </div>
                {form.extra_knoppen.map((knop, i) => (
                  <div key={i} className="border border-[#1e1e1e] rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={knop.label} onChange={e => { const k=[...form.extra_knoppen]; k[i]={...k[i],label:e.target.value}; upd('extra_knoppen',k); }}
                        placeholder="Knoptekst" maxLength={30} className={INP + ' flex-1'} />
                      <input type="url" value={knop.url} onChange={e => { const k=[...form.extra_knoppen]; k[i]={...k[i],url:e.target.value}; upd('extra_knoppen',k); }}
                        placeholder="https://..." className={INP + ' flex-1'} />
                      {form.extra_knoppen.length > 1 && (
                        <button type="button" onClick={() => { const k=[...form.extra_knoppen]; k.splice(i,1); upd('extra_knoppen',k); }}
                          className="text-red-400 hover:text-red-300 text-xs px-2">✕</button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-600">Kleur:</span>
                      {KNOP_KLEUREN.map(c => (
                        <button key={c.value} type="button"
                          onClick={() => { const k=[...form.extra_knoppen]; k[i]={...k[i],kleur:c.value,tekst:c.tekst}; upd('extra_knoppen',k); }}
                          title={c.label}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${knop.kleur === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c.value === 'transparent' ? 'transparent' : c.value, borderColor: knop.kleur === c.value ? '#fff' : c.value === 'transparent' ? '#555' : 'transparent' }} />
                      ))}
                      <span className="ml-2 px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: knop.kleur === 'transparent' ? 'transparent' : knop.kleur, color: knop.tekst, border: knop.kleur === 'transparent' ? '1px solid #F27A00' : 'none' }}>
                        {knop.label || 'Voorbeeld'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tracking pixels */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Tracking</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Meta Pixel ID</label>
                    <input value={form.meta_pixel_id} onChange={e => upd('meta_pixel_id', e.target.value)} placeholder="123456789" className={INP} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">TikTok Pixel ID</label>
                    <input value={form.tiktok_pixel_id} onChange={e => upd('tiktok_pixel_id', e.target.value)} placeholder="ABCDE12345" className={INP} />
                  </div>
                </div>
              </div>

              {/* Deelnemende locaties (centrum events) */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Deelnemende locaties <span className="normal-case font-normal text-gray-700">(voor centrum-brede events)</span></p>
                <div className="flex flex-wrap gap-2">
                  {venues.map(v => (
                    <button key={v.id} type="button"
                      onClick={() => {
                        const sel = form.deelnemende_venues;
                        upd('deelnemende_venues', sel.includes(v.naam) ? sel.filter(n => n !== v.naam) : [...sel, v.naam]);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${form.deelnemende_venues.includes(v.naam) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                      {v.naam}
                    </button>
                  ))}
                </div>
                {form.deelnemende_venues.length > 0 && (
                  <p className="text-xs text-gray-600">{form.deelnemende_venues.length} locatie{form.deelnemende_venues.length !== 1 ? 's' : ''} geselecteerd</p>
                )}
              </div>

              {/* Extra content secties */}
              <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Extra content secties</p>
                  <button type="button"
                    onClick={() => upd('extra_secties', [...form.extra_secties, { titel: '', tekst: '' }])}
                    className="text-xs text-gray-500 border border-[#333] px-3 py-1 rounded-lg hover:border-oranje hover:text-oranje transition-colors">
                    + Sectie toevoegen
                  </button>
                </div>
                {form.extra_secties.map((sectie, i) => (
                  <div key={i} className="space-y-2 border border-[#1e1e1e] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <input value={sectie.titel} onChange={e => { const s=[...form.extra_secties]; s[i]={...s[i],titel:e.target.value}; upd('extra_secties',s); }}
                        placeholder="Sectietitel (bijv. 'Programma')" className={INP + ' flex-1'} />
                      {form.extra_secties.length > 1 && (
                        <button type="button" onClick={() => { const s=[...form.extra_secties]; s.splice(i,1); upd('extra_secties',s); }}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-2">✕</button>
                      )}
                    </div>
                    <textarea value={sectie.tekst} onChange={e => { const s=[...form.extra_secties]; s[i]={...s[i],tekst:e.target.value}; upd('extra_secties',s); }}
                      placeholder="Tekst van deze sectie..." rows={3}
                      className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
                  </div>
                ))}
              </div>

              {/* Gekoppelde sub-events (centrumbreed) */}
              {form.is_centrumbreed && bewerkId && (
                <div className={SEC} style={{ backgroundColor: '#0d0d0d' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Gekoppelde events van locaties</p>
                  {subEvents.length === 0 ? (
                    <p className="text-xs text-gray-600">Nog geen events gekoppeld. Zaken kunnen hun event aan dit evenement koppelen via het event-aanmeldsysteem.</p>
                  ) : (
                    <div className="space-y-2">
                      {subEvents.map(se => (
                        <div key={se.id} className="flex items-center gap-3 border border-[#1e1e1e] rounded-xl p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{se.title}</p>
                            <p className="text-xs text-gray-500">{se.venue_naam} · {se.datum} · {se.prijs}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${se.centrumbreed_link_goedgekeurd ? 'bg-green-950/50 text-green-400' : 'bg-yellow-950/50 text-yellow-500'}`}>
                            {se.centrumbreed_link_goedgekeurd ? 'Goedgekeurd' : 'Wacht'}
                          </span>
                          <button type="button" onClick={() => toggleCentrumLink(se.id, se.centrumbreed_link_goedgekeurd)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:text-white transition-colors flex-shrink-0">
                            {se.centrumbreed_link_goedgekeurd ? 'Verberg' : 'Goedkeuren'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Publicatie */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="goedgekeurd" checked={form.goedgekeurd}
                    onChange={e => upd('goedgekeurd', e.target.checked)} className="accent-oranje w-4 h-4" />
                  <label htmlFor="goedgekeurd" className="text-sm text-gray-400 cursor-pointer">Direct publiceren (goedgekeurd)</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="hot" checked={form.hot}
                    onChange={e => upd('hot', e.target.checked)} className="accent-oranje w-4 h-4" />
                  <label htmlFor="hot" className="text-sm text-gray-400 cursor-pointer">🔥 Hot (uitgelicht)</label>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={bezig}
                  className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {bezig ? 'Opslaan...' : bewerkId ? 'Opslaan' : 'Aanmaken'}
                </button>
                <button type="button" onClick={() => setToonForm(false)}
                  className="px-6 py-2.5 rounded-lg text-sm text-gray-400 border border-[#333] hover:text-white">
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[['alle','Alle'],['pending','In behandeling'],['live','Gepubliceerd']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className="px-4 py-1.5 rounded-full text-xs font-bold border transition-all"
              style={{
                backgroundColor: filter === v ? '#F27A00' : 'transparent',
                borderColor: filter === v ? '#F27A00' : '#333',
                color: filter === v ? 'black' : '#666',
              }}>
              {l} {v === 'pending' && events.filter(e=>!e.goedgekeurd).length > 0 && `(${events.filter(e=>!e.goedgekeurd).length})`}
            </button>
          ))}
        </div>

        {/* Lijst */}
        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : gefilterd.length === 0 ? (
          <div className="text-gray-600 text-sm text-center py-20">Geen events gevonden.</div>
        ) : (
          <div className="space-y-2">
            {gefilterd.map(ev => {
              const ei = ev.extra_info || {};
              const isOpen = openDetail === ev.id;
              return (
                <div key={ev.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
                      <span className="text-[9px] font-bold text-gray-500 uppercase leading-none">{ev.datum ? MAANDEN[new Date(ev.datum + 'T12:00:00').getMonth()] : '–'}</span>
                      <span className="text-lg font-black text-white leading-none">{ev.datum ? new Date(ev.datum + 'T12:00:00').getDate() : '–'}</span>
                    </div>
                    {ev.poster_url && <img src={ev.poster_url} alt="" className="w-8 h-10 rounded object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{ev.title}</p>
                      <p className="text-xs text-gray-500 truncate">{ev.venue_naam} · {ev.type} · {ev.prijs} · {ev.leeftijd}</p>
                      {ei.artiesten && <p className="text-[10px] text-gray-700 mt-0.5">🎤 {ei.artiesten}</p>}
                      <p className="text-[10px] text-gray-700 mt-0.5">
                        {ev.gemaakt_door && <span>Door <span className="text-gray-600">{ev.gemaakt_door}</span> · </span>}
                        {ev.created_at && <span>{formatTijdstip(ev.created_at)}</span>}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${ev.goedgekeurd ? 'bg-green-950/50 text-green-400' : 'bg-yellow-950/50 text-yellow-500'}`}>
                      {ev.goedgekeurd ? 'Live' : 'Wacht'}
                    </span>
                    <div className="flex gap-2 flex-shrink-0">
                      {(() => {
                        const venue = venues.find(vn => vn.naam === ev.venue_naam);
                        return (<>
                          {venue?.instagram && (
                            <a href={`https://instagram.com/${venue.instagram}`} target="_blank" rel="noopener noreferrer"
                              title={`@${venue.instagram}`}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-pink-400 hover:border-pink-500 hover:text-pink-300 transition-colors">
                              IG
                            </a>
                          )}
                          {(ev.knop_url || venue?.website) && (
                            <a href={ev.knop_url || venue.website} target="_blank" rel="noopener noreferrer"
                              title={ev.knop_url || venue.website}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-blue-400 hover:border-blue-500 hover:text-blue-300 transition-colors">
                              🌐
                            </a>
                          )}
                        </>);
                      })()}
                      <button onClick={() => setOpenDetail(isOpen ? null : ev.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isOpen ? 'bg-blue-950/40 border-blue-700/50 text-blue-400' : 'border-[#333] text-gray-600 hover:text-blue-400 hover:border-blue-700/50'}`}>
                        {isOpen ? '▲ Info' : '▼ Info'}
                      </button>
                      <button onClick={async () => {
                        const { error } = await supabase.from('events').update({ hot: !ev.hot }).eq('id', ev.id);
                        if (!error) setEvents(evs => evs.map(e => e.id === ev.id ? { ...e, hot: !e.hot } : e));
                      }} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${ev.hot ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-600 hover:text-oranje hover:border-oranje'}`}>
                        🔥
                      </button>
                      <button onClick={() => toggleGoedkeuring(ev)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:text-white transition-colors">
                        {ev.goedgekeurd ? 'Depubliceer' : 'Publiceer'}
                      </button>
                      <button onClick={() => bewerk(ev)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: '#F27A00' }}>
                        Bewerk
                      </button>
                      <button onClick={() => verwijder(ev.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-900/40 hover:bg-red-950/30 transition-colors">
                        ✕
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#1e1e1e] p-5 grid grid-cols-2 gap-5" style={{ backgroundColor: '#111' }}>
                      <div className="space-y-4">
                        {ev.poster_url && (
                          <img src={ev.poster_url} alt="" className="w-full max-w-[160px] rounded-xl object-cover border border-[#2a2a2a]" style={{ aspectRatio: '4/5' }} />
                        )}
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Event info</p>
                          <div className="space-y-1">
                            <InfoRij label="Datum" waarde={formatDatum(ev.datum)} />
                            <InfoRij label="Tijd" waarde={ev.tijd} />
                            <InfoRij label="Entree" waarde={ev.prijs} />
                            <InfoRij label="Leeftijd" waarde={ev.leeftijd} />
                            <InfoRij label="Locatie" waarde={ev.venue_naam} />
                            <InfoRij label="Adres" waarde={ev.adres} />
                            {ev.ticket_url && <InfoRij label="Ticket URL" waarde={<a href={ev.ticket_url} target="_blank" className="text-oranje hover:underline truncate block max-w-[180px]">{ev.ticket_url}</a>} />}
                            {ev.ticket_shortcode && <InfoRij label="Shortcode" waarde={<code className="text-xs bg-black/50 px-1.5 py-0.5 rounded text-gray-400">{ev.ticket_shortcode.slice(0,40)}{ev.ticket_shortcode.length > 40 ? '…' : ''}</code>} />}
                          </div>
                        </div>
                        {(ev.knop_label || ev.meta_pixel_id || ev.tiktok_pixel_id) && (
                          <div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Eigen knop & pixels</p>
                            <div className="space-y-1">
                              {ev.knop_label && <InfoRij label="Knop" waarde={`${ev.knop_label} → ${ev.knop_url}`} />}
                              {ev.meta_pixel_id && <InfoRij label="Meta Pixel" waarde={ev.meta_pixel_id} />}
                              {ev.tiktok_pixel_id && <InfoRij label="TikTok Pixel" waarde={ev.tiktok_pixel_id} />}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {ei.artiesten && <div><p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Artiesten / DJ's</p><p className="text-white text-sm">{ei.artiesten}</p></div>}
                        {ei.verwacht_bezoekers && <InfoRij label="Verwachte bezoekers" waarde={ei.verwacht_bezoekers} />}
                        {ei.genres?.length > 0 && <div><p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Muziekgenre</p><div className="flex flex-wrap gap-1.5">{ei.genres.map(g => <ChipTag key={g} label={g} kleur="oranje" />)}</div></div>}
                        {ei.publiek?.length > 0 && <div><p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Publiek</p><div className="flex flex-wrap gap-1.5">{ei.publiek.map(p => <ChipTag key={p} label={p} />)}</div></div>}
                        {ei.instagram_tags && <div><p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Instagram tags</p><p className="text-oranje text-sm">{ei.instagram_tags}</p></div>}
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Crosspost Instagram</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ei.crosspost_instagram ? 'bg-green-950/50 text-green-400' : 'bg-[#1e1e1e] text-gray-600'}`}>
                            {ei.crosspost_instagram ? 'Ja, graag!' : 'Nee'}
                          </span>
                        </div>
                        {ei.instagram_audio && <InfoRij label="Instagram audio" waarde={ei.instagram_audio} />}
                        {ei.promotie_kanalen?.length > 0 && <div><p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Promotie via</p><div className="flex flex-wrap gap-1.5">{ei.promotie_kanalen.map(p => <ChipTag key={p} label={p} />)}</div></div>}
                        {ev.omschrijving && <div><p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Omschrijving</p><p className="text-gray-400 text-xs leading-relaxed">{ev.omschrijving}</p></div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
