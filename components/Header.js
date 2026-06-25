'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const navLinks = [
  { label: 'Agenda', href: '/agenda' },
  { label: 'Locaties', href: '/locaties' },
  { label: 'Kroegentocht', href: '/kroegentocht' },
  { label: 'Prijzen Radar', href: '/prijzen' },
  { label: 'Contact', href: '/contact' },
];

function slugify(naam) {
  return naam?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [zoekOpen, setZoekOpen] = useState(false);
  const [zoekQuery, setZoekQuery] = useState('');
  const [resultaten, setResultaten] = useState([]);
  const [zoekBezig, setZoekBezig] = useState(false);
  const zoekRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (zoekOpen) zoekRef.current?.focus();
  }, [zoekOpen]);

  useEffect(() => {
    if (!zoekQuery.trim()) { setResultaten([]); return; }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => zoek(zoekQuery), 250);
    return () => clearTimeout(timeoutRef.current);
  }, [zoekQuery]);

  async function zoek(q) {
    setZoekBezig(true);
    const term = `%${q}%`;
    const [evRes, locRes] = await Promise.all([
      supabase.from('events').select('id, title, datum, slug').eq('goedgekeurd', true).ilike('title', term).limit(4),
      supabase.from('venues').select('id, naam, type').eq('actief', true).ilike('naam', term).limit(4),
    ]);
    const items = [
      ...(evRes.data || []).map(e => ({ type: 'event', label: e.title, sub: e.datum ? new Date(e.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '', href: `/events/${e.slug || e.id}` })),
      ...(locRes.data || []).map(l => ({ type: 'locatie', label: l.naam, sub: l.type || 'Locatie', href: `/locaties/${slugify(l.naam)}` })),
    ];
    setResultaten(items);
    setZoekBezig(false);
  }

  function sluitZoek() {
    setZoekOpen(false);
    setZoekQuery('');
    setResultaten([]);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-black border-b border-[#1a1a1a]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 min-w-0">
            <img src="/images/profile-icon.png" alt="Stappen In Hengelo logo" width={34} height={34} className="rounded-full flex-shrink-0" />
            <span className="text-base md:text-xl font-black uppercase tracking-tight leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#fff' }}>
              STAPPEN IN{' '}<span style={{ color: '#F27A00' }}>HENGELO</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wide">{l.label}</a>
            ))}
            <a href="/event-aanmelden" className="text-sm font-bold uppercase tracking-wide px-4 py-2 rounded" style={{ backgroundColor: '#F27A00', color: '#000' }}>
              + Event aanmelden
            </a>
          </nav>

          {/* Rechts: zoek + hamburger (mobiel) */}
          <div className="flex items-center gap-3">
            {/* Zoekknop */}
            <button onClick={() => setZoekOpen(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Zoeken">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Hamburger (alleen mobiel) */}
            <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-[#111] border-t border-[#222] px-4 py-4 flex flex-col gap-3">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-gray-300 uppercase tracking-wide py-2" onClick={() => setOpen(false)}>{l.label}</a>
            ))}
            <a href="/event-aanmelden" className="text-sm font-bold uppercase tracking-wide px-4 py-3 rounded text-center mt-2" style={{ backgroundColor: '#F27A00', color: '#000' }}>
              + Event aanmelden
            </a>
          </div>
        )}
      </header>

      {/* Zoek overlay */}
      {zoekOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1a1a1a]">
            <svg width="20" height="20" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={zoekRef}
              value={zoekQuery}
              onChange={e => setZoekQuery(e.target.value)}
              placeholder="Zoek events, locaties..."
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-600"
            />
            <button onClick={sluitZoek} className="text-gray-500 hover:text-white text-sm px-2 py-1">
              Annuleer
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {zoekBezig && <p className="text-gray-600 text-sm text-center py-8">Zoeken...</p>}

            {!zoekBezig && zoekQuery && resultaten.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">Geen resultaten voor "{zoekQuery}"</p>
            )}

            {resultaten.length > 0 && (
              <div className="space-y-1">
                {resultaten.map((r, i) => (
                  <a key={i} href={r.href} onClick={sluitZoek}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: r.type === 'event' ? 'rgba(242,122,0,0.15)' : 'rgba(99,102,241,0.15)' }}>
                      {r.type === 'event' ? (
                        <svg width="14" height="14" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      ) : (
                        <svg width="14" height="14" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{r.label}</p>
                      <p className="text-gray-500 text-xs">{r.type === 'event' ? 'Event' : 'Locatie'} · {r.sub}</p>
                    </div>
                    <svg width="14" height="14" fill="none" stroke="#444" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                  </a>
                ))}
              </div>
            )}

            {!zoekQuery && (
              <div className="space-y-2 mt-2">
                <p className="text-gray-600 text-xs uppercase tracking-widest mb-3">Snelle links</p>
                {navLinks.map(l => (
                  <a key={l.href} href={l.href} onClick={sluitZoek}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                    <span className="text-gray-300 font-semibold text-sm">{l.label}</span>
                    <svg width="14" height="14" fill="none" stroke="#444" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
