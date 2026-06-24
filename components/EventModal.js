'use client';

import { useEffect, useRef } from 'react';

const typeKleur = {
  Feestcafé: 'border-oranje text-oranje',
  Club:       'border-purple-500 text-purple-400',
  Karaoke:    'border-pink-500 text-pink-400',
  Live:       'border-green-500 text-green-400',
};

export default function EventModal({ event, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  function nodigVriendIn() {
    const eventUrl = `${window.location.origin}/events/${event.slug}`;
    const bericht =
      `🍺 Kom je ook stappen in Hengelo?\n\n` +
      `📅 ${event.datumLabel}\n` +
      `🎉 ${event.title} @ ${event.venue}\n` +
      `⏰ ${event.tijd}\n` +
      `📍 ${event.adres}\n` +
      (event.prijs === 'Gratis' ? `✅ Gratis entree\n` : `🎟️ ${event.prijs} entree\n`) +
      `\nMeer info: ${eventUrl}\n\nVia Stappen In Hengelo 🧡`;
    navigator.clipboard.writeText(bericht).then(() => {
      alert('Bericht gekopieerd! Plak het in WhatsApp of Instagram om je vrienden uit te nodigen. 📱');
    }).catch(() => {
      prompt('Kopieer dit bericht:', bericht);
    });
  }

  if (!event) return null;

  const tc = typeKleur[event.type] || 'border-gray-500 text-gray-400';
  const venueSlug = event.venueSlug || (event.venue
    ? event.venue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : null);

  const ei = event.extra_info || {};
  const artiesten = ei.artiesten || event.artiesten || null;
  const genres = ei.genres?.length ? ei.genres : (event.genres?.length ? event.genres : null);
  const publiek = ei.publiek?.length ? ei.publiek : (event.publiek?.length ? event.publiek : null);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[#2a2a2a] flex flex-col"
        style={{ backgroundColor: '#141414' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poster – 4:5 formaat */}
        <div className="relative w-full bg-[#0d0d0d] border-b-2 border-[#F27A00]/30 overflow-hidden" style={{ aspectRatio: '4 / 5', maxHeight: '55vh' }}>
          {event.posterUrl ? (
            <>
              <img src={event.posterUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-50" />
              <div className="absolute inset-0 bg-black/20" />
              <img src={event.posterUrl} alt={event.title} className="absolute inset-0 w-full h-full object-contain" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/images/logo-small.png" alt="" className="w-20 h-20 object-contain opacity-20" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-colors border border-white/10 z-10"
            aria-label="Sluiten"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {event.leeftijd && (
            <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded bg-black/70 text-white border border-white/20 z-10">
              {event.leeftijd}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Type + title */}
          <div>
            <span className={`text-xs font-semibold uppercase border px-2 py-0.5 rounded ${tc} mb-2 inline-block`}>
              {event.type}
            </span>
            <h2 className="text-4xl font-black uppercase leading-tight" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {event.title}
            </h2>
            <p className="text-oranje font-semibold text-sm mt-0.5">{event.venue}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1e1e1e] rounded-xl p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Datum</p>
              <p className="text-white font-semibold text-sm capitalize">{event.datumLabel}</p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Tijd</p>
              <p className="text-white font-semibold text-sm">{event.tijd}</p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Entree</p>
              <p className={`font-bold text-sm ${event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}`}>
                {event.prijs}
              </p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Leeftijd</p>
              <p className="text-white font-semibold text-sm">{event.leeftijd || '18+'}</p>
            </div>
          </div>

          {/* Artiesten / Line-up + bezoekers */}
          {(artiesten || ei.verwacht_bezoekers) && (
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#252525] space-y-2">
              {artiesten && (
                <>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Line-up / Artiesten</p>
                  <p className="text-white text-sm font-semibold">{artiesten}</p>
                </>
              )}
              {ei.verwacht_bezoekers && (
                <div className="flex items-center gap-2 pt-1">
                  <svg width="13" height="13" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span className="text-gray-400 text-xs">{ei.verwacht_bezoekers} verwachte bezoekers</span>
                </div>
              )}
            </div>
          )}

          {/* Genres */}
          {genres && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Muziek</p>
              <div className="flex flex-wrap gap-1.5">
                {genres.map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-full text-xs font-bold border border-oranje/30 text-oranje/80 bg-oranje/5">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Publiek */}
          {publiek && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Publiek</p>
              <div className="flex flex-wrap gap-1.5">
                {publiek.map(p => (
                  <span key={p} className="px-2.5 py-1 rounded-full text-xs font-bold border border-[#333] text-gray-400">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Locatie kaart */}
          {event.venue && (
            <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#333] bg-[#111] flex-shrink-0 flex items-center justify-center">
                  {event.venueLogo
                    ? <img src={event.venueLogo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-lg font-black text-gray-600">{event.venue.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Locatie</p>
                  <p className="font-bold text-white text-sm">{event.venue}</p>
                  {event.adres && <p className="text-xs text-gray-500 truncate">{event.adres}</p>}
                </div>
                {venueSlug && (
                  <a href={`/locaties/${venueSlug}`}
                    className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border border-oranje text-oranje hover:bg-oranje hover:text-black transition-colors">
                    Bekijk →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Adres */}
          {event.adres && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg width="16" height="16" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(event.adres)}`}
                target="_blank" rel="noopener noreferrer"
                className="hover:text-oranje transition-colors underline underline-offset-2">
                {event.adres}
              </a>
            </div>
          )}

          {/* Omschrijving */}
          {event.omschrijving && (
            <p className="text-gray-300 text-sm leading-relaxed border-t border-[#2a2a2a] pt-4">
              {event.omschrijving}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Eigen knop */}
            {event.knop_label && event.knop_url && (
              <a href={event.knop_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-wide text-sm hover:opacity-85"
                style={{ backgroundColor: '#F27A00', color: '#000' }}>
                {event.knop_label}
              </a>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={nodigVriendIn}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-oranje text-oranje font-bold uppercase tracking-wide text-sm hover:bg-oranje hover:text-black transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                Nodig vrienden uit
              </button>

              {event.ticket_url || event.ticketUrl ? (
                <a
                  href={event.ticket_url || event.ticketUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-wide text-sm transition-opacity hover:opacity-85"
                  style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
                >
                  Tickets kopen →
                </a>
              ) : (
                <span className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-green-400/40 text-green-400 font-bold uppercase tracking-wide text-sm">
                  ✓ Gratis entree
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
