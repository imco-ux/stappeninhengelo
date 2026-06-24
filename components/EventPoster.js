// Event poster altijd in 4:5 verhouding
const typeKleurDot = {
  Feestcafé: '#F27A00',
  Club:       '#a855f7',
  Karaoke:    '#ec4899',
  Live:       '#22c55e',
  Quiz:       '#3b82f6',
  Borrel:     '#eab308',
  Festival:   '#ef4444',
};

export default function EventPoster({ src, alt = '', leeftijd, type }) {
  const kleur = typeKleurDot[type] || '#888';

  return (
    <div className="relative w-full overflow-hidden bg-[#0d0d0d]" style={{ aspectRatio: '4 / 5' }}>
      {src ? (
        <>
          <img src={src} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-60" />
          <div className="absolute inset-0 bg-black/30" />
          <img src={src} alt={alt}
            className="absolute inset-0 w-full h-full object-contain" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/images/logo-small.png" alt="" className="w-12 h-12 object-contain opacity-15" />
        </div>
      )}

      {/* Leeftijd badge rechts */}
      {leeftijd && (
        <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/10 z-10">
          {leeftijd}
        </span>
      )}

    </div>
  );
}
