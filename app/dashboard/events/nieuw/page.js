'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { supabase } from '@/lib/supabase';

const typeOpties = ['Feestcafé', 'Club Night', 'Karaoke', 'Live Muziek', 'Quiz', 'Borrel', 'Festival', 'Overig'];
const LABEL_SUGGESTIES = ['50% KORT', '1+1', 'GRATIS', '2e GRATIS', 'HAPPY HOUR', 'DEAL', 'NIEUW', 'ACTIE'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
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

const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors';

export default function NieuwEventPage() {
  const [alleVenues, setAlleVenues] = useState([]);
  const [toonVenueLijst, setToonVenueLijst] = useState(false);
  const [posterBezig, setPosterBezig] = useState(false);

  const [form, setForm] = useState({
    title: '', type: 'Club Night', datum: '',
    tijd_start: '22:00', tijd_eind: '04:00',
    prijs: 'Gratis', prijs_bedrag: '', leeftijd: '18+',
    venue_naam: '', adres: '', omschrijving: '',
    poster_url: '',
    // Extra info
    artiesten: '',
    verwacht_bezoekers: '',
    publiek: [],
    genres: [],
    instagram_tags: '',
    crosspost_instagram: false,
    instagram_audio: '',
    promotie_kanalen: [],
    // Tickets
    ticket_url: '', ticket_shortcode: '',
    // Eigen knop & pixels
    knop_label: '', knop_url: '',
    meta_pixel_id: '', tiktok_pixel_id: '',
  });

  const [laden, setLaden]   = useState(false);
  const [succes, setSucces] = useState(false);
  const [fout, setFout]     = useState('');
  const [eigenGenre, setEigenGenre] = useState('');
  const [eigenPubliek, setEigenPubliek] = useState('');

  // Actie aanmaken
  const [actieAanmaken, setActieAanmaken] = useState(false);
  const [actieForm, setActieForm] = useState({
    titel: '', omschrijving: '', label: '',
    geldigheid: 'datums', geldig_van: '', geldig_tot: '',
    vaste_dagen: [], weken: 4,
  });

  useEffect(() => {
    supabase.from('venues').select('id, naam, adres, logo_url').order('naam')
      .then(({ data }) => setAlleVenues(data || []));
  }, []);

  // Sync actie datums wanneer event datum wijzigt
  useEffect(() => {
    if (form.datum) {
      setActieForm(f => ({
        ...f,
        geldig_van: f.geldig_van || form.datum,
        geldig_tot: f.geldig_tot || form.datum,
      }));
    }
  }, [form.datum]);

  function kiesVenue(v) {
    setForm(f => ({ ...f, venue_naam: v.naam, adres: v.adres || f.adres }));
    setToonVenueLijst(false);
  }

  function update(veld, waarde) {
    setForm(f => ({ ...f, [veld]: waarde }));
  }

  function toggleMulti(veld, waarde) {
    setForm(f => ({
      ...f,
      [veld]: f[veld].includes(waarde) ? f[veld].filter(x => x !== waarde) : [...f[veld], waarde],
    }));
  }

  function updActie(veld, waarde) {
    setActieForm(f => ({ ...f, [veld]: waarde }));
  }

  function toggleDag(d) {
    setActieForm(f => ({
      ...f,
      vaste_dagen: f.vaste_dagen.includes(d) ? f.vaste_dagen.filter(x => x !== d) : [...f.vaste_dagen, d],
    }));
  }

  async function uploadPoster(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterBezig(true);
    const ext = file.name.split('.').pop();
    const naam = `poster-nieuw-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posters').upload(naam, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('posters').getPublicUrl(naam);
      update('poster_url', data.publicUrl);
    }
    setPosterBezig(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFout('');
    setLaden(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFout('Niet ingelogd.'); setLaden(false); return; }

    const prijs = form.prijs === 'Gratis' ? 'Gratis' : `€${form.prijs_bedrag},–`;
    const tijd  = `${form.tijd_start} – ${form.tijd_eind}`;
    const slug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    const { data: evData, error } = await supabase.from('events').insert({
      title:        form.title,
      type:         form.type,
      datum:        form.datum,
      tijd,
      prijs,
      leeftijd:     form.leeftijd,
      adres:        form.adres,
      omschrijving: form.omschrijving,
      poster_url:   form.poster_url || null,
      ticket_url:   form.ticket_url || null,
      ticket_shortcode: form.ticket_shortcode || null,
      knop_label:   form.knop_label || null,
      knop_url:     form.knop_url || null,
      meta_pixel_id: form.meta_pixel_id || null,
      tiktok_pixel_id: form.tiktok_pixel_id || null,
      // Extra info opgeslagen als JSON in extra_info kolom
      extra_info: {
        artiesten: form.artiesten || null,
        verwacht_bezoekers: form.verwacht_bezoekers || null,
        publiek: form.publiek,
        genres: form.genres,
        instagram_tags: form.instagram_tags || null,
        crosspost_instagram: form.crosspost_instagram,
        instagram_audio: form.instagram_audio || null,
        promotie_kanalen: form.promotie_kanalen,
      },
      eigenaar_id:  user.id,
      venue_naam:   form.venue_naam || user.user_metadata?.venue_naam || '',
      goedgekeurd:  false,
      gemaakt_door: user.email,
      slug,
    }).select('id').single();

    if (error) {
      setFout('Opslaan mislukt: ' + error.message);
      setLaden(false);
      return;
    }

    const newEventId = evData?.id;

    if (actieAanmaken && actieForm.titel && newEventId) {
      let geldig_tot = null;
      let vaste_dagen = null;

      if (actieForm.geldigheid === 'datums') {
        geldig_tot = actieForm.geldig_tot || form.datum || null;
      } else if (actieForm.geldigheid === 'vaste_dagen') {
        vaste_dagen = actieForm.vaste_dagen;
        const d = new Date();
        d.setDate(d.getDate() + actieForm.weken * 7);
        geldig_tot = d.toISOString().slice(0, 10);
      }

      await supabase.from('acties').insert({
        titel: actieForm.titel,
        omschrijving: actieForm.omschrijving || null,
        label: actieForm.label || null,
        event_id: newEventId,
        eigenaar_id: user.id,
        geldig_van: actieForm.geldigheid === 'datums' ? (actieForm.geldig_van || form.datum || null) : null,
        geldig_tot,
        vaste_dagen,
        onbepaalde_tijd: false,
        hot: false,
        gepubliceerd: true,
      });
    }

    setSucces(true);
  }

  if (succes) return (
    <DashboardShell>
      <div className="px-6 py-16 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#F27A00' }}>
          <svg width="32" height="32" fill="none" stroke="black" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h1 className="text-3xl font-black uppercase mb-3" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Event ingediend!</h1>
        <p className="text-gray-400 text-sm mb-8">Je event wordt beoordeeld en verschijnt binnenkort op de website.</p>
        <div className="flex gap-3 justify-center">
          <a href="/dashboard/events/nieuw"
            className="px-6 py-2.5 rounded-lg border border-[#333] text-sm font-semibold text-gray-400 hover:text-white">
            Nog een event
          </a>
          <a href="/dashboard"
            className="px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Naar dashboard
          </a>
        </div>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/dashboard/events" className="text-gray-600 text-sm hover:text-white transition-colors">← Terug</a>
          <h1 className="text-4xl font-black uppercase mt-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Nieuw Event
          </h1>
          <p className="text-gray-500 text-sm mt-1">Vul de gegevens in. Het event wordt ter goedkeuring ingediend.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Basisinfo ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Basisinfo</p>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Naam van het event *</label>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)} required
                placeholder="Vrijdagnacht Good Fellows" className={INP} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Type *</label>
                <select value={form.type} onChange={e => update('type', e.target.value)} className={INP}>
                  {typeOpties.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Leeftijd *</label>
                <select value={form.leeftijd} onChange={e => update('leeftijd', e.target.value)} className={INP}>
                  {['18+', '21+', '25+', '16+/18+', 'Iedereen'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Omschrijving</label>
              <textarea value={form.omschrijving} onChange={e => update('omschrijving', e.target.value)} rows={3}
                placeholder="Beschrijf het event in een paar zinnen..."
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors resize-none" />
            </div>
          </div>

          {/* ── Datum & tijd ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Datum & Tijd</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Datum *</label>
                <input type="date" value={form.datum} onChange={e => update('datum', e.target.value)} required className={INP} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Start</label>
                <input type="time" value={form.tijd_start} onChange={e => update('tijd_start', e.target.value)} className={INP} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Einde</label>
                <input type="time" value={form.tijd_eind} onChange={e => update('tijd_eind', e.target.value)} className={INP} />
              </div>
            </div>
          </div>

          {/* ── Poster ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Event Poster</p>
            <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#2a2a2a] text-sm text-gray-500 cursor-pointer hover:border-oranje transition-colors w-full">
              {posterBezig ? (
                <div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              )}
              {form.poster_url ? 'Verander poster' : 'Poster uploaden (JPG, PNG)'}
              <input type="file" accept="image/*" onChange={uploadPoster} className="hidden" disabled={posterBezig} />
            </label>
            {form.poster_url && (
              <img src={form.poster_url} alt="" className="h-32 rounded-lg object-cover" />
            )}
          </div>

          {/* ── Locatie & prijs ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Locatie & Entree</p>

            <div className="relative">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Locatie</label>
              <input
                value={form.venue_naam}
                onChange={e => { update('venue_naam', e.target.value); setToonVenueLijst(true); }}
                onFocus={() => setToonVenueLijst(true)}
                placeholder="Zoek of typ een locatienaam..."
                className={INP}
              />
              {toonVenueLijst && alleVenues.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setToonVenueLijst(false)} />
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-[#2a2a2a] bg-[#141414] shadow-2xl max-h-56 overflow-y-auto">
                    {alleVenues
                      .filter(v => !form.venue_naam || v.naam.toLowerCase().includes(form.venue_naam.toLowerCase()))
                      .map(v => (
                        <button key={v.id} type="button" onMouseDown={() => kiesVenue(v)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e1e] transition-colors text-left border-b border-[#1a1a1a] last:border-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#333] bg-[#0d0d0d] flex-shrink-0 flex items-center justify-center">
                            {v.logo_url
                              ? <img src={v.logo_url} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xs font-black text-gray-500">{v.naam.charAt(0)}</span>}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{v.naam}</p>
                            {v.adres && <p className="text-xs text-gray-600">{v.adres}</p>}
                          </div>
                        </button>
                      ))}
                  </div>
                </>
              )}
              {form.adres && <p className="text-xs text-gray-600 mt-1.5">📍 {form.adres}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Entree</label>
                <select value={form.prijs} onChange={e => update('prijs', e.target.value)} className={INP}>
                  <option>Gratis</option>
                  <option>Betaald</option>
                </select>
              </div>
              {form.prijs === 'Betaald' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Prijs (€)</label>
                  <input type="number" min="1" step="0.50" value={form.prijs_bedrag} onChange={e => update('prijs_bedrag', e.target.value)}
                    placeholder="5" className={INP} />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Ticket URL (optioneel)</label>
              <input type="url" value={form.ticket_url} onChange={e => update('ticket_url', e.target.value)}
                placeholder="https://ticketswap.nl/..." className={INP} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">
                Ticketshop shortcode <span className="text-gray-700 normal-case font-normal">(optioneel — embed code van je ticketplatform)</span>
              </label>
              <textarea value={form.ticket_shortcode} onChange={e => update('ticket_shortcode', e.target.value)} rows={2}
                placeholder="[ticketshop id=&quot;123&quot;] of embed code..."
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors resize-none font-mono" />
            </div>
          </div>

          {/* ── Artiesten & line-up ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Line-up & Publiek</p>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Artiesten / DJ's</label>
              <input value={form.artiesten} onChange={e => update('artiesten', e.target.value)}
                placeholder="DJ Snake, Armin van Buuren, ..." className={INP} />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Verwacht aantal bezoekers</label>
              <select value={form.verwacht_bezoekers} onChange={e => update('verwacht_bezoekers', e.target.value)} className={INP}>
                <option value="">— Kies een schatting —</option>
                {['< 50', '50 – 100', '100 – 250', '250 – 500', '500 – 1000', '1000+'].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-2">Welk publiek verwacht je?</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[...PUBLIEK_OPTIES, ...form.publiek.filter(p => !PUBLIEK_OPTIES.includes(p))].map(p => (
                  <button key={p} type="button" onClick={() => toggleMulti('publiek', p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${form.publiek.includes(p) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={eigenPubliek} onChange={e => setEigenPubliek(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); const v = eigenPubliek.trim(); if (v && !form.publiek.includes(v)) { toggleMulti('publiek', v); } setEigenPubliek(''); }
                  }}
                  placeholder="Eigen publiektype toevoegen..."
                  className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-oranje" />
                <button type="button"
                  onClick={() => { const v = eigenPubliek.trim(); if (v && !form.publiek.includes(v)) toggleMulti('publiek', v); setEigenPubliek(''); }}
                  className="px-3 py-2 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
                  + Voeg toe
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-2">Muziekgenre(s)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[...GENRE_OPTIES, ...form.genres.filter(g => !GENRE_OPTIES.includes(g))].map(g => (
                  <button key={g} type="button" onClick={() => toggleMulti('genres', g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${form.genres.includes(g) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={eigenGenre} onChange={e => setEigenGenre(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); const v = eigenGenre.trim(); if (v && !form.genres.includes(v)) toggleMulti('genres', v); setEigenGenre(''); }
                  }}
                  placeholder="Eigen genre toevoegen..."
                  className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-oranje" />
                <button type="button"
                  onClick={() => { const v = eigenGenre.trim(); if (v && !form.genres.includes(v)) toggleMulti('genres', v); setEigenGenre(''); }}
                  className="px-3 py-2 rounded-lg text-xs font-bold border border-[#333] text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
                  + Voeg toe
                </button>
              </div>
            </div>
          </div>

          {/* ── Sociale media & promotie ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Sociale Media & Promotie</p>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">
                Instagram accounts taggen
                <span className="ml-2 text-gray-700 normal-case font-normal">(komma gescheiden, bijv. @goedfellas_hengelo)</span>
              </label>
              <input value={form.instagram_tags} onChange={e => update('instagram_tags', e.target.value)}
                placeholder="@jouwzaak, @djnaam" className={INP} />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-2">
                Wil je de post samen met Stappen In Hengelo crossposten via Instagram?
              </label>
              <p className="text-xs text-gray-600 mb-2">Ja is geen garantie dat we dit doen — we bekijken elke aanvraag apart.</p>
              <div className="flex gap-3">
                {[['true', 'Ja, graag!'], ['false', 'Nee, bedankt']].map(([val, lab]) => (
                  <button key={val} type="button" onClick={() => update('crosspost_instagram', val === 'true')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${String(form.crosspost_instagram) === val ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje'}`}>
                    {lab}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">
                Instagram audio voor posts
                <span className="ml-2 text-gray-700 normal-case font-normal">(welke audio/muziek moeten wij toevoegen als we posten?)</span>
              </label>
              <input value={form.instagram_audio} onChange={e => update('instagram_audio', e.target.value)}
                placeholder="Naam van nummer of artiest" className={INP} />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-2">Op welke manier promoot je het event al?</label>
              <div className="flex flex-wrap gap-2">
                {PROMOTIE_OPTIES.map(p => (
                  <button key={p} type="button" onClick={() => toggleMulti('promotie_kanalen', p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${form.promotie_kanalen.includes(p) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Eigen knop ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Eigen knop (optioneel)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Knoptekst</label>
                <input value={form.knop_label} onChange={e => update('knop_label', e.target.value)}
                  placeholder="Bestel tickets" className={INP} maxLength={30} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">URL</label>
                <input type="url" value={form.knop_url} onChange={e => update('knop_url', e.target.value)}
                  placeholder="https://..." className={INP} />
              </div>
            </div>
          </div>

          {/* ── Tracking pixels ── */}
          <div className="rounded-xl border border-[#1e1e1e] p-6 space-y-4" style={{ backgroundColor: '#141414' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Tracking pixels (optioneel)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Meta Pixel ID</label>
                <input value={form.meta_pixel_id} onChange={e => update('meta_pixel_id', e.target.value)}
                  placeholder="123456789" className={INP} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">TikTok Pixel ID</label>
                <input value={form.tiktok_pixel_id} onChange={e => update('tiktok_pixel_id', e.target.value)}
                  placeholder="ABCDE12345" className={INP} />
              </div>
            </div>
          </div>

          {/* ── Actie aanmaken ── */}
          <div className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
            <button type="button" onClick={() => setActieAanmaken(a => !a)}
              className="w-full flex items-center justify-between p-5 hover:bg-[#1a1a1a] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">⭐</span>
                <div className="text-left">
                  <p className="font-bold text-white text-sm">Actie toevoegen</p>
                  <p className="text-xs text-gray-600">Maak direct een deal of aanbieding bij dit event</p>
                </div>
              </div>
              <svg className={`transition-transform ${actieAanmaken ? 'rotate-180' : ''}`}
                width="16" height="16" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {actieAanmaken && (
              <div className="border-t border-[#1e1e1e] p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Naam actie *</label>
                  <input value={actieForm.titel} onChange={e => updActie('titel', e.target.value)}
                    placeholder="2 voor 1 op cocktails" className={INP} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Label (max 10 tekens)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {LABEL_SUGGESTIES.map(s => (
                      <button key={s} type="button"
                        onClick={() => updActie('label', s.slice(0, 10))}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${actieForm.label === s.slice(0,10) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <input value={actieForm.label} onChange={e => updActie('label', e.target.value.slice(0, 10))}
                    placeholder="Eigen label..." className={INP} maxLength={10} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Geldigheid</label>
                  <div className="flex gap-2">
                    {[['datums', 'Specifieke datums'], ['vaste_dagen', 'Vaste dagen']].map(([val, lab]) => (
                      <button key={val} type="button" onClick={() => updActie('geldigheid', val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${actieForm.geldigheid === val ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje'}`}>
                        {lab}
                      </button>
                    ))}
                  </div>
                </div>

                {actieForm.geldigheid === 'datums' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Geldig van</label>
                      <input type="date" value={actieForm.geldig_van} onChange={e => updActie('geldig_van', e.target.value)} className={INP} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Geldig tot</label>
                      <input type="date" value={actieForm.geldig_tot} onChange={e => updActie('geldig_tot', e.target.value)} className={INP} />
                    </div>
                  </div>
                )}

                {actieForm.geldigheid === 'vaste_dagen' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-2">Dag(en)</label>
                      <div className="flex gap-2 flex-wrap">
                        {DAGEN_LANG.map((dag, i) => (
                          <button key={i} type="button" onClick={() => toggleDag(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${actieForm.vaste_dagen.includes(i) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje'}`}>
                            {dag.slice(0, 2)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">
                        Duur: {actieForm.weken} {actieForm.weken === 1 ? 'week' : 'weken'}
                      </label>
                      <input type="range" min="1" max="8" value={actieForm.weken}
                        onChange={e => updActie('weken', parseInt(e.target.value))}
                        className="w-full accent-oranje" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Omschrijving actie</label>
                  <textarea value={actieForm.omschrijving} onChange={e => updActie('omschrijving', e.target.value)}
                    rows={2} placeholder="Extra details over de actie..."
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors resize-none" />
                </div>
              </div>
            )}
          </div>

          {fout && (
            <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">{fout}</div>
          )}

          <button type="submit" disabled={laden}
            className="w-full py-4 rounded-xl font-black uppercase text-black text-base transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            {laden ? 'Opslaan...' : 'Event indienen →'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
