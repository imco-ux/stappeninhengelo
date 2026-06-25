'use client';

import { useState, useRef } from 'react';

export default function UnsplashPicker({ onKies, zoekterm = '' }) {
  const [open, setOpen] = useState(false);
  const [zoek, setZoek] = useState(zoekterm);
  const [resultaten, setResultaten] = useState([]);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const inputRef = useRef(null);

  async function zoeken(q) {
    const query = (q || zoek).trim();
    if (!query) return;
    setLaden(true);
    setFout('');
    const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.error) { setFout(data.error); setLaden(false); return; }
    setResultaten(data.results || []);
    setLaden(false);
  }

  function openPicker() {
    setOpen(true);
    if (zoekterm && resultaten.length === 0) zoeken(zoekterm);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function kies(foto) {
    onKies(foto.url);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={openPicker}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] text-xs text-gray-400 hover:border-oranje hover:text-oranje transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        Unsplash
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-2xl rounded-2xl border border-[#2a2a2a] overflow-hidden" style={{ backgroundColor: '#141414', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
              <p className="font-black uppercase text-sm text-white" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                🔍 Unsplash foto zoeken
              </p>
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white text-lg leading-none">✕</button>
            </div>

            {/* Zoekbalk */}
            <div className="px-5 py-3 border-b border-[#1e1e1e]">
              <div className="flex gap-2">
                <input ref={inputRef} value={zoek} onChange={e => setZoek(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && zoeken()}
                  placeholder="Zoek foto's... (bijv. 'nightlife', 'cocktails', 'Hengelo')"
                  className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-oranje" />
                <button type="button" onClick={() => zoeken()}
                  disabled={laden}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
                  style={{ backgroundColor: '#F27A00' }}>
                  {laden ? '...' : 'Zoek'}
                </button>
              </div>
              {fout && <p className="text-red-400 text-xs mt-2">{fout}</p>}
            </div>

            {/* Resultaten */}
            <div className="flex-1 overflow-y-auto p-4">
              {laden ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="rounded-lg bg-[#0d0d0d] animate-pulse" style={{ aspectRatio: '16/9' }} />
                  ))}
                </div>
              ) : resultaten.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-sm">
                  {zoek ? 'Geen resultaten gevonden' : 'Zoek naar een foto om te beginnen'}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {resultaten.map(foto => (
                    <button key={foto.id} type="button" onClick={() => kies(foto)}
                      className="relative rounded-lg overflow-hidden border border-transparent hover:border-oranje transition-all group"
                      style={{ aspectRatio: '16/9' }}>
                      <img src={foto.thumb} alt={foto.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 bg-oranje px-2 py-1 rounded-lg">Kies</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-gray-300 truncate">📷 {foto.auteur}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-2 border-t border-[#1e1e1e]">
              <p className="text-[10px] text-gray-700">Foto's via <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500">Unsplash</a> — gratis voor commercieel gebruik</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
