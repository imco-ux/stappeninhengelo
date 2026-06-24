'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

// Genereer een unieke gradient kleur per brondomein
function bronKleur(bron) {
  const kleuren = [
    ['#1a0a00','#3d1f00'], ['#001a0a','#003d1f'], ['#00101a','#00263d'],
    ['#0a001a','#1f003d'], ['#1a000a','#3d001f'], ['#0a0a00','#1f1f00'],
  ];
  const idx = (bron || '').split('').reduce((a,c) => a + c.charCodeAt(0), 0) % kleuren.length;
  return kleuren[idx];
}

function GoogleNieuwsKaart({ item }) {
  const [fotoFout, setFotoFout] = useState(false);
  const [gc1, gc2] = bronKleur(item.bron);
  const toonFoto = item.foto && !fotoFout;

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      className="bg-[#141414] rounded-xl border border-[#252525] hover:border-oranje transition-colors overflow-hidden group flex flex-col">
      <div className="relative overflow-hidden border-b border-[#1e1e1e]" style={{ height: 150 }}>
        {toonFoto ? (
          <img
            src={item.foto}
            alt={item.titel}
            onError={() => setFotoFout(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${gc1} 0%, ${gc2} 100%)` }}>
            <span className="text-3xl font-black text-white/20" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {(item.bron || '?').charAt(0).toUpperCase()}
            </span>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.bron}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-1.5"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span className="text-[10px] text-gray-400 font-semibold">{item.bron}</span>
          {item.datum && <span className="text-[10px] text-gray-600 ml-auto">{item.datum}</span>}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="text-base font-black uppercase leading-tight group-hover:text-oranje transition-colors line-clamp-3 flex-1"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          {item.titel}
        </h3>
        <span className="text-oranje text-xs font-bold pt-2">Lees artikel →</span>
      </div>
    </a>
  );
}

export default function NieuwsPage() {
  const [handmatig, setHandmatig] = useState([]);
  const [google, setGoogle]       = useState([]);
  const [laden, setLaden]         = useState(true);
  const [googleLaden, setGoogleLaden] = useState(true);
  const [tab, setTab]             = useState('alles'); // 'alles' | 'google'

  useEffect(() => {
    supabase
      .from('nieuws')
      .select('*')
      .eq('gepubliceerd', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHandmatig(data || []);
        setLaden(false);
      });

    fetch('/api/google-nieuws')
      .then(r => r.json())
      .then(d => {
        setGoogle(d.artikelen || []);
        setGoogleLaden(false);
      })
      .catch(() => setGoogleLaden(false));
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
          <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>NIEUWS</h1>
          <p className="text-gray-500 text-sm mt-1">Alles over uitgaan in Hengelo</p>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-[#1a1a1a]" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-3">
          {[
            { key: 'alles', label: 'Alles' },
            { key: 'uitgelicht', label: '⭐ Uitgelicht' },
            { key: 'google', label: '📰 Google Nieuws' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${tab === t.key ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">

          {/* Handmatige artikelen */}
          {(tab === 'alles' || tab === 'uitgelicht') && (
            <>
              {tab === 'alles' && handmatig.length > 0 && (
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-5">Uitgelicht</h2>
              )}
              {laden ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                  {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-[#141414] animate-pulse" />)}
                </div>
              ) : handmatig.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                  {handmatig.map(item => (
                    <article key={item.id} className="bg-[#141414] rounded-xl border border-[#252525] hover:border-oranje transition-colors overflow-hidden group flex flex-col">
                      <div className="relative overflow-hidden border-b border-[#1e1e1e]" style={{ height: 180 }}>
                        {item.foto ? (
                          <img src={item.foto} alt={item.titel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0d0d0d]">
                            <span className="text-4xl opacity-20">📰</span>
                          </div>
                        )}
                        {item.categorie && (
                          <span className="absolute top-3 left-3 text-xs font-bold uppercase px-2 py-1 rounded" style={{ backgroundColor: '#F27A00', color: '#000' }}>
                            {item.categorie}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col gap-2 flex-1">
                        <p className="text-xs text-gray-600">{new Date(item.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <h3 className="text-xl font-black uppercase leading-tight group-hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                          {item.titel}
                        </h3>
                        {item.subtitel && <p className="text-sm text-gray-500 line-clamp-3 flex-1">{item.subtitel}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : tab === 'uitgelicht' ? (
                <div className="text-center py-20 text-gray-600">
                  <p className="text-2xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Nog geen artikelen</p>
                  <p className="text-sm mt-2">Voeg artikelen toe via het admin paneel</p>
                </div>
              ) : null}
            </>
          )}

          {/* Google Nieuws */}
          {(tab === 'alles' || tab === 'google') && (
            <>
              {tab === 'alles' && (
                <div className="flex items-center gap-3 mb-5 mt-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600">Google Nieuws</h2>
                  <span className="text-xs text-gray-700 italic">automatisch bijgewerkt</span>
                </div>
              )}
              {googleLaden ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-xl bg-[#141414] animate-pulse" />)}
                </div>
              ) : google.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-sm">Geen nieuws gevonden.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {google.map((item, i) => (
                    <GoogleNieuwsKaart key={i} item={item} />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      <Footer />
    </main>
  );
}
