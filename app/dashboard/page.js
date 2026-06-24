'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { supabase } from '@/lib/supabase';

function StatCard({ label, waarde, sub, kleur = '#F27A00', icon }) {
  return (
    <div className="rounded-xl border border-[#1e1e1e] p-5" style={{ backgroundColor: '#141414' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: kleur + '15' }}>
          <span style={{ color: kleur }}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-black" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: kleur }}>{waarde}</p>
      <p className="text-white font-semibold text-sm mt-0.5">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user);
    });
    // Laad events van deze eigenaar
    supabase
      .from('events')
      .select('*')
      .order('datum', { ascending: true })
      .then(({ data }) => { if (data) setEvents(data); });
  }, []);

  const venuenaam = user?.user_metadata?.venue_naam || 'Mijn zaak';
  const naam = user?.user_metadata?.naam || '';

  const komendEvents = events.filter(e => e.datum >= new Date().toISOString().split('T')[0]);

  return (
    <DashboardShell>
      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Welkom */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Welkom{naam ? `, ${naam.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Overzicht van <span className="text-white font-semibold">{venuenaam}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Komende events"
            waarde={komendEvents.length || '0'}
            sub="Gepland deze periode"
            kleur="#F27A00"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
          />
          <StatCard
            label="Paginaweergaven"
            waarde="—"
            sub="Binnenkort beschikbaar"
            kleur="#8b5cf6"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
          />
          <StatCard
            label="Gedeeld via WhatsApp"
            waarde="—"
            sub="Binnenkort beschikbaar"
            kleur="#22c55e"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
          />
          <StatCard
            label="Drankprijzen"
            waarde="—"
            sub="Stel je prijzen in"
            kleur="#F27A00"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
        </div>

        {/* Snelle acties */}
        <div className="mb-10">
          <h2 className="text-xl font-black uppercase mb-4" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Snelle acties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="/dashboard/events/nieuw"
              className="flex items-center gap-4 p-5 rounded-xl border border-[#1e1e1e] hover:border-oranje transition-colors group"
              style={{ backgroundColor: '#141414' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F27A00' }}>
                <svg width="18" height="18" fill="none" stroke="black" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <p className="font-black uppercase text-sm group-hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  Event aanmaken
                </p>
                <p className="text-gray-600 text-xs">Zet een nieuw event online</p>
              </div>
            </a>

            <a href="/dashboard/prijzen"
              className="flex items-center gap-4 p-5 rounded-xl border border-[#1e1e1e] hover:border-oranje transition-colors group"
              style={{ backgroundColor: '#141414' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
                <svg width="18" height="18" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <p className="font-black uppercase text-sm group-hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  Prijzen bijwerken
                </p>
                <p className="text-gray-600 text-xs">Drankprijzen aanpassen</p>
              </div>
            </a>

            <a href="/dashboard/profiel"
              className="flex items-center gap-4 p-5 rounded-xl border border-[#1e1e1e] hover:border-oranje transition-colors group"
              style={{ backgroundColor: '#141414' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
                <svg width="18" height="18" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </div>
              <div>
                <p className="font-black uppercase text-sm group-hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  Profiel bewerken
                </p>
                <p className="text-gray-600 text-xs">Openingstijden & info</p>
              </div>
            </a>
          </div>
        </div>

        {/* Komende events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Mijn events
            </h2>
            <a href="/dashboard/events" className="text-oranje text-sm font-semibold hover:underline">Alle events →</a>
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2a2a2a] p-12 text-center">
              <p className="text-gray-600 text-sm mb-4">Je hebt nog geen events aangemaakt.</p>
              <a href="/dashboard/events/nieuw"
                className="inline-block px-6 py-2.5 rounded-lg font-black uppercase text-sm text-black"
                style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                Eerste event aanmaken →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {komendEvents.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-[#1e1e1e]" style={{ backgroundColor: '#141414' }}>
                  <div>
                    <p className="font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{event.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{event.datum} · {event.tijd}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${event.prijs === 'Gratis' ? 'bg-green-400/10 text-green-400' : 'bg-oranje/10 text-oranje'}`}>
                      {event.prijs}
                    </span>
                    <a href={`/dashboard/events/${event.id}`} className="text-gray-600 hover:text-white transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
