const dagKleur = {
  Vrijdag:  'bg-oranje text-black',
  Zaterdag: 'bg-oranje text-black',
  Zondag:   'bg-[#333] text-white',
};

const typeKleur = {
  Feestcafé: 'border-oranje text-oranje',
  Club:       'border-purple-500 text-purple-400',
  Karaoke:    'border-pink-500 text-pink-400',
  Live:       'border-green-500 text-green-400',
};

export default function EventCard({ event }) {
  const dagClass = dagKleur[event.dag] || 'bg-[#333] text-white';
  const typeClass = typeKleur[event.type] || 'border-gray-500 text-gray-400';

  return (
    <div className="bg-[#181818] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-oranje transition-colors group flex flex-col">

      {/* Poster placeholder */}
      <div
        className="relative w-full border-b-2 border-[#F27A00]/30 group-hover:border-[#F27A00] transition-colors flex items-center justify-center bg-[#0d0d0d]"
        style={{ aspectRatio: '3/4', maxHeight: '220px' }}
      >
        {event.posterUrl ? (
          <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <img
            src="/images/logo-small.png"
            alt="Stappen In Hengelo"
            className="w-16 h-16 object-contain opacity-30"
          />
        )}
        <span className={`absolute top-3 left-3 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${dagClass}`}>
          {event.dag}
        </span>
        {event.leeftijd && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded bg-black/60 text-white border border-white/20">
            {event.leeftijd}
          </span>
        )}
      </div>

      {/* Type badge */}
      <div className="flex items-center justify-end px-4 pt-4 pb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded border ${typeClass}`}>
          {event.type}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 flex flex-col flex-1 gap-1">
        <h3
          className="text-2xl font-black uppercase leading-tight group-hover:text-oranje transition-colors"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          {event.title}
        </h3>
        <p className="text-gray-400 text-sm font-medium">{event.venue}</p>

        {/* Tijd */}
        <div className="flex items-center gap-1 mt-1">
          <svg width="13" height="13" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span className="text-gray-500 text-sm">{event.tijd}</span>
        </div>

        {/* Adres */}
        {event.adres && (
          <div className="flex items-center gap-1">
            <svg width="13" height="13" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span className="text-gray-500 text-xs">{event.adres}</span>
          </div>
        )}

        {/* Prijs */}
        {event.prijs && (
          <div className="flex items-center gap-1">
            <svg width="13" height="13" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className={`text-xs font-semibold ${event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}`}>
              {event.prijs}
            </span>
          </div>
        )}

        {/* Ticket knop */}
        <div className="mt-auto pt-4">
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm font-bold uppercase tracking-wide py-2.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F27A00', color: '#000' }}
            >
              Tickets →
            </a>
          ) : (
            <span className="block w-full text-center text-sm font-medium uppercase tracking-wide py-2.5 rounded-lg border border-[#333] text-green-400">
              Gratis entree
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
