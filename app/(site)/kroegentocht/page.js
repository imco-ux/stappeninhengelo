'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockLocaties, kroegOpdrachtPool } from '@/lib/mockData';

const typeKleur = {
  Feestcafé:   'border-oranje text-oranje',
  Club:         'border-purple-500 text-purple-400',
  Karaoke:      'border-pink-500 text-pink-400',
  Café:         'border-blue-500 text-blue-400',
  'Terras/Bar': 'border-green-500 text-green-400',
};

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Fases: 'selectie' | 'namen' | 'actief'
export default function KroegentochtPage() {
  const [fase, setFase] = useState('selectie');
  const [route, setRoute] = useState([]);
  const [deelnemers, setDeelnemers] = useState([{ naam: '', drinkt: true }]);

  // Actieve kroegentocht state
  const [kroegIndex, setKroegIndex] = useState(0);
  const [opdrachten, setOpdrachten] = useState([]);
  const [huidigeOpdracht, setHuidigeOpdracht] = useState(null);
  const [afgerond, setAfgerond] = useState(false);

  function toggleLocatie(loc) {
    if (route.find((r) => r._id === loc._id)) {
      setRoute(route.filter((r) => r._id !== loc._id));
    } else if (route.length < 5) {
      setRoute([...route, loc]);
    }
  }

  function randomRoute() {
    const n = Math.floor(Math.random() * 2) + 3; // 3–4 locaties
    setRoute(shuffle(mockLocaties).slice(0, n));
  }

  function voegDeelnemerToe() {
    if (deelnemers.length < 12) setDeelnemers([...deelnemers, { naam: '', drinkt: true }]);
  }

  function updateDeelnemer(i, veld, waarde) {
    const nieuw = [...deelnemers];
    nieuw[i] = { ...nieuw[i], [veld]: waarde };
    setDeelnemers(nieuw);
  }

  function verwijderDeelnemer(i) {
    if (deelnemers.length > 1) setDeelnemers(deelnemers.filter((_, idx) => idx !== i));
  }

  function startKroegentocht() {
    // Maak een set opdrachten per kroeg
    const pool = shuffle(kroegOpdrachtPool);
    const perKroeg = route.map((_, i) => pool[i % pool.length]);
    setOpdrachten(perKroeg);
    setKroegIndex(0);
    setHuidigeOpdracht(perKroeg[0]);
    setAfgerond(false);
    setFase('actief');
  }

  function nieuweOpdracht() {
    const beschikbaar = kroegOpdrachtPool.filter((o) => o !== huidigeOpdracht);
    setHuidigeOpdracht(shuffle(beschikbaar)[0]);
  }

  function volgendeKroeg() {
    const nieuwIndex = kroegIndex + 1;
    if (nieuwIndex >= route.length) {
      setAfgerond(true);
    } else {
      setKroegIndex(nieuwIndex);
      setHuidigeOpdracht(opdrachten[nieuwIndex]);
    }
  }

  function mapsUrl() {
    const adressen = route.map((r) => encodeURIComponent(r.adres)).join('/');
    return `https://maps.google.com/maps?q=${adressen}`;
  }

  // ── Selectie fase ─────────────────────────────────────────────────
  if (fase === 'selectie') {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
          <div className="max-w-6xl mx-auto">
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
            <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              KROEGENTOCHT
            </h1>
            <p className="text-gray-500 text-sm mt-1">Kies je route of ga op random</p>
          </div>
        </section>

        <section className="px-4 py-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Locatie kiezer */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
                  KIES LOCATIES
                </h2>
                <button
                  onClick={randomRoute}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-oranje/50 text-oranje text-sm font-bold uppercase hover:bg-oranje/10 transition-colors"
                >
                  🎲 Random
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockLocaties.map((loc) => {
                  const geselecteerd = !!route.find((r) => r._id === loc._id);
                  const vol = !geselecteerd && route.length >= 5;
                  const tc = typeKleur[loc.type] || 'border-gray-500 text-gray-400';
                  return (
                    <button key={loc._id} onClick={() => toggleLocatie(loc)} disabled={vol}
                      className={`text-left rounded-xl border p-4 transition-all ${geselecteerd ? 'border-oranje bg-oranje/10' : vol ? 'border-[#2a2a2a] bg-[#111] opacity-40 cursor-not-allowed' : 'border-[#2a2a2a] bg-[#141414] hover:border-oranje'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs font-semibold uppercase border px-2 py-0.5 rounded ${tc}`}>{loc.type}</span>
                        {geselecteerd && <span className="text-oranje text-xs font-bold bg-oranje/20 px-2 py-0.5 rounded">✓</span>}
                      </div>
                      <h3 className="text-xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{loc.naam}</h3>
                      <p className="text-gray-500 text-xs mt-1">{loc.adres}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Route sidebar */}
            <div className="lg:sticky lg:top-24 self-start">
              <div className="bg-[#141414] rounded-xl border border-[#252525] p-5">
                <h2 className="text-2xl font-black uppercase mb-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>JOUW ROUTE</h2>
                <p className="text-gray-500 text-xs mb-4">{route.length}/5 locaties</p>
                {route.length === 0 ? (
                  <p className="text-gray-600 text-sm py-4 text-center">Selecteer locaties of druk op Random</p>
                ) : (
                  <ol className="space-y-3 mb-5">
                    {route.map((loc, i) => (
                      <li key={loc._id} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-black flex-shrink-0" style={{ backgroundColor: '#F27A00' }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{loc.naam}</p>
                          <p className="text-gray-600 text-xs truncate">{loc.adres}</p>
                        </div>
                        <button onClick={() => toggleLocatie(loc)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <button
                  onClick={() => route.length > 0 && setFase('namen')}
                  disabled={route.length === 0}
                  className="w-full py-4 rounded-xl font-black uppercase text-lg tracking-wide transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-95"
                  style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: route.length > 0 ? '#F27A00' : '#333', color: route.length > 0 ? '#000' : '#666' }}
                >
                  Volgende stap →
                </button>
                {route.length > 0 && (
                  <button onClick={() => setRoute([])} className="w-full mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors uppercase tracking-wide">
                    Wis route
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // ── Namen fase ────────────────────────────────────────────────────
  if (fase === 'namen') {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setFase('selectie')} className="text-gray-500 text-xs uppercase tracking-wide hover:text-oranje mb-4 inline-block">← Terug</button>
            <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>WIE GAAN ER MEE?</h1>
            <p className="text-gray-500 text-sm mt-1">Voer namen in en geef aan wie drinkt</p>
          </div>
        </section>
        <section className="px-4 py-10">
          <div className="max-w-2xl mx-auto space-y-3">
            {deelnemers.map((d, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#141414] rounded-xl border border-[#252525] px-4 py-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-black flex-shrink-0" style={{ backgroundColor: '#F27A00' }}>{i + 1}</span>
                <input
                  type="text"
                  value={d.naam}
                  onChange={(e) => updateDeelnemer(i, 'naam', e.target.value)}
                  placeholder={`Naam ${i + 1}`}
                  className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">{d.drinkt ? '🍺 Drinkt' : '🥤 Soft'}</span>
                  <div
                    onClick={() => updateDeelnemer(i, 'drinkt', !d.drinkt)}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${d.drinkt ? 'bg-oranje' : 'bg-[#333]'}`}
                    style={{ position: 'relative' }}
                  >
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: d.drinkt ? 'translateX(22px)' : 'translateX(2px)' }} />
                  </div>
                </label>
                {deelnemers.length > 1 && (
                  <button onClick={() => verwijderDeelnemer(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={voegDeelnemerToe} className="w-full py-3 rounded-xl border border-dashed border-[#333] text-gray-500 hover:border-oranje hover:text-oranje text-sm transition-colors">
              + Iemand toevoegen
            </button>
            <button
              onClick={startKroegentocht}
              className="w-full py-4 rounded-xl font-black uppercase text-xl tracking-wide hover:scale-[1.02] active:scale-95 transition-all mt-4"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}
            >
              START KROEGENTOCHT 🍺
            </button>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // ── Actieve kroegentocht ──────────────────────────────────────────
  const huidigeKroeg = route[kroegIndex];
  const drinkers = deelnemers.filter((d) => d.drinkt && d.naam);

  if (afgerond) {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-6">🏆</div>
            <h1 className="text-5xl font-black uppercase mb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
              KROEGENTOCHT VOLTOOID!
            </h1>
            <p className="text-gray-300 text-lg mb-6">Wat een avond! {route.length} kroegen gedaan met {deelnemers.filter((d) => d.naam).length} man sterk.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setFase('selectie'); setRoute([]); setDeelnemers([{ naam: '', drinkt: true }]); }}
                className="py-3.5 rounded-xl font-black uppercase text-lg" style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}>
                Nieuwe ronde →
              </button>
              <a href="/" className="py-3.5 rounded-xl border border-[#333] text-gray-400 font-bold uppercase text-sm">
                Terug naar home
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Voortgang bar */}
      <div className="h-1 bg-[#1a1a1a]">
        <div className="h-full bg-oranje transition-all duration-500" style={{ width: `${((kroegIndex + 1) / route.length) * 100}%` }} />
      </div>

      <section className="px-4 py-8 max-w-xl mx-auto">
        {/* Stap indicator */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest">
            Stop {kroegIndex + 1} van {route.length}
          </p>
          <div className="flex gap-1">
            {route.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i <= kroegIndex ? 'bg-oranje' : 'bg-[#333]'}`} />
            ))}
          </div>
        </div>

        {/* Huidige kroeg */}
        <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6 mb-6">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Jullie gaan naar</p>
          <h2 className="text-4xl font-black uppercase mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
            {huidigeKroeg.naam}
          </h2>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg width="14" height="14" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
            </svg>
            {huidigeKroeg.adres}
          </div>
          <a href={mapsUrl()} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-xs font-bold uppercase text-oranje border border-oranje/30 px-4 py-2 rounded-lg hover:bg-oranje/10 transition-colors">
            📍 Open in Maps
          </a>
        </div>

        {/* Deelnemers */}
        {deelnemers.filter((d) => d.naam).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {deelnemers.filter((d) => d.naam).map((d, i) => (
              <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-full ${d.drinkt ? 'bg-oranje text-black' : 'bg-[#333] text-gray-400'}`}>
                {d.naam} {d.drinkt ? '🍺' : '🥤'}
              </span>
            ))}
          </div>
        )}

        {/* Opdracht */}
        {huidigeOpdracht && (
          <div className="bg-[#0a0500] rounded-2xl border-2 border-oranje/30 p-6 mb-6">
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-3">🎯 Opdracht</p>
            <p className="text-white text-lg font-semibold leading-relaxed">{huidigeOpdracht.tekst}</p>
            <button onClick={nieuweOpdracht}
              className="mt-4 text-xs text-gray-500 hover:text-oranje uppercase tracking-wide transition-colors">
              🔄 Andere opdracht
            </button>
          </div>
        )}

        {/* Acties */}
        <div className="flex flex-col gap-3">
          <button
            onClick={volgendeKroeg}
            className="w-full py-4 rounded-xl font-black uppercase text-xl tracking-wide hover:scale-[1.02] active:scale-95 transition-all"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}
          >
            {kroegIndex + 1 < route.length ? `Volgende: ${route[kroegIndex + 1].naam} →` : 'Kroegentocht afronden 🏆'}
          </button>
          <button onClick={nieuweOpdracht}
            className="w-full py-3 rounded-xl border border-[#2a2a2a] text-gray-400 text-sm font-bold uppercase hover:border-oranje hover:text-oranje transition-colors">
            Nieuwe opdracht
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
