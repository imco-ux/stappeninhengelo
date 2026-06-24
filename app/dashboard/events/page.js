'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardShell from '@/components/DashboardShell';
import { supabase } from '@/lib/supabase';

const PlacesInput = dynamic(() => import('@/components/PlacesInput'), { ssr: false });

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const EVENT_TYPES = ['Feestje','Club Night','Live Muziek','Karaoke','Quiz','Comedy','Sportavond','Festival','Borrel','Overig'];
const LABEL_SUGGESTIES = ['50% KORT', '1+1', 'GRATIS', '2e GRATIS', 'HAPPY HOUR', 'DEAL', 'NIEUW', 'ACTIE'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

function formatDatum(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

function leegEdit(ev) {
  return {
    title: ev.title || '',
    type: ev.type || 'Feestje',
    datum: ev.datum ? ev.datum.split('T')[0] : '',
    tijd: ev.tijd || '',
    adres: ev.adres || '',
    prijs: ev.prijs || '',
    leeftijd: ev.leeftijd || '18+',
    omschrijving: ev.omschrijving || '',
    poster_url: ev.poster_url || '',
    venue_naam: ev.venue_naam || '',
    knop_label: ev.knop_label || '',
    knop_url: ev.knop_url || '',
    meta_pixel_id: ev.meta_pixel_id || '',
    tiktok_pixel_id: ev.tiktok_pixel_id || '',
  };
}

export default function EventsPage() {
  const [events, setEvents]     = useState([]);
  const [laden, setLaden]       = useState(true);
  const [bewerkId, setBewerkId] = useState(null);
  const [form, setForm]         = useState({});
  const [bezig, setBezig]       = useState(false);
  const [melding, setMelding]   = useState('');
  const [posterBezig, setPosterBezig] = useState(false);
  const [mijnVenues, setMijnVenues] = useState([]);
  const [actieAanmaken, setActieAanmaken] = useState(false);
  const [actieForm, setActieForm] = useState({
    titel: '', omschrijving: '', label: '',
    geldigheid: 'datums', geldig_van: '', geldig_tot: '',
    vaste_dagen: [], weken: 4,
  });

  useEffect(() => { laad(); }, []);

  async function laad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [evRes, venRes] = await Promise.all([
      supabase.from('events').select('*').eq('eigenaar_id', user.id).order('datum', { ascending: true }),
      supabase.from('venues').select('id, naam, adres, lat, lng').eq('eigenaar_id', user.id).order('naam'),
    ]);
    setEvents(evRes.data || []);
    setMijnVenues(venRes.data || []);
    setLaden(false);
  }

  function startBewerk(ev) {
    setBewerkId(ev.id);
    setForm(leegEdit(ev));
  }

  function annuleer() {
    setBewerkId(null);
    setForm({});
    setActieAanmaken(false);
    setActieForm({ titel: '', omschrijving: '', label: '', geldigheid: 'datums', geldig_van: '', geldig_tot: '', vaste_dagen: [], weken: 4 });
  }

  function upd(veld, val) { setForm(f => ({ ...f, [veld]: val })); }
  function updActie(veld, val) { setActieForm(f => ({ ...f, [veld]: val })); }
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
    const naam = `poster-${bewerkId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posters').upload(naam, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('posters').getPublicUrl(naam);
      upd('poster_url', data.publicUrl);
    }
    setPosterBezig(false);
  }

  async function opslaan(e) {
    e.preventDefault();
    if (!bewerkId) return;
    setBezig(true);

    const gekozenVenue = mijnVenues.find(v => v.adres === form.adres);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('events').update({
      title: form.title,
      type: form.type,
      datum: form.datum || null,
      tijd: form.tijd,
      adres: form.adres,
      prijs: form.prijs,
      leeftijd: form.leeftijd,
      omschrijving: form.omschrijving,
      poster_url: form.poster_url || null,
      venue_naam: gekozenVenue?.naam || form.venue_naam || null,
      knop_label: form.knop_label || null,
      knop_url: form.knop_url || null,
      meta_pixel_id: form.meta_pixel_id || null,
      tiktok_pixel_id: form.tiktok_pixel_id || null,
    }).eq('id', bewerkId);

    if (!error) {
      // Sla actie op indien ingevuld
      if (actieAanmaken && actieForm.titel && user) {
        let geldig_tot = null;
        let vaste_dagen = null;
        if (actieForm.geldigheid === 'datums') {
          geldig_tot = actieForm.geldig_tot || null;
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
          event_id: bewerkId,
          eigenaar_id: user.id,
          geldig_van: actieForm.geldigheid === 'datums' ? (actieForm.geldig_van || null) : null,
          geldig_tot,
          vaste_dagen,
          onbepaalde_tijd: false,
          hot: false,
          gepubliceerd: true,
        });
      }

      setEvents(evs => evs.map(ev => ev.id === bewerkId ? { ...ev, ...form } : ev));
      setMelding('Opgeslagen ✓');
      setTimeout(() => { setMelding(''); setBewerkId(null); setActieAanmaken(false); }, 2000);
    } else {
      setMelding('Fout: ' + error.message);
    }
    setBezig(false);
  }

  const INP = 'w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje';

  return (
    <DashboardShell>
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Mijn Events
            </h1>
            <p className="text-gray-500 text-sm mt-1">Events die je hebt ingediend ter publicatie.</p>
          </div>
          <a href="/dashboard/events/nieuw"
            className="px-5 py-2.5 rounded-lg font-black uppercase text-sm text-black flex items-center gap-2"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            + Nieuw event
          </a>
        </div>

        {melding && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${melding.includes('Fout') ? 'bg-red-950/30 border border-red-800/40 text-red-400' : 'bg-green-950/30 border border-green-800/40 text-green-400'}`}>
            {melding}
          </div>
        )}

        {laden ? (
          <div className="text-gray-600 text-sm text-center py-20">Laden...</div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] p-16 text-center" style={{ backgroundColor: '#141414' }}>
            <p className="text-gray-500 text-sm mb-4">Je hebt nog geen events ingediend.</p>
            <a href="/dashboard/events/nieuw"
              className="inline-block px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Eerste event aanmaken →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                {/* Event regel */}
                <div className="p-5 flex items-center gap-4">
                  {ev.poster_url ? (
                    <img src={ev.poster_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {ev.datum ? MAANDEN[new Date(ev.datum).getMonth()] : '–'}
                      </span>
                      <span className="text-xl font-black text-white leading-none">
                        {ev.datum ? new Date(ev.datum).getDate() : '–'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ev.type} · {ev.tijd} · {ev.prijs}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ev.goedgekeurd ? 'bg-green-950/50 text-green-400' : 'bg-yellow-950/50 text-yellow-500'}`}>
                      {ev.goedgekeurd ? 'Gepubliceerd' : 'In behandeling'}
                    </span>
                    <button
                      onClick={() => bewerkId === ev.id ? annuleer() : startBewerk(ev)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                      style={{
                        borderColor: bewerkId === ev.id ? '#555' : '#2a2a2a',
                        color: bewerkId === ev.id ? '#aaa' : '#666',
                      }}>
                      {bewerkId === ev.id ? 'Annuleer' : 'Bewerken'}
                    </button>
                  </div>
                </div>

                {/* Inline bewerkformulier */}
                {bewerkId === ev.id && (
                  <form onSubmit={opslaan} className="border-t border-[#1e1e1e] p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Naam event *</label>
                        <input value={form.title} onChange={e => upd('title', e.target.value)} required className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Type</label>
                        <select value={form.type} onChange={e => upd('type', e.target.value)} className={INP}>
                          {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Leeftijd</label>
                        <input value={form.leeftijd} onChange={e => upd('leeftijd', e.target.value)}
                          placeholder="18+ / Iedereen" className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Datum</label>
                        <input type="date" value={form.datum} onChange={e => upd('datum', e.target.value)} className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Tijd</label>
                        <input type="time" value={form.tijd} onChange={e => upd('tijd', e.target.value)} className={INP} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Locatie</label>
                        {mijnVenues.length > 0 ? (
                          <>
                            <select
                              value={mijnVenues.find(v => v.adres === form.adres)?.id || ''}
                              onChange={e => {
                                const v = mijnVenues.find(v => v.id === e.target.value);
                                if (v) setForm(f => ({ ...f, adres: v.adres || '', lat: v.lat, lng: v.lng }));
                              }}
                              className={INP}>
                              <option value="">— Kies locatie —</option>
                              {mijnVenues.map(v => (
                                <option key={v.id} value={v.id}>{v.naam}{v.adres ? ` — ${v.adres}` : ''}</option>
                              ))}
                            </select>
                            {form.adres && <p className="text-xs text-gray-600 mt-1">📍 {form.adres}</p>}
                          </>
                        ) : (
                          <PlacesInput
                            value={form.adres}
                            onChange={v => upd('adres', v)}
                            onPlace={({ adres, lat, lng }) => setForm(f => ({ ...f, adres, lat, lng }))}
                            placeholder="Zoek adres op Google Maps..."
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Prijs</label>
                        <input value={form.prijs} onChange={e => upd('prijs', e.target.value)}
                          placeholder="Gratis / €5" className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Poster</label>
                        <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#1e1e1e] text-xs text-gray-500 cursor-pointer hover:border-oranje transition-colors">
                          {posterBezig ? (
                            <div className="w-3.5 h-3.5 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                          )}
                          {form.poster_url ? 'Verander poster' : 'Poster uploaden'}
                          <input type="file" accept="image/*" onChange={uploadPoster} className="hidden" disabled={posterBezig} />
                        </label>
                        {form.poster_url && (
                          <img src={form.poster_url} alt="" className="mt-2 h-16 rounded-lg object-cover" />
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Omschrijving</label>
                        <textarea value={form.omschrijving} onChange={e => upd('omschrijving', e.target.value)}
                          rows={3} className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Knoptekst</label>
                        <input value={form.knop_label} onChange={e => upd('knop_label', e.target.value)}
                          placeholder="Bestel tickets" maxLength={30} className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Knop URL</label>
                        <input type="url" value={form.knop_url} onChange={e => upd('knop_url', e.target.value)}
                          placeholder="https://..." className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Meta Pixel ID</label>
                        <input value={form.meta_pixel_id} onChange={e => upd('meta_pixel_id', e.target.value)}
                          placeholder="123456789" className={INP} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">TikTok Pixel ID</label>
                        <input value={form.tiktok_pixel_id} onChange={e => upd('tiktok_pixel_id', e.target.value)}
                          placeholder="ABCDE12345" className={INP} />
                      </div>
                    </div>

                    {/* Actie aanmaken */}
                    <div className="rounded-xl border border-[#1e1e1e] overflow-hidden mt-2">
                      <button type="button" onClick={() => setActieAanmaken(a => !a)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors">
                        <div className="flex items-center gap-2">
                          <span>⭐</span>
                          <span className="text-sm font-bold text-white">Actie toevoegen bij dit event</span>
                        </div>
                        <svg className={`transition-transform ${actieAanmaken ? 'rotate-180' : ''}`}
                          width="14" height="14" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </button>

                      {actieAanmaken && (
                        <div className="border-t border-[#1e1e1e] p-4 space-y-3">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Naam actie *</label>
                            <input value={actieForm.titel} onChange={e => updActie('titel', e.target.value)}
                              placeholder="2 voor 1 op cocktails" className={INP} />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Label (max 10 tekens)</label>
                            <div className="flex gap-1.5 flex-wrap mb-1.5">
                              {LABEL_SUGGESTIES.map(s => (
                                <button key={s} type="button" onClick={() => updActie('label', s.slice(0,10))}
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-colors ${actieForm.label === s.slice(0,10) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                            <input value={actieForm.label} onChange={e => updActie('label', e.target.value.slice(0,10))}
                              placeholder="Eigen label..." maxLength={10} className={INP} />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Geldigheid</label>
                            <div className="flex gap-2">
                              {[['datums','Specifieke datums'],['vaste_dagen','Vaste dagen']].map(([val,lab]) => (
                                <button key={val} type="button" onClick={() => updActie('geldigheid', val)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${actieForm.geldigheid === val ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje'}`}>
                                  {lab}
                                </button>
                              ))}
                            </div>
                          </div>
                          {actieForm.geldigheid === 'datums' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Geldig van</label>
                                <input type="date" value={actieForm.geldig_van} onChange={e => updActie('geldig_van', e.target.value)} className={INP} />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">Geldig tot</label>
                                <input type="date" value={actieForm.geldig_tot} onChange={e => updActie('geldig_tot', e.target.value)} className={INP} />
                              </div>
                            </div>
                          )}
                          {actieForm.geldigheid === 'vaste_dagen' && (
                            <div className="space-y-3">
                              <div className="flex gap-1.5 flex-wrap">
                                {DAGEN_LANG.map((dag, i) => (
                                  <button key={i} type="button" onClick={() => toggleDag(i)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${actieForm.vaste_dagen.includes(i) ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje'}`}>
                                    {dag.slice(0,2)}
                                  </button>
                                ))}
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-gray-600 block mb-1">
                                  Duur: {actieForm.weken} {actieForm.weken === 1 ? 'week' : 'weken'}
                                </label>
                                <input type="range" min="1" max="8" value={actieForm.weken}
                                  onChange={e => updActie('weken', parseInt(e.target.value))}
                                  className="w-full accent-oranje" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={bezig}
                        className="px-5 py-2 rounded-lg font-black uppercase text-sm text-black disabled:opacity-50"
                        style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                        {bezig ? 'Opslaan...' : 'Opslaan →'}
                      </button>
                      <button type="button" onClick={annuleer}
                        className="px-5 py-2 rounded-lg text-sm text-gray-500 border border-[#2a2a2a] hover:text-white transition-colors">
                        Annuleer
                      </button>
                      <p className="text-xs text-gray-600 self-center ml-auto">
                        {ev.goedgekeurd ? 'Wijzigingen worden direct gepubliceerd.' : 'Event wacht nog op goedkeuring.'}
                      </p>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
