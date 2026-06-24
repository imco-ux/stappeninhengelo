'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

export default function AdminOverzicht() {
  const [stats, setStats] = useState({ events: 0, venues: 0, nieuws: 0, claims: 0, pending: 0 });

  useEffect(() => {
    async function laad() {
      const [ev, ve, ni, cl] = await Promise.all([
        supabase.from('events').select('id, goedgekeurd'),
        supabase.from('venues').select('id'),
        supabase.from('nieuws').select('id'),
        supabase.from('venue_claims').select('id, status'),
      ]);
      setStats({
        events:  ev.data?.length || 0,
        venues:  ve.data?.length || 0,
        nieuws:  ni.data?.length || 0,
        claims:  cl.data?.length || 0,
        pending: (ev.data?.filter(e => !e.goedgekeurd).length || 0) + (cl.data?.filter(c => c.status === 'pending').length || 0),
      });
    }
    laad();
  }, []);

  const secties = [
    { href: '/dashboard/admin/events',       label: 'Events beheren',       sub: `${stats.events} events`,       kleur: '#F27A00', icon: '📅' },
    { href: '/dashboard/admin/locaties',     label: 'Locaties beheren',     sub: `${stats.venues} locaties`,     kleur: '#3b82f6', icon: '📍' },
    { href: '/dashboard/admin/prijzen',      label: 'Drankprijzen',         sub: 'Per venue instellen',          kleur: '#10b981', icon: '🍺' },
    { href: '/dashboard/admin/kroegentocht', label: 'Kroegentocht',         sub: 'Route & stops beheren',        kleur: '#8b5cf6', icon: '🗺️' },
    { href: '/dashboard/admin/nieuws',       label: 'Nieuws & Highlights',  sub: `${stats.nieuws} berichten`,    kleur: '#f59e0b', icon: '📰' },
  ];

  return (
    <AdminShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Overzicht</h1>
          <p className="text-gray-500 text-sm mt-1">Beheer alle content van Stappen In Hengelo.</p>
        </div>

        {stats.pending > 0 && (
          <div className="mb-6 rounded-xl border border-yellow-800/40 bg-yellow-950/20 px-5 py-4 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-bold text-sm">{stats.pending} item{stats.pending > 1 ? 's' : ''} wacht{stats.pending === 1 ? '' : 'en'} op goedkeuring</p>
              <a href="/dashboard/admin/events" className="text-yellow-600 text-xs hover:text-yellow-400">Bekijk events →</a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {secties.map(s => (
            <a key={s.href} href={s.href}
              className="rounded-xl border border-[#1e1e1e] p-6 flex items-center gap-4 transition-all hover:border-[#333]"
              style={{ backgroundColor: '#141414' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: s.kleur + '20' }}>
                {s.icon}
              </div>
              <div>
                <p className="font-bold text-white">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
              </div>
              <svg className="ml-auto text-gray-700" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </a>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
