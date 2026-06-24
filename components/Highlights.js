'use client';

import { useState } from 'react';

const catKleur = {
  Nieuws:  'bg-oranje text-black',
  Feature: 'bg-purple-600 text-white',
  Events:  'bg-green-700 text-white',
};

function HighlightCard({ item }) {
  const [fotoFout, setFotoFout] = useState(false);
  const cat = catKleur[item.categorie] || 'bg-[#333] text-white';
  const href = item.href || '/nieuws';
  const isExtern = item.extern === true;
  const toonFoto = item.foto && !fotoFout;

  return (
    <a href={href} target={isExtern ? '_blank' : undefined} rel={isExtern ? 'noopener noreferrer' : undefined}
      className="bg-[#181818] rounded-xl border border-[#2a2a2a] hover:border-oranje transition-colors overflow-hidden group cursor-pointer flex flex-col">
      <div className="relative overflow-hidden border-b border-[#2a2a2a]" style={{ height: '180px' }}>
        {toonFoto ? (
          <>
            <img src={item.foto} alt="" aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-60"
              onError={() => setFotoFout(true)} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }} />
            <img src={item.foto} alt={item.titel}
              className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setFotoFout(true)} />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1"
            style={{ background: 'linear-gradient(135deg, #1a0800 0%, #2B1400 100%)' }}>
            <span className="text-3xl font-black text-white/20" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {(item.subtitel || item.titel || '?').charAt(0).toUpperCase()}
            </span>
            {item.subtitel && <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{item.subtitel}</span>}
          </div>
        )}
        {isExtern && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#aaa', border: '1px solid #333' }}>
            ↗ extern
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${cat}`}>{item.categorie}</span>
          <span className="text-xs text-gray-600">{item.datum}</span>
        </div>
        <h3 className="text-lg font-black uppercase leading-tight group-hover:text-oranje transition-colors flex-1" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          {item.titel}
        </h3>
        {item.subtitel && <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{item.subtitel}</p>}
        <span className="text-oranje text-sm font-semibold mt-1 group-hover:underline">
          {isExtern ? `Lees op ${item.subtitel} →` : 'Lees meer →'}
        </span>
      </div>
    </a>
  );
}

export default function Highlights({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="py-14 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Uitgelicht</h2>
          <a href="/nieuws" className="text-oranje text-sm font-semibold hover:underline">Alles bekijken →</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <HighlightCard key={item._id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
