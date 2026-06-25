'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

function BonScanner() {
  const [open, setOpen] = useState(false);
  const [fase, setFase] = useState('kies'); // kies | scannen | resultaat | verstuurd | fout
  const [preview, setPreview] = useState(null);
  const [bestand, setBestand] = useState(null);
  const [resultaat, setResultaat] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null); // { gevonden, naam }
  const [foutTekst, setFoutTekst] = useState('');
  const inputRef = useRef(null);

  function sluit() {
    setOpen(false);
    setFase('kies');
    setPreview(null);
    setBestand(null);
    setResultaat(null);
    setVenueInfo(null);
  }

  function handleBestand(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBestand(f);
    setPreview(URL.createObjectURL(f));
    // Direct scannen zodra foto gekozen is
    setFase('scannen');
    scannen(f);
    e.target.value = '';
  }

  async function scannen(f) {
    const fd = new FormData();
    fd.append('bon', f || bestand);
    try {
      const res = await fetch('/api/scan-bon', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error + (data.detail ? `\n(${data.detail})` : ''));
      setResultaat(data.scan);
      setVenueInfo({ gevonden: data.venue_gevonden, naam: data.venue_naam });
      setFase('resultaat');
    } catch (e) {
      setFoutTekst(e.message);
      setFase('fout');
    }
  }

  function verstuur() {
    // Al opgeslagen door API
    setFase('verstuurd');
  }

  function updDrank(i, key, val) {
    setResultaat(r => ({ ...r, dranken: r.dranken.map((d, j) => j === i ? { ...d, [key]: val } : d) }));
  }
  function verwijderDrank(i) {
    setResultaat(r => ({ ...r, dranken: r.dranken.filter((_, j) => j !== i) }));
  }
  function voegDrankToe() {
    setResultaat(r => ({ ...r, dranken: [...r.dranken, { naam: '', prijs: '' }] }));
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-oranje/40 text-oranje text-sm font-bold hover:bg-oranje/10 transition-colors flex-shrink-0 mt-1"
        style={{ backgroundColor: 'rgba(242,122,0,0.08)' }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Scan bon
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) sluit(); }}>
          <div className="w-full max-w-lg rounded-t-3xl border-t border-x border-[#2a2a2a]" style={{ backgroundColor: '#111', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>

            {/* Trekker */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#333]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="font-black uppercase text-base text-white" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {fase === 'kies' && '📷 Scan een bon'}
                {fase === 'scannen' && '🔍 AI analyseert...'}
                {fase === 'resultaat' && '✓ Gevonden informatie'}
                {fase === 'verstuurd' && '✓ Verstuurd!'}
                {fase === 'fout' && '❌ Er ging iets mis'}
              </p>
              <button onClick={sluit} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-[#222]">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-5 pb-6">

              {/* Stap: kies foto */}
              {fase === 'kies' && (
                <div>
                  <p className="text-gray-500 text-sm mb-5 text-center">Maak een foto van een bon of prijslijst — de AI leest drankprijzen en locatie automatisch uit.</p>
                  <label className="w-full py-4 rounded-2xl font-black uppercase text-base text-black flex items-center justify-center gap-2 cursor-pointer active:opacity-80"
                    style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Foto kiezen of maken
                    <input type="file" accept="image/*" onChange={handleBestand} className="hidden" />
                  </label>
                </div>
              )}

              {/* Stap: scannen */}
              {fase === 'scannen' && (
                <div className="text-center py-8">
                  {preview && <img src={preview} alt="bon" className="w-32 h-40 object-cover rounded-xl mx-auto mb-5 opacity-60 border border-[#2a2a2a]" />}
                  <div className="flex items-center justify-center gap-3 text-oranje mb-2">
                    <div className="w-5 h-5 border-2 border-oranje border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold text-sm">AI leest de bon...</span>
                  </div>
                  <p className="text-gray-600 text-xs">Bon is opgeslagen · prijzen worden uitgelezen</p>
                </div>
              )}

              {/* Stap: resultaat */}
              {fase === 'resultaat' && resultaat && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">

                  {/* Venue match status */}
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${venueInfo?.gevonden ? 'bg-green-950/30 border border-green-800/40' : 'bg-yellow-950/20 border border-yellow-800/30'}`}>
                    <span className="text-lg">{venueInfo?.gevonden ? '✓' : '⚠️'}</span>
                    <div>
                      {venueInfo?.gevonden
                        ? <p className="text-green-400 text-sm font-bold">Locatie gevonden: {venueInfo.naam}</p>
                        : <p className="text-yellow-400 text-sm font-bold">Locatie niet herkend in ons systeem</p>
                      }
                      <p className="text-gray-500 text-xs mt-0.5">
                        {venueInfo?.gevonden ? 'Prijzen worden direct gekoppeld' : 'Beheerder koppelt de locatie handmatig'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Locatie op de bon</label>
                    <input value={resultaat.locatie_naam || ''} onChange={e => setResultaat(r => ({ ...r, locatie_naam: e.target.value }))}
                      placeholder="Naam van het café / bar"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje" />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">
                      Gevonden dranken ({resultaat.dranken?.length || 0})
                    </label>
                    <div className="space-y-2">
                      {(resultaat.dranken || []).map((d, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <div className="flex-1 min-w-0">
                            <input value={d.naam} onChange={e => updDrank(i, 'naam', e.target.value)}
                              placeholder="Naam drank"
                              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje" />
                          </div>
                          <span className="text-xs text-gray-600 flex-shrink-0 hidden sm:block">{d.categorie}</span>
                          <div className="relative flex-shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                            <input type="number" step="0.01" value={d.prijs} onChange={e => updDrank(i, 'prijs', e.target.value)}
                              className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg pl-6 pr-2 py-2 text-white text-sm focus:outline-none focus:border-oranje" />
                          </div>
                          <button onClick={() => verwijderDrank(i)} className="text-gray-600 hover:text-red-400 flex-shrink-0">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={voegDrankToe} className="text-xs text-oranje hover:text-orange-400 mt-2 flex items-center gap-1">
                      + Drank toevoegen
                    </button>
                  </div>

                  <button onClick={verstuur}
                    className="w-full py-3.5 rounded-xl font-black uppercase text-sm text-black mt-2"
                    style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                    Verstuur naar beheerder →
                  </button>
                </div>
              )}

              {/* Stap: verstuurd */}
              {fase === 'verstuurd' && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <p className="text-white font-black text-lg uppercase mb-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Bedankt!</p>
                  <p className="text-gray-400 text-sm mb-5">De bon is verstuurd. De beheerder keurt de prijzen na en voegt ze toe aan de radar.</p>
                  <button onClick={sluit} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{ backgroundColor: '#F27A00' }}>
                    Sluiten
                  </button>
                </div>
              )}

              {/* Stap: fout */}
              {fase === 'fout' && (
                <div className="text-center py-6">
                  <p className="text-red-400 font-bold mb-2">Er ging iets mis</p>
                  <p className="text-gray-500 text-xs mb-4">{foutTekst}</p>
                  <button onClick={() => setFase('kies')} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{ backgroundColor: '#F27A00' }}>
                    Opnieuw proberen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const GoogleVenueMap = dynamic(() => import('@/components/GoogleVenueMap'), { ssr: false });

const alleDranken = ['Alle', 'Bier', 'Wijn', 'Mixdrank', 'Cocktail', 'Hard Seltzer', 'Shot', 'Frisdrank'];

const drankEmoji = {
  Alle: '🍺', Bier: '🍺', Wijn: '🍷', Mixdrank: '🍹',
  Cocktail: '🍸', 'Hard Seltzer': '🫧', Shot: '🥃', Frisdrank: '🥤',
};

function DrankIndicator({ filterDrank, venues }) {
  if (filterDrank === 'Alle') return null;
  const prijzen = venues.map(v => v.dranken.find(d => d.naam === filterDrank)?.prijs).filter(Boolean);
  if (prijzen.length === 0) return null;
  const min = Math.min(...prijzen);
  const max = Math.max(...prijzen);
  const avg = prijzen.reduce((a, b) => a + b, 0) / prijzen.length;
  const kleur = avg <= (min + (max - min) * 0.33) ? '#22c55e' : avg >= (min + (max - min) * 0.66) ? '#ef4444' : '#F27A00';
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{ borderColor: kleur + '40', backgroundColor: kleur + '10' }}>
      <span className="text-3xl">{drankEmoji[filterDrank]}</span>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">Gemiddelde prijs {filterDrank}</p>
        <p className="font-black text-xl" style={{ color: kleur, fontFamily: "'Big Shoulders Display', sans-serif" }}>
          €{avg.toFixed(2).replace('.', ',')}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
        <span className="text-green-400">€{min.toFixed(2).replace('.', ',')}</span>
        <span>–</span>
        <span className="text-red-400">€{max.toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
  );
}

export default function PrijzenPage() {
  const [venues, setVenues]         = useState([]);
  const [laden, setLaden]           = useState(true);
  const [filterDrank, setFilterDrank] = useState('Alle');
  const [filterType, setFilterType]   = useState('Alle');
  const [sorteer, setSorteer]         = useState('prijs-asc');

  useEffect(() => {
    async function laad() {
      const [venRes, prijsRes] = await Promise.all([
        supabase.from('venues').select('*').eq('actief', true),
        supabase.from('bierprijzen').select('*'),
      ]);
      const venueData = venRes.data || [];
      const prijsData = prijsRes.data || [];

      // Groepeer prijzen per venue
      const venuesMetPrijzen = venueData
        .map(v => {
          const dranken = prijsData
            .filter(p => p.venue_id === v.id || p.venue_naam === v.naam)
            .map(p => ({ naam: p.drankje, prijs: parseFloat(p.prijs) }));
          return {
            ...v,
            venue: v.naam,
            slug: v.naam.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
            dranken,
          };
        })
      setVenues(venuesMetPrijzen);
      setLaden(false);
    }
    laad();
  }, []);

  const alleTypes = useMemo(() => ['Alle', ...new Set(venues.map(v => v.type))], [venues]);

  const goedkoopste = useMemo(() => Object.fromEntries(
    alleDranken.filter(d => d !== 'Alle').map(d => {
      const prijzen = venues.map(v => v.dranken.find(dr => dr.naam === d)?.prijs).filter(Boolean);
      return [d, Math.min(...prijzen, Infinity)];
    })
  ), [venues]);

  const gefilterdVenues = useMemo(() => {
    let vs = venues.filter(v => filterType === 'Alle' || v.type === filterType);
    vs = [...vs].sort((a, b) => {
      if (sorteer === 'az') return a.naam.localeCompare(b.naam);
      const getPrijs = (v) => {
        if (filterDrank !== 'Alle') return v.dranken.find(d => d.naam === filterDrank)?.prijs ?? Infinity;
        const prijzen = v.dranken.map(d => d.prijs);
        return prijzen.length ? prijzen.reduce((s, p) => s + p, 0) / prijzen.length : Infinity;
      };
      const pa = getPrijs(a), pb = getPrijs(b);
      return sorteer === 'prijs-desc' ? pb - pa : pa - pb;
    });
    return vs;
  }, [venues, filterDrank, filterType, sorteer]);

  const getoondDranken = alleDranken.filter(d => d !== 'Alle' && (filterDrank === 'Alle' || d === filterDrank));

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
              <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>PRIJZEN RADAR</h1>
              <p className="text-gray-500 text-sm mt-1">{laden ? 'Laden...' : `${venues.length} locaties`}</p>
            </div>
            <BonScanner />
          </div>
        </div>
      </section>

      <div className="px-4 py-3 border-b border-[#1a1a1a]" style={{ backgroundColor: '#0a0500' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Goedkoop</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-oranje inline-block" />Gemiddeld</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Duur</span>
          </div>
          <a href="/organisatoren" className="text-oranje text-sm font-bold hover:underline">Prijs wijzigen? Meld het ons →</a>
        </div>
      </div>

      <section className="px-4 py-8 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-500 text-xs mb-3">Klik op een pin voor de drankprijzen van die venue</p>
          <GoogleVenueMap
            locaties={venues}
            bierprijzen={venues}
            mode="prijzen"
            hoogte="320px"
            drankFilter={filterDrank !== 'Alle' ? filterDrank : null}
          />
        </div>
      </section>

      <section className="bg-black border-b border-[#1a1a1a] px-4 py-3">
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-gray-600 text-xs uppercase tracking-wide mr-1">Drankje:</span>
            {alleDranken.map(d => (
              <button key={d} onClick={() => setFilterDrank(d)}
                className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border transition-colors ${filterDrank === d ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje'}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-gray-600 text-xs uppercase tracking-wide mr-1">Type:</span>
            {alleTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`text-xs font-semibold uppercase px-3 py-1.5 rounded-full border transition-colors ${filterType === t ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 text-xs uppercase tracking-wide mr-1">Sortering:</span>
            {[
              { key: 'prijs-asc',  label: '↑ Goedkoopst eerst' },
              { key: 'prijs-desc', label: '↓ Duurste eerst' },
              { key: 'az',         label: 'A–Z' },
            ].map(o => (
              <button key={o.key} onClick={() => setSorteer(o.key)}
                className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border transition-colors ${sorteer === o.key ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje'}`}>
                {o.label}
              </button>
            ))}
            {filterDrank !== 'Alle' && <DrankIndicator filterDrank={filterDrank} venues={gefilterdVenues} />}
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {laden ? (
            <div className="text-center py-20 text-gray-600">Laden...</div>
          ) : gefilterdVenues.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <p className="text-2xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Geen venues gevonden</p>
              <p className="text-sm mt-2">Voeg drankprijzen toe via het admin paneel</p>
            </div>
          ) : (
            <>
              {/* Desktop tabel */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      <th className="text-left py-4 pr-6 text-gray-500 font-semibold uppercase text-xs tracking-widest">Venue</th>
                      <th className="text-left py-4 pr-4 text-gray-500 font-semibold uppercase text-xs tracking-widest">Type</th>
                      {getoondDranken.map(d => (
                        <th key={d} className="text-center py-4 px-4 text-gray-500 font-semibold uppercase text-xs tracking-widest">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gefilterdVenues.map((venue, idx) => (
                      <tr key={venue.id} className="border-b border-[#141414] hover:bg-[#0d0d0d] transition-colors">
                        <td className="py-5 pr-6">
                          <div className="flex items-center gap-3">
                            {/* Logo */}
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center flex-shrink-0">
                              {venue.logo_url ? (
                                <img src={venue.logo_url} alt={venue.naam} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-gray-600" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                                  {(venue.naam || '?').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              {filterDrank !== 'Alle' && idx === 0 && (
                                <span className="text-[10px] bg-green-400/10 text-green-400 border border-green-400/30 px-1.5 py-0.5 rounded-full font-bold block mb-0.5">
                                  🏆 Goedkoopst
                                </span>
                              )}
                              <a href={`/locaties/${venue.slug}`} className="font-black uppercase text-xl hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                                {venue.naam}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                          <span className="text-xs text-gray-500 uppercase">{venue.type}</span>
                        </td>
                        {getoondDranken.map(d => {
                          const item = venue.dranken.find(dr => dr.naam === d);
                          const isGoedkoopst = item && item.prijs === goedkoopste[d];
                          return (
                            <td key={d} className="py-5 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-base font-bold ${isGoedkoopst ? 'text-green-400' : item ? 'text-white' : 'text-gray-700'}`}>
                                  {item ? `€${item.prijs.toFixed(2).replace('.', ',')}` : '✕'}
                                </span>
                                {isGoedkoopst && (
                                  <span className="text-[10px] bg-green-400/10 text-green-400 border border-green-400/30 px-1.5 py-0.5 rounded-full font-bold">✓ Goedkoopst</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobiele cards */}
              <div className="md:hidden space-y-4">
                {gefilterdVenues.map((venue, idx) => (
                  <div key={venue.id} className={`bg-[#141414] rounded-xl border overflow-hidden ${filterDrank !== 'Alle' && idx === 0 ? 'border-green-500/40' : 'border-[#252525]'}`}>
                    <a href={`/locaties/${venue.slug}`}
                      className="flex items-center gap-3 px-5 py-4 border-b border-[#252525] hover:bg-[#1a1a1a] transition-colors">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center flex-shrink-0">
                        {venue.logo_url ? (
                          <img src={venue.logo_url} alt={venue.naam} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-gray-600" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                            {(venue.naam || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        {filterDrank !== 'Alle' && idx === 0 && (
                          <span className="text-[10px] bg-green-400/10 text-green-400 border border-green-400/30 px-1.5 py-0.5 rounded-full font-bold block mb-1">🏆 Goedkoopst</span>
                        )}
                        <p className="font-black uppercase text-xl" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{venue.naam}</p>
                        <p className="text-gray-600 text-xs uppercase">{venue.type}</p>
                      </div>
                      <svg width="16" height="16" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                    </a>
                    <div className="px-5 py-3 space-y-2">
                      {(() => {
                        const zichtbaar = filterDrank === 'Alle'
                          ? alleDranken.filter(d => d !== 'Alle')
                          : [filterDrank];
                        return zichtbaar.map(drankNaam => {
                          const d = venue.dranken.find(dr => dr.naam === drankNaam);
                          const isGoedkoopst = d && d.prijs === goedkoopste[drankNaam];
                          return (
                            <div key={drankNaam} className="flex items-center justify-between py-1.5 border-b border-[#1e1e1e]">
                              <span className="text-gray-400 text-sm">{drankNaam}</span>
                              <div className="flex items-center gap-2">
                                {isGoedkoopst && <span className="text-[10px] bg-green-400/10 text-green-400 border border-green-400/30 px-1.5 py-0.5 rounded-full font-bold">✓ Goedkoopst</span>}
                                <span className={`font-bold text-sm ${isGoedkoopst ? 'text-green-400' : d ? 'text-white' : 'text-gray-700'}`}>
                                  {d ? `€${d.prijs.toFixed(2).replace('.', ',')}` : '✕'}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
