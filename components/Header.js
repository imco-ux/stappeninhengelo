'use client';
import { useState } from 'react';

const navLinks = [
  { label: 'Agenda', href: '/agenda' },
  { label: 'Locaties', href: '/locaties' },
  { label: 'Kroegentocht', href: '/kroegentocht' },
  { label: 'Prijzen Radar', href: '/prijzen' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14 md:h-16">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 min-w-0">
          <img
            src="/images/profile-icon.png"
            alt="Stappen In Hengelo logo"
            width={34}
            height={34}
            className="rounded-full flex-shrink-0"
          />
          <span
            className="text-base md:text-xl font-black uppercase tracking-tight leading-none"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#fff' }}
          >
            STAPPEN IN{' '}
            <span style={{ color: '#F27A00' }}>HENGELO</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wide"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/event-aanmelden"
            className="text-sm font-bold uppercase tracking-wide px-4 py-2 rounded"
            style={{ backgroundColor: '#F27A00', color: '#000' }}
          >
            + Event aanmelden
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#111] border-t border-[#222] px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-gray-300 uppercase tracking-wide py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/event-aanmelden"
            className="text-sm font-bold uppercase tracking-wide px-4 py-3 rounded text-center mt-2"
            style={{ backgroundColor: '#F27A00', color: '#000' }}
          >
            + Event aanmelden
          </a>
        </div>
      )}
    </header>
  );
}
