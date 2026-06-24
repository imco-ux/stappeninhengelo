'use client';

const dagKleur = {
  Vrijdag:  'bg-oranje text-black',
  Zaterdag: 'bg-oranje text-black',
  Zondag:   'bg-[#333] text-white',
};

const typeKleur = {
  Feestcafé: 'text-oranje border-oranje',
  Club:       'text-purple-400 border-purple-500',
  Karaoke:    'text-pink-400 border-pink-500',
  Live:       'text-green-400 border-green-500',
};

function CarouselCard({ event }) {
  const dagClass = dagKleur[event.dag] || 'bg-[#333] text-white';
  const typeClass = typeKleur[event.type] || 'text-gray-400 border-gray-500';

  return (
    <div
      className="flex-shrink-0 bg-[#181818] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-oranje transition-colors group"
      style={{ width: '260px' }}
    >
      {/* Poster */}
      <div
        className="relative w-full flex items-center justify-center bg-[#0d0d0d] border-b-2 border-[#F27A00]/20 group-hover:border-[#F27A00] transition-colors"
        style={{ height: '180px' }}
      >
        {event.posterUrl ? (
          <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <img src="/images/logo-small.png" alt="" className="w-12 h-12 object-contain opacity-25" />
        )}
        <span className={`absolute top-2 left-2 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${dagClass}`}>
          {event.dag}
        </span>
        {event.leeftijd && (
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded bg-black/70 text-white border border-white/20">
            {event.leeftijd}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        {/* Type */}
        <span className={`text-xs font-semibold uppercase tracking-wide border px-2 py-0.5 rounded self-start ${typeClass}`}>
          {event.type}
        </span>

        <h3
          className="text-xl font-black uppercase leading-tight group-hover:text-oranje transition-colors line-clamp-2"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          {event.title}
        </h3>

        <p className="text-gray-400 text-sm font-medium">{event.venue}</p>

        <div className="flex items-center gap-1">
          <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span className="text-gray-500 text-xs">{event.tijd}</span>
        </div>

        {event.adres && (
          <div className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span className="text-gray-500 text-xs truncate">{event.adres}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
          <span className={`text-xs font-bold ${event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}`}>
            {event.prijs || 'Gratis'}
          </span>
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase px-3 py-1 rounded transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#F27A00', color: '#000' }}
              onClick={(e) => e.stopPropagation()}
            >
              Tickets →
            </a>
          ) : (
            <span className="text-xs font-medium text-green-400 border border-green-400/30 px-3 py-1 rounded">
              Vrij toegang
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventCarousel({ events }) {
  if (!events || events.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...events, ...events];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #000, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #000, transparent)' }} />

      <div
        className="flex gap-4 carousel-track"
        style={{ width: 'max-content' }}
      >
        {doubled.map((event, i) => (
          <CarouselCard key={`${event._id}-${i}`} event={event} />
        ))}
      </div>
    </div>
  );
}
