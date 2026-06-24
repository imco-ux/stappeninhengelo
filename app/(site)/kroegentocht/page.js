'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function vulNamenIn(tekst, deelnemers, drinkers) {
  const iedereen = deelnemers.filter(d => d.naam).map(d => d.naam).join(', ');
  const willekeurig = deelnemers.filter(d => d.naam)[Math.floor(Math.random() * deelnemers.filter(d=>d.naam).length)]?.naam || 'iemand';
  const drinker = drinkers.length > 0 ? drinkers[Math.floor(Math.random() * drinkers.length)].naam : willekeurig;
  return tekst
    .replace(/\{naam\}/g, willekeurig)
    .replace(/\{drinker\}/g, drinker)
    .replace(/\{allen\}/g, iedereen);
}

function ScoreKaart({ deelnemers, route, scores, onNieuw }) {
  const canvasRef = useRef(null);
  const [gedownload, setGedownload] = useState(false);

  const actieveDeelnemers = deelnemers.filter(d => d.naam);
  const totaal = route.length;

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 800, H = 600;
    canvas.width = W;
    canvas.height = H;

    // Achtergrond
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);

    // Oranje accent lijn boven
    ctx.fillStyle = '#F27A00';
    ctx.fillRect(0, 0, W, 8);

    // Logo tekst
    ctx.fillStyle = '#F27A00';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('STAPPEN IN HENGELO', 40, 50);

    // Titel
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('KROEGENTOCHT', 40, 110);
    ctx.fillStyle = '#F27A00';
    ctx.fillText('VOLTOOID!', 40, 165);

    // Stats
    ctx.fillStyle = '#666';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${totaal} kroegen · ${actieveDeelnemers.length} deelnemers`, 40, 200);

    // Kroegen route
    ctx.fillStyle = '#333';
    ctx.fillRect(40, 220, W - 80, 1);
    ctx.fillStyle = '#888';
    ctx.font = '13px sans-serif';
    const kroegNamen = route.map(r => r.naam).join('  →  ');
    ctx.fillText(kroegNamen.length > 80 ? kroegNamen.slice(0, 77) + '...' : kroegNamen, 40, 248);

    // Scores
    ctx.fillStyle = '#333';
    ctx.fillRect(40, 270, W - 80, 1);

    const groepsScore = scores.filter(Boolean).length;
    const groepsPct = Math.round((groepsScore / totaal) * 100);

    ctx.fillStyle = '#F27A00';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText(`${groepsPct}%`, 40, 370);
    ctx.fillStyle = '#888';
    ctx.font = '18px sans-serif';
    ctx.fillText(`${groepsScore} van ${totaal} opdrachten gelukt`, 40, 400);

    // Deelnemers
    ctx.fillStyle = '#333';
    ctx.fillRect(40, 430, W - 80, 1);

    let x = 40;
    actieveDeelnemers.forEach((d, i) => {
      const emoji = d.drinkt ? '🍺' : '🥤';
      ctx.fillStyle = d.drinkt ? '#F27A00' : '#555';
      ctx.font = 'bold 14px sans-serif';
      const label = `${emoji} ${d.naam}`;
      ctx.fillText(label, x, 465);
      x += ctx.measureText(label).width + 20;
      if (x > W - 120) { x = 40; }
    });

    // Footer
    ctx.fillStyle = '#333';
    ctx.font = '13px sans-serif';
    ctx.fillText('stappeninhengelo.nl · Deel jouw avond!', 40, H - 30);

    const link = document.createElement('a');
    link.download = 'kroegentocht-score.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setGedownload(true);
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <div className="flex-1 px-4 py-10 max-w-xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-5xl font-black uppercase leading-none mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
            KROEGENTOCHT<br />VOLTOOID!
          </h1>
          <p className="text-gray-400 text-sm">{totaal} kroegen · {actieveDeelnemers.length} deelnemers</p>
        </div>

        {/* Score */}
        <div className="rounded-2xl border border-[#F27A00]/30 p-6 mb-6 text-center" style={{ backgroundColor: '#0a0500' }}>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Groepsscore</p>
          <p className="text-7xl font-black text-oranje mb-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            {Math.round((scores.filter(Boolean).length / totaal) * 100)}%
          </p>
          <p className="text-gray-400 text-sm">{scores.filter(Boolean).length} van {totaal} opdrachten gelukt</p>
        </div>

        {/* Route recap */}
        <div className="rounded-xl border border-[#1e1e1e] p-4 mb-6 space-y-2" style={{ backgroundColor: '#141414' }}>
          <p className="text-xs font-bold uppercase text-gray-500 mb-3">Route</p>
          {route.map((kroeg, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${scores[i] ? 'text-black' : 'bg-[#2a2a2a] text-gray-600'}`}
                style={scores[i] ? { backgroundColor: '#F27A00' } : {}}>
                {scores[i] ? '✓' : i + 1}
              </span>
              <span className={`text-sm font-semibold ${scores[i] ? 'text-white' : 'text-gray-600'}`}>{kroeg.naam}</span>
            </div>
          ))}
        </div>

        {/* Deelnemers */}
        <div className="flex flex-wrap gap-2 mb-8">
          {actieveDeelnemers.map((d, i) => (
            <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-full ${d.drinkt ? 'bg-oranje text-black' : 'bg-[#222] text-gray-400'}`}>
              {d.naam} {d.drinkt ? '🍺' : '🥤'}
            </span>
          ))}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex flex-col gap-3">
          <button onClick={download}
            className="w-full py-4 rounded-xl font-black uppercase text-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}>
            {gedownload ? '✓ Gedownload!' : '📸 Download scorekaart'}
          </button>
          <button onClick={onNieuw}
            className="w-full py-3.5 rounded-xl border border-[#333] text-gray-400 font-bold uppercase text-sm hover:text-white hover:border-oranje transition-colors">
            Nieuwe kroegentocht →
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const OPSLAG_KEY = 'kroegentocht_staat';

function slaOp(staat) {
  try { localStorage.setItem(OPSLAG_KEY, JSON.stringify(staat)); } catch {}
}
function laadOpgeslagen() {
  try { return JSON.parse(localStorage.getItem(OPSLAG_KEY) || 'null'); } catch { return null; }
}
function verwijderOpgeslagen() {
  try { localStorage.removeItem(OPSLAG_KEY); } catch {}
}

export default function KroegentochtPage() {
  const [fase, setFase] = useState('start');
  const [aantalStops, setAantalStops] = useState(4);
  const [route, setRoute] = useState([]);
  const [deelnemers, setDeelnemers] = useState([{ naam: '', drinkt: true }, { naam: '', drinkt: true }]);
  const [allVenues, setAllVenues] = useState([]);
  const [allOpdrachten, setAllOpdrachten] = useState([]);
  const [ladenData, setLadenData] = useState(false);

  // Actieve kroegentocht
  const [kroegIndex, setKroegIndex] = useState(0);
  const [huidigeOpdracht, setHuidigeOpdracht] = useState(null);
  const [gebruikteOpdrachten, setGebruikteOpdrachten] = useState([]);
  const [wachtOpOordeel, setWachtOpOordeel] = useState(false);
  const [scores, setScores] = useState([]);
  const [hervatteBanner, setHervatteBanner] = useState(false);

  useEffect(() => {
    async function laad() {
      setLadenData(true);
      const [venRes, opRes] = await Promise.all([
        supabase.from('venues').select('id, naam, adres, type, kroegentocht_actief, kroegentocht_gewicht').eq('kroegentocht_actief', true),
        supabase.from('kroegentocht_opdrachten').select('*').eq('goedgekeurd', true),
      ]);
      setAllVenues(venRes.data || []);
      setAllOpdrachten(opRes.data || []);
      setLadenData(false);

      // Herstel opgeslagen staat
      const opgeslagen = laadOpgeslagen();
      if (opgeslagen?.fase === 'actief' && opgeslagen.route?.length > 0) {
        setFase(opgeslagen.fase);
        setRoute(opgeslagen.route);
        setDeelnemers(opgeslagen.deelnemers);
        setKroegIndex(opgeslagen.kroegIndex || 0);
        setScores(opgeslagen.scores || []);
        setGebruikteOpdrachten(opgeslagen.gebruikteOpdrachten || []);
        setHuidigeOpdracht(opgeslagen.huidigeOpdracht || null);
        setHervatteBanner(true);
        setTimeout(() => setHervatteBanner(false), 4000);
      }
    }
    laad();
  }, []);

  // Sla staat op bij elke wijziging
  useEffect(() => {
    if (fase === 'actief') {
      slaOp({ fase, route, deelnemers, kroegIndex, scores, gebruikteOpdrachten, huidigeOpdracht });
    } else if (fase === 'klaar' || fase === 'start') {
      verwijderOpgeslagen();
    }
  }, [fase, kroegIndex, scores, huidigeOpdracht]);

  function bouwRoute(n) {
    // Gewogen random selectie
    const pool = [];
    allVenues.forEach(v => {
      const gewicht = v.kroegentocht_gewicht || 1;
      for (let i = 0; i < gewicht; i++) pool.push(v);
    });
    const geselecteerd = [];
    const gebruikteIds = new Set();
    const geshuffled = shuffle(pool);
    for (const v of geshuffled) {
      if (!gebruikteIds.has(v.id)) {
        geselecteerd.push(v);
        gebruikteIds.add(v.id);
        if (geselecteerd.length >= n) break;
      }
    }
    return geselecteerd;
  }

  function kiesOpdracht(venueId, gebruikte) {
    const venueOps = allOpdrachten.filter(o => o.venue_id === venueId);
    const algemeenOps = allOpdrachten.filter(o => !o.venue_id);
    const beschikbaar = [...venueOps, ...algemeenOps].filter(o => !gebruikte.includes(o.id));
    if (beschikbaar.length === 0) {
      const reset = [...venueOps, ...algemeenOps];
      return shuffle(reset)[0] || null;
    }
    return shuffle(beschikbaar)[0];
  }

  function startKroegentocht() {
    const deelnNames = deelnemers.filter(d => d.naam.trim());
    if (deelnNames.length === 0) return;
    const nieuwRoute = bouwRoute(aantalStops);
    setRoute(nieuwRoute);
    setKroegIndex(0);
    setScores([]);
    setGebruikteOpdrachten([]);
    setWachtOpOordeel(false);
    const eersteOp = kiesOpdracht(nieuwRoute[0]?.id, []);
    setHuidigeOpdracht(eersteOp);
    if (eersteOp) setGebruikteOpdrachten([eersteOp.id]);
    setFase('actief');
  }

  function nieuweOpdracht() {
    const op = kiesOpdracht(route[kroegIndex]?.id, gebruikteOpdrachten);
    setHuidigeOpdracht(op);
    if (op) setGebruikteOpdrachten(prev => [...prev, op.id]);
  }

  function beoordeelOpdracht(gelukt) {
    const nieuweScores = [...scores, gelukt];
    setScores(nieuweScores);
    const volgend = kroegIndex + 1;
    if (volgend >= route.length) {
      setFase('klaar');
    } else {
      setKroegIndex(volgend);
      setWachtOpOordeel(false);
      const op = kiesOpdracht(route[volgend]?.id, gebruikteOpdrachten);
      setHuidigeOpdracht(op);
      if (op) setGebruikteOpdrachten(prev => [...prev, op.id]);
    }
  }

  function reset() {
    verwijderOpgeslagen();
    setFase('start');
    setRoute([]);
    setDeelnemers([{ naam: '', drinkt: true }, { naam: '', drinkt: true }]);
    setScores([]);
    setKroegIndex(0);
    setHuidigeOpdracht(null);
    setGebruikteOpdrachten([]);
  }

  const actieveDeelnemers = deelnemers.filter(d => d.naam.trim());
  const drinkers = actieveDeelnemers.filter(d => d.drinkt);
  const huidigeKroeg = route[kroegIndex];
  const opdrachtTekst = huidigeOpdracht ? vulNamenIn(huidigeOpdracht.tekst, actieveDeelnemers, drinkers) : null;

  if (fase === 'klaar') {
    return <ScoreKaart deelnemers={deelnemers} route={route} scores={scores} onNieuw={reset} />;
  }

  // START scherm
  if (fase === 'start') {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-sm w-full text-center">
            <div className="text-6xl mb-6">🍺</div>
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-2">Stappen In Hengelo</p>
            <h1 className="text-6xl font-black uppercase leading-none mb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              KROEGEN<br />TOCHT
            </h1>
            <p className="text-gray-500 text-sm mb-10">
              {ladenData ? 'Kroegen laden...' : `${allVenues.length} kroegen · ${allOpdrachten.length} opdrachten`}
            </p>
            <button
              onClick={() => setFase('stops')}
              disabled={ladenData || allVenues.length === 0}
              className="w-full py-5 rounded-2xl font-black uppercase text-2xl tracking-wide transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}>
              START KROEGENTOCHT
            </button>
            {allVenues.length === 0 && !ladenData && (
              <p className="text-xs text-gray-600 mt-4">Nog geen kroegen aangemeld voor de kroegentocht.</p>
            )}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // STOPS kiezen
  if (fase === 'stops') {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-sm w-full">
            <button onClick={() => setFase('start')} className="text-gray-500 text-xs uppercase tracking-wide hover:text-oranje mb-6 inline-block">← Terug</button>
            <h1 className="text-5xl font-black uppercase leading-none mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              HOEVEEL STOPS?
            </h1>
            <p className="text-gray-500 text-sm mb-8">Kies het aantal kroegen voor vanavond</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[4, 8, 12].map(n => (
                <button key={n} onClick={() => setAantalStops(n)}
                  className={`py-8 rounded-2xl font-black text-4xl transition-all hover:scale-105 active:scale-95 border-2 ${aantalStops === n ? 'border-oranje text-black' : 'border-[#2a2a2a] text-white bg-[#141414]'}`}
                  style={aantalStops === n ? { backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" } : { fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs text-center mb-6">
              {aantalStops > allVenues.length ? `⚠️ Maar ${allVenues.length} kroegen beschikbaar — we gebruiken er ${allVenues.length}` : `${aantalStops} willekeurige kroegen uit ${allVenues.length} deelnemende locaties`}
            </p>
            <button onClick={() => setFase('namen')}
              className="w-full py-4 rounded-xl font-black uppercase text-xl tracking-wide transition-all hover:scale-[1.02] active:scale-95"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}>
              Volgende →
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // NAMEN invoeren
  if (fase === 'namen') {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 px-4 py-10">
          <div className="max-w-sm mx-auto">
            <button onClick={() => setFase('stops')} className="text-gray-500 text-xs uppercase tracking-wide hover:text-oranje mb-6 inline-block">← Terug</button>
            <h1 className="text-5xl font-black uppercase leading-none mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              WIE GAAN ER MEE?
            </h1>
            <p className="text-gray-500 text-sm mb-6">Voer namen in en geef aan wie drinkt</p>
            <div className="space-y-3 mb-4">
              {deelnemers.map((d, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#141414] rounded-xl border border-[#252525] px-4 py-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-black flex-shrink-0"
                    style={{ backgroundColor: '#F27A00' }}>{i + 1}</span>
                  <input type="text" value={d.naam}
                    onChange={e => { const n = [...deelnemers]; n[i] = { ...n[i], naam: e.target.value }; setDeelnemers(n); }}
                    placeholder={`Naam ${i + 1}`}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm" />
                  <div onClick={() => { const n = [...deelnemers]; n[i] = { ...n[i], drinkt: !n[i].drinkt }; setDeelnemers(n); }}
                    className={`w-10 h-5 rounded-full cursor-pointer flex-shrink-0 relative transition-colors ${d.drinkt ? 'bg-oranje' : 'bg-[#333]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${d.drinkt ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 flex-shrink-0">{d.drinkt ? '🍺' : '🥤'}</span>
                  {deelnemers.length > 1 && (
                    <button onClick={() => setDeelnemers(deelnemers.filter((_, idx) => idx !== i))}
                      className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {deelnemers.length < 12 && (
              <button onClick={() => setDeelnemers([...deelnemers, { naam: '', drinkt: true }])}
                className="w-full py-3 rounded-xl border border-dashed border-[#333] text-gray-500 hover:border-oranje hover:text-oranje text-sm transition-colors mb-6">
                + Iemand toevoegen
              </button>
            )}
            <button onClick={startKroegentocht} disabled={actieveDeelnemers.length === 0}
              className="w-full py-4 rounded-xl font-black uppercase text-xl tracking-wide hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}>
              START KROEGENTOCHT 🍺
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // ACTIEVE kroegentocht
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Header />

      {/* Progress bar */}
      <div className="h-1.5 bg-[#1a1a1a]">
        <div className="h-full bg-oranje transition-all duration-500" style={{ width: `${((kroegIndex + 1) / route.length) * 100}%` }} />
      </div>

      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        {hervatteBanner && (
          <div className="mb-4 rounded-xl bg-green-950/40 border border-green-700/40 px-4 py-3 text-green-400 text-sm font-semibold">
            ✓ Kroegentocht hervat waar je gebleven was!
          </div>
        )}
        {/* Stop indicator */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest">
            Stop {kroegIndex + 1} van {route.length}
          </p>
          <div className="flex gap-1.5">
            {route.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < kroegIndex ? 'bg-oranje' : i === kroegIndex ? 'bg-oranje' : 'bg-[#333]'}`}
                style={i === kroegIndex ? { boxShadow: '0 0 6px #F27A00' } : {}} />
            ))}
          </div>
        </div>

        {/* Huidige kroeg */}
        <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6 mb-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Jullie gaan naar</p>
          <h2 className="text-4xl font-black uppercase mb-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
            {huidigeKroeg?.naam}
          </h2>
          {huidigeKroeg?.adres && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg width="13" height="13" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
              </svg>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(huidigeKroeg.adres)}`}
                target="_blank" rel="noopener noreferrer"
                className="hover:text-oranje underline underline-offset-2">
                {huidigeKroeg.adres}
              </a>
            </div>
          )}
        </div>

        {/* Deelnemers chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {actieveDeelnemers.map((d, i) => (
            <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-full ${d.drinkt ? 'bg-oranje/20 text-oranje border border-oranje/30' : 'bg-[#1e1e1e] text-gray-500 border border-[#2a2a2a]'}`}>
              {d.naam} {d.drinkt ? '🍺' : '🥤'}
            </span>
          ))}
        </div>

        {/* Opdracht */}
        {opdrachtTekst && !wachtOpOordeel && (
          <div className="bg-[#0a0500] rounded-2xl border-2 border-oranje/40 p-6 mb-5">
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-3">🎯 Opdracht</p>
            <p className="text-white text-lg font-semibold leading-relaxed">{opdrachtTekst}</p>
            <button onClick={nieuweOpdracht} className="mt-4 text-xs text-gray-600 hover:text-oranje uppercase tracking-wide transition-colors">
              🔄 Andere opdracht
            </button>
          </div>
        )}

        {/* Oordeel knoppen */}
        {!wachtOpOordeel ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-600 text-center uppercase tracking-wide">Is de opdracht gelukt?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => beoordeelOpdracht(true)}
                className="py-4 rounded-xl font-black uppercase text-lg transition-all hover:scale-[1.02] active:scale-95 bg-green-900/40 border border-green-600/50 text-green-400"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                ✓ GELUKT
              </button>
              <button onClick={() => beoordeelOpdracht(false)}
                className="py-4 rounded-xl font-black uppercase text-lg transition-all hover:scale-[1.02] active:scale-95 bg-red-900/20 border border-red-800/30 text-red-400"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                ✗ MISLUKT
              </button>
            </div>
            <button
              onClick={() => {
                const volgend = kroegIndex + 1;
                if (volgend >= route.length) {
                  setScores(s => [...s, null]);
                  setFase('klaar');
                } else {
                  setScores(s => [...s, null]);
                  setKroegIndex(volgend);
                  const op = kiesOpdracht(route[volgend]?.id, gebruikteOpdrachten);
                  setHuidigeOpdracht(op);
                  if (op) setGebruikteOpdrachten(prev => [...prev, op.id]);
                }
              }}
              className="w-full py-3 rounded-xl border border-[#2a2a2a] text-gray-500 text-sm font-bold uppercase hover:text-gray-300 transition-colors">
              {kroegIndex + 1 < route.length ? `Sla over → ${route[kroegIndex + 1]?.naam}` : 'Sla over & rond af'}
            </button>
          </div>
        ) : null}
      </div>

      <Footer />
    </main>
  );
}
