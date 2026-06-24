'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

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
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
          <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>PRIJZEN RADAR</h1>
          <p className="text-gray-500 text-sm mt-1">{laden ? 'Laden...' : `${venues.length} locaties`}</p>
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

      <section className="sticky z-40 bg-black border-b border-[#1a1a1a] px-4 py-3" style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}>
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
