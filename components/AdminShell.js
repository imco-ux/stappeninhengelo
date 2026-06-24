'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMINS = ['info@imcoruin.nl'];

const navItems = [
  {
    href: '/dashboard/admin',
    label: 'Overzicht',
    exact: true,
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    href: '/dashboard/admin/events',
    label: 'Events',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: '/dashboard/admin/locaties',
    label: 'Locaties',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  },
  {
    href: '/dashboard/admin/prijzen',
    label: 'Drankprijzen',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-3"/><path d="M8 3a2 2 0 002 2h4a2 2 0 002-2"/><path d="M12 12v4M10 14h4"/></svg>,
  },
  {
    href: '/dashboard/admin/kroegentocht',
    label: 'Kroegentocht',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  },
  {
    href: '/dashboard/admin/nieuws',
    label: 'Nieuws',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v12H4z"/><path d="M4 8h16M8 4v12"/></svg>,
  },
  {
    href: '/dashboard/admin/acties',
    label: 'Acties',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  },
  {
    href: '/dashboard/admin/gebruikers',
    label: 'Gebruikers',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/dashboard/admin/archief',
    label: 'Archief',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>,
  },
  {
    href: '/dashboard/admin/notificaties',
    label: 'Notificaties',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [toegang, setToegang] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) { window.location.href = '/dashboard/login'; return; }
      if (!ADMINS.includes(user.email) && user.user_metadata?.rol !== 'admin') {
        setToegang(false); return;
      }
      setToegang(true);
    });
  }, []);

  if (toegang === false) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-center">
        <p className="text-red-500 font-bold text-xl mb-2">Geen toegang</p>
        <a href="/dashboard" className="text-oranje text-sm">← Terug naar dashboard</a>
      </div>
    </div>
  );

  if (toegang === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-gray-600 text-sm">Laden...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Sidebar */}
      <aside className="w-56 border-r border-[#1a1a1a] fixed top-0 left-0 h-full flex flex-col z-30" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="px-4 py-4 border-b border-[#1a1a1a]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Stappen In Hengelo</p>
          <p className="font-black uppercase text-sm" style={{ color: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Admin Paneel
          </p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(item => {
            const actief = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <a key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: actief ? '#F27A00' : 'transparent',
                  color: actief ? 'black' : '#666',
                }}
                onMouseEnter={e => { if (!actief) { e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.color = 'white'; }}}
                onMouseLeave={e => { if (!actief) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#666'; }}}>
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-[#1a1a1a] space-y-0.5">
          <a href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 transition-colors"
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Partner Dashboard
          </a>
          <a href="/" target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 transition-colors"
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Bekijk website
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
