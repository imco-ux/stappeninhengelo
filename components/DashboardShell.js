'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

// Globale context zodat pagina's weten welke venue actief is
export const VenueContext = createContext(null);
export function useActieveVenue() { return useContext(VenueContext); }

const navItems = [
  {
    href: '/dashboard',
    label: 'Overzicht',
    exact: true,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    href: '/dashboard/events',
    label: 'Mijn Events',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: '/dashboard/prijzen',
    label: 'Drankprijzen',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  {
    href: '/dashboard/acties',
    label: 'Acties & Deals',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  },
  {
    href: '/dashboard/profiel',
    label: 'Mijn Profiel',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  },
];

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [user, setUser]           = useState(null);
  const [venues, setVenues]       = useState([]);
  const [actieveVenue, setActieveVenue] = useState(null);
  const [toonVenuePicker, setToonVenuePicker] = useState(false);
  const [mobielMenu, setMobielMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        window.location.href = '/dashboard/login';
        return;
      }
      setUser(data.user);

      const { data: venueData } = await supabase
        .from('venues').select('id,naam,logo_url').eq('eigenaar_id', data.user.id).order('naam');
      const lijst = venueData || [];
      setVenues(lijst);

      // Herstel eerder gekozen venue uit sessionStorage
      const opgeslagenId = sessionStorage.getItem('actieveVenueId');
      const gevonden = lijst.find(v => v.id === opgeslagenId) || lijst[0] || null;
      setActieveVenue(gevonden);
    });
  }, []);

  function kiesVenue(v) {
    setActieveVenue(v);
    sessionStorage.setItem('actieveVenueId', v.id);
    setToonVenuePicker(false);
  }

  async function uitloggen() {
    await supabase.auth.signOut();
    window.location.href = '/dashboard/login';
  }

  const naam = user?.user_metadata?.voornaam
    ? `${user.user_metadata.voornaam} ${user.user_metadata.achternaam || ''}`.trim()
    : user?.user_metadata?.naam || '';
  const initiaal = (naam || user?.email || 'U').charAt(0).toUpperCase();
  const isAdmin = ['info@imcoruin.nl'].includes(user?.email) || user?.user_metadata?.rol === 'admin';

  const VenueBadge = () => (
    <div className="px-4 py-4 border-b border-[#1a1a1a] relative">
      <button
        onClick={() => setToonVenuePicker(p => !p)}
        className="w-full flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] rounded-xl px-3 py-3 transition-colors text-left group"
      >
        {/* Logo of initiaal */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-sm text-black"
          style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
          {actieveVenue?.logo_url
            ? <img src={actieveVenue.logo_url} alt="" className="w-full h-full object-cover" />
            : (actieveVenue?.naam || naam || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{actieveVenue?.naam || 'Geen zaak'}</p>
          <p className="text-gray-600 text-xs truncate">{naam || user?.email}</p>
        </div>
        {venues.length > 1 && (
          <svg className={`flex-shrink-0 transition-transform ${toonVenuePicker ? 'rotate-180' : ''}`}
            width="14" height="14" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {toonVenuePicker && venues.length > 1 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setToonVenuePicker(false)} />
          <div className="absolute left-4 right-4 top-full mt-1 z-50 rounded-xl border border-[#2a2a2a] bg-[#141414] shadow-2xl overflow-hidden">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest px-4 pt-3 pb-2">Kies een zaak</p>
            {venues.map(v => (
              <button key={v.id} onClick={() => kiesVenue(v)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e1e] transition-colors text-left border-t border-[#1a1a1a] ${
                  actieveVenue?.id === v.id ? 'bg-[#1e1e1e]' : ''
                }`}>
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-black text-black"
                  style={{ backgroundColor: '#F27A00' }}>
                  {v.logo_url
                    ? <img src={v.logo_url} alt="" className="w-full h-full object-cover" />
                    : v.naam.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-white">{v.naam}</span>
                {actieveVenue?.id === v.id && (
                  <svg className="ml-auto flex-shrink-0" width="14" height="14" fill="none" stroke="#F27A00" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <VenueContext.Provider value={actieveVenue}>
      <div className="flex min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>

        {/* ── Sidebar desktop ── */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#1a1a1a] fixed top-0 left-0 h-full z-30" style={{ backgroundColor: '#0f0f0f' }}>

          {/* Logo */}
          <div className="px-6 py-5 border-b border-[#1a1a1a]">
            <a href="/" className="flex items-center gap-3">
              <img src="/images/logo-small.png" alt="" className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-xs font-black uppercase" style={{ color: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif", letterSpacing: '0.05em' }}>
                  Stappen In Hengelo
                </p>
                <p className="text-[10px] text-gray-600">Partner Dashboard</p>
              </div>
            </a>
          </div>

          {/* Venue badge / switcher */}
          <VenueBadge />

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(item => {
              const actief = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <a key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    actief ? 'text-black' : 'text-gray-500 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                  style={actief ? { backgroundColor: '#F27A00' } : {}}>
                  {item.icon}
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Onderin */}
          <div className="px-3 py-4 border-t border-[#1a1a1a] space-y-1">
            {isAdmin && (
              <a href="/dashboard/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-yellow-500 hover:bg-yellow-950/30 transition-all">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin Paneel
              </a>
            )}
            <a href="/" target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-white hover:bg-[#1a1a1a] transition-all">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Bekijk website
            </a>
            <button onClick={uitloggen}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-red-400 hover:bg-red-950/20 transition-all">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Uitloggen
            </button>
          </div>
        </aside>

        {/* ── Mobiele topbar ── */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]" style={{ backgroundColor: '#0f0f0f' }}>
          <div className="flex items-center gap-2">
            <img src="/images/logo-small.png" alt="" className="w-7 h-7 rounded-full" />
            <span className="text-sm font-black uppercase" style={{ color: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>Dashboard</span>
          </div>
          <button onClick={() => setMobielMenu(!mobielMenu)} className="text-gray-400 hover:text-white">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobielMenu ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M3 12h18M3 6h18M3 18h18"/></>}
            </svg>
          </button>
        </div>

        {mobielMenu && (
          <div className="md:hidden fixed top-[57px] left-0 right-0 z-30 border-b border-[#1a1a1a] shadow-xl" style={{ backgroundColor: '#0f0f0f' }}>
            {venues.length > 1 && (
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Actieve zaak</p>
                <div className="flex gap-2 flex-wrap">
                  {venues.map(v => (
                    <button key={v.id} onClick={() => { kiesVenue(v); setMobielMenu(false); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        actieveVenue?.id === v.id ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400'
                      }`}>
                      {v.naam}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {navItems.map(item => {
              const actief = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <a key={item.href} href={item.href} onClick={() => setMobielMenu(false)}
                  className={`flex items-center gap-3 px-5 py-3.5 text-sm font-semibold border-b border-[#1a1a1a] ${actief ? 'text-oranje' : 'text-gray-400'}`}>
                  {item.icon}{item.label}
                </a>
              );
            })}
            <button onClick={uitloggen} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-red-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Uitloggen
            </button>
          </div>
        )}

        {/* ── Hoofd content ── */}
        <main className="flex-1 md:ml-64 pt-[57px] md:pt-0">
          {children}
        </main>
      </div>
    </VenueContext.Provider>
  );
}
