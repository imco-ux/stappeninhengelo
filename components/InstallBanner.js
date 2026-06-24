'use client';

import { useState, useEffect } from 'react';

const OPSLAG_KEY = 'install_banner_gesloten';
const WACHT_MS = 10000; // 10 seconden

export default function InstallBanner() {
  const [zichtbaar, setZichtbaar] = useState(false);
  const [toestel, setToestel] = useState(null);

  useEffect(() => {
    // Niet tonen in web app
    const isWebApp =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isWebApp) return;

    // Niet tonen als recent al gesloten (7 dagen)
    const gesloten = localStorage.getItem(OPSLAG_KEY);
    if (gesloten && Date.now() - Number(gesloten) < 7 * 24 * 60 * 60 * 1000) return;

    const timer = setTimeout(() => setZichtbaar(true), WACHT_MS);
    return () => clearTimeout(timer);
  }, []);

  function sluit() {
    localStorage.setItem(OPSLAG_KEY, String(Date.now()));
    setZichtbaar(false);
  }

  if (!zichtbaar) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) sluit(); }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-oranje/30" style={{ backgroundColor: '#0f0700' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-oranje/20">
          <div className="flex items-center gap-3">
            <img src="/images/profile-icon.png" alt="" className="w-9 h-9 rounded-xl" />
            <div>
              <p className="text-white font-black text-sm uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                Voeg toe aan je beginscherm
              </p>
              <p className="text-gray-500 text-xs">Gratis · Geen app store nodig</p>
            </div>
          </div>
          <button onClick={sluit} className="text-gray-600 hover:text-white p-1 ml-2 flex-shrink-0">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!toestel ? (
          <div className="p-4">
            <p className="text-gray-300 text-sm mb-4 text-center">Welk toestel gebruik jij?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setToestel('iphone')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#2a2a2a] hover:border-oranje hover:bg-oranje/5 transition-all active:scale-95"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-white font-bold text-sm">iPhone</span>
                <span className="text-gray-500 text-xs">iOS</span>
              </button>
              <button
                onClick={() => setToestel('android')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#2a2a2a] hover:border-oranje hover:bg-oranje/5 transition-all active:scale-95"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#78C257">
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.44-.5-3.09-.77-4.86-.77s-3.42.27-4.86.77L4.65 5.67c-.19-.29-.55-.37-.84-.22-.3.16-.42.54-.26.85L5.4 9.48C3.3 10.78 2 12.87 2 15.16V16h20v-.84c0-2.29-1.3-4.38-3.4-5.68zM8.5 13.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
                <span className="text-white font-bold text-sm">Android</span>
                <span className="text-gray-500 text-xs">Chrome / Samsung</span>
              </button>
            </div>
          </div>
        ) : toestel === 'iphone' ? (
          <div className="p-4 space-y-3">
            <button onClick={() => setToestel(null)} className="text-gray-500 text-xs hover:text-oranje flex items-center gap-1">
              ← Terug
            </button>
            <p className="text-white font-bold text-sm">Voeg toe op iPhone</p>
            {/* Safari */}
            <div>
              <p className="text-oranje text-xs font-bold uppercase tracking-wide mb-2">Via Safari</p>
              <ol className="space-y-2">
                {[
                  'Tik rechtsbovenin op de drie puntjes (···)',
                  'Tik op "Deel"',
                  'Scroll omlaag en tik op "Zet op beginscherm"',
                  'Tik op "Voeg toe" — klaar!',
                ].map((tekst, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-black mt-0.5" style={{ backgroundColor: '#F27A00' }}>{i + 1}</span>
                    <span className="text-gray-300 text-sm">{tekst}</span>
                  </li>
                ))}
              </ol>
            </div>
            {/* Chrome */}
            <div className="border-t border-[#1e1e1e] pt-3">
              <p className="text-oranje text-xs font-bold uppercase tracking-wide mb-2">Via Chrome</p>
              <ol className="space-y-2">
                {[
                  'Tik op het Deel-icoon (vierkantje met pijltje omhoog)',
                  'Tik op "Zet op beginscherm"',
                  'Tik op "Voeg toe" — klaar!',
                ].map((tekst, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-black mt-0.5" style={{ backgroundColor: '#F27A00' }}>{i + 1}</span>
                    <span className="text-gray-300 text-sm">{tekst}</span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-green-400 text-xs pt-1">Geen app store nodig. Altijd gratis.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <button onClick={() => setToestel(null)} className="text-gray-500 text-xs hover:text-oranje flex items-center gap-1">
              ← Terug
            </button>
            <p className="text-white font-bold text-sm">Voeg toe op Android</p>
            <ol className="space-y-2.5">
              {[
                'Open deze pagina in Google Chrome',
                'Tik rechtsbovenin op de drie puntjes (⋮)',
                'Tik op "Toevoegen aan startscherm"',
                'Tik op "Toevoegen" — klaar!',
              ].map((tekst, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-black mt-0.5" style={{ backgroundColor: '#F27A00' }}>{i + 1}</span>
                  <span className="text-gray-300 text-sm">{tekst}</span>
                </li>
              ))}
            </ol>
            <p className="text-green-400 text-xs pt-1">Geen app store nodig. Altijd gratis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
