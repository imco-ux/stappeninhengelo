const buttons = [
  {
    label: 'Agenda',
    href: '/agenda',
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    desc: 'Alle events',
  },
  {
    label: 'Kroegentocht',
    href: '/kroegentocht',
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    desc: 'Plan je avond',
  },
  {
    label: 'Locaties',
    href: '/locaties',
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" />
      </svg>
    ),
    desc: 'Kroegen & clubs',
  },
  {
    label: 'Prijzen Radar',
    href: '/prijzen',
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    desc: 'Bierprijs vergelijker',
  },
  {
    label: 'Acties',
    href: '/acties',
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    desc: 'Deals & aanbiedingen',
    highlight: true,
  },
];

export default function QuickNav() {
  return (
    <section className="py-14 px-4" style={{ backgroundColor: '#2B1400' }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-center font-black uppercase tracking-widest mb-8"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          ONTDEK HENGELO
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {buttons.map((btn) => (
            <a
              key={btn.href}
              href={btn.href}
              className={`flex flex-col items-center justify-center gap-3 px-3 rounded-xl border transition-all hover:scale-105 active:scale-95 text-center
                ${btn.highlight
                  ? 'bg-oranje border-oranje text-black hover:bg-amber-500'
                  : 'bg-[#1a0a00] border-[#3d1f00] text-white hover:border-oranje hover:text-oranje'
                }`}
              style={{ minHeight: '120px' }}
            >
              <span className={btn.highlight ? 'text-black' : 'text-oranje'} style={{ display: 'flex', width: 40, height: 40 }}>
                {btn.icon}
              </span>
              <span
                className="font-black uppercase leading-tight"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: '1.1rem' }}
              >
                {btn.label}
              </span>
              <span className={`text-xs ${btn.highlight ? 'text-black/70' : 'text-gray-500'}`}>
                {btn.desc}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
