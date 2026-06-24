'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { supabase } from '@/lib/supabase';

const DRANKEN = [
  { naam: 'Bier',        emoji: '🍺' },
  { naam: 'Wijn',        emoji: '🍷' },
  { naam: 'Mixdrank',    emoji: '🍹' },
  { naam: 'Cocktail',    emoji: '🍸', sub: 'Pornstar Martini' },
  { naam: 'Hard Seltzer',emoji: '🫧' },
  { naam: 'Shot',        emoji: '🥃' },
  { naam: 'Frisdrank',   emoji: '🥤' },
];

const leegPrijzen = () => Object.fromEntries(DRANKEN.map(d => [d.naam, '']));

export default function PrijzenDashboardPage() {
  const [venues, setVenues]       = useState([]);
  const [actief, setActief]       = useState(null);   // geselecteerde venue
  const [prijzen, setPrijzen]     = useState(leegPrijzen());
  const [origineel, setOrigineel] = useState({});
  const [laden, setLaden]         = useState(true);
  const [opslaan, setOpslaan]     = useState(false);
  const [succes, setSucces]       = useState(false);
  const [fout, setFout]           = useState('');
  const [syncBezig, setSyncBezig] = useState(false);
  const [syncResultaat, setSyncResultaat] = useState(null);

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: venueData } = await supabase
        .from('venues').select('id,naam').eq('eigenaar_id', user.id).order('naam');

      const lijst = venueData || [];
      setVenues(lijst);
      if (lijst.length > 0) await laadPrijzenVoorVenue(lijst[0]);
      setLaden(false);
    }
    laad();
  }, []);

  async function laadPrijzenVoorVenue(v) {
    setActief(v);
    setPrijzen(leegPrijzen());
    setOrigineel({});

    const [r1, r2] = await Promise.all([
      supabase.from('bierprijzen').select('*').eq('venue_id', v.id),
      supabase.from('bierprijzen').select('*').eq('venue_naam', v.naam),
    ]);

    const alle = [...(r1.data||[]), ...(r2.data||[])];
    const uniek = alle.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

    const map = {};
    uniek.forEach(r => { map[r.drankje] = String(r.prijs); });
    setPrijzen(prev => ({ ...prev, ...map }));
    setOrigineel(map);
  }

  async function syncPrijzen() {
    if (!actief) return;
    setSyncBezig(true);
    setSyncResultaat(null);
    setFout('');

    // Haal website + reviews op voor dit venue
    const { data: venueData } = await supabase
      .from('venues').select('website, google_reviews').eq('id', actief.id).single();

    const res = await fetch('/api/sync-prijzen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        naam: actief.naam,
        website: venueData?.website || null,
        googleReviews: venueData?.google_reviews || [],
      }),
    });

    const data = await res.json();
    setSyncBezig(false);

    if (!res.ok || !data.prijzen) {
      setFout('Ophalen mislukt. Probeer het later opnieuw.');
      return;
    }

    if (data.aantalGevonden === 0) {
      setSyncResultaat({ bericht: 'Geen prijzen gevonden op de website of in reviews.', bronnen: [] });
      return;
    }

    // Vul gevonden prijzen in het formulier in (overschrijf alleen lege velden)
    setPrijzen(prev => {
      const nieuw = { ...prev };
      for (const [drankje, prijs] of Object.entries(data.prijzen)) {
        if (DRANKEN.find(d => d.naam === drankje)) {
          nieuw[drankje] = String(prijs);
        }
      }
      return nieuw;
    });

    setSyncResultaat({
      bericht: `${data.aantalGevonden} prijs${data.aantalGevonden !== 1 ? 'en' : ''} gevonden`,
      bronnen: data.bronnen,
      prijzen: data.prijzen,
    });
  }

  async function handleOpslaan(e) {
    e.preventDefault();
    if (!actief) return;
    setFout('');
    setOpslaan(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFout('Niet ingelogd.'); setOpslaan(false); return; }

    const rijen = DRANKEN
      .filter(d => prijzen[d.naam] !== '')
      .map(d => ({
        eigenaar_id: user.id,
        venue_id:    actief.id,
        venue_naam:  actief.naam,
        drankje:     d.naam,
        prijs:       parseFloat(prijzen[d.naam]),
        updated_at:  new Date().toISOString(),
      }));

    // Verwijder records van deze zaak + legacy records zonder venue_id (veroorzaken constraint conflict)
    await Promise.all([
      supabase.from('bierprijzen').delete().eq('venue_id', actief.id),
      supabase.from('bierprijzen').delete().eq('venue_naam', actief.naam),
      supabase.from('bierprijzen').delete().eq('eigenaar_id', user.id).is('venue_id', null),
    ]);

    if (rijen.length > 0) {
      const { error } = await supabase.from('bierprijzen').insert(rijen);
      if (error) { setFout('Opslaan mislukt: ' + error.message); setOpslaan(false); return; }
    }

    setOrigineel(Object.fromEntries(DRANKEN.filter(d => prijzen[d.naam] !== '').map(d => [d.naam, prijzen[d.naam]])));
    setSucces(true);
    setTimeout(() => setSucces(false), 3000);
    setOpslaan(false);
  }

  return (
    <DashboardShell>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Drankprijzen
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Deze prijzen verschijnen op de Prijzen Radar van Stappen In Hengelo.
          </p>
        </div>

        {/* Venue tabs */}
        {venues.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {venues.map(v => (
              <button key={v.id} onClick={() => laadPrijzenVoorVenue(v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  actief?.id === v.id
                    ? 'bg-oranje border-oranje text-black'
                    : 'border-[#333] text-gray-400 hover:border-oranje hover:text-white'
                }`}>
                {v.naam}
              </button>
            ))}
          </div>
        )}

        {/* Sync knop */}
        {actief && (
          <div className="mb-4 flex flex-col gap-2">
            <button type="button" onClick={syncPrijzen} disabled={syncBezig}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-bold text-gray-300 hover:border-oranje hover:text-oranje transition-colors disabled:opacity-50 self-start">
              {syncBezig
                ? <><div className="w-4 h-4 border-2 border-oranje border-t-transparent rounded-full animate-spin" />Bezig met zoeken...</>
                : <><span className="text-base">🔍</span> Prijzen automatisch ophalen</>}
            </button>
            {syncResultaat && (
              <div className={`text-xs px-3 py-2 rounded-lg border ${syncResultaat.bronnen?.length ? 'border-green-500/30 bg-green-500/5 text-green-400' : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'}`}>
                {syncResultaat.bericht}
                {syncResultaat.bronnen?.length > 0 && <span className="text-gray-500 ml-1">— via {syncResultaat.bronnen.join(', ')}</span>}
                {syncResultaat.bronnen?.length > 0 && <span className="ml-2 text-gray-500">Controleer de prijzen en sla op.</span>}
              </div>
            )}
            {fout && !opslaan && <p className="text-xs text-red-400">{fout}</p>}
          </div>
        )}

        {laden ? (
          <div className="py-20 text-center text-gray-600 text-sm">Laden...</div>
        ) : venues.length === 0 ? (
          <div className="rounded-xl border border-[#1e1e1e] p-12 text-center" style={{ backgroundColor: '#141414' }}>
            <p className="text-gray-500 text-sm">Je hebt nog geen locatie aangemeld.</p>
          </div>
        ) : (
          <form onSubmit={handleOpslaan}>
            <div className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
              <div className="px-6 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600">
                  Prijs per drankje — {actief?.naam}
                </p>
                <span className="text-xs text-gray-600">in €</span>
              </div>

              <div className="divide-y divide-[#1e1e1e]">
                {DRANKEN.map(({ naam, emoji, sub }) => {
                  const gewijzigd = prijzen[naam] !== (origineel[naam] || '');
                  return (
                    <div key={naam} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <p className="font-semibold text-white text-sm">{naam}</p>
                          {sub && <p className="text-xs text-gray-600">{sub}</p>}
                          {gewijzigd && <p className="text-xs text-oranje">Gewijzigd</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm">€</span>
                        <input
                          type="number" min="0" step="0.10"
                          value={prijzen[naam]}
                          onChange={e => setPrijzen(p => ({ ...p, [naam]: e.target.value }))}
                          placeholder="0.00"
                          className="w-24 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-oranje transition-colors"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {fout && (
              <div className="mt-4 bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">{fout}</div>
            )}
            {succes && (
              <div className="mt-4 bg-green-950/30 border border-green-800/40 rounded-lg px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                Prijzen opgeslagen voor {actief?.naam}!
              </div>
            )}

            <button type="submit" disabled={opslaan}
              className="mt-6 w-full py-4 rounded-xl font-black uppercase text-black text-base transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {opslaan ? 'Opslaan...' : `Prijzen opslaan →`}
            </button>
          </form>
        )}

        <p className="text-center text-gray-700 text-xs mt-4">
          Laat een veld leeg als je dat drankje niet serveert.
        </p>
      </div>
    </DashboardShell>
  );
}
