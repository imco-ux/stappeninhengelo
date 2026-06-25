'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

function formatDatum(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

function InfoBlok({ label, waarde, kleur }) {
  return (
    <div className="bg-[#141414] rounded-xl p-4 border border-[#252525]">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-bold text-sm capitalize ${kleur || 'text-white'}`}>{waarde}</p>
    </div>
  );
}

function KnoppenRij({ event, shareText }) {
  const knoppen = event.extra_info?.extra_knoppen?.filter(k => k.label) || [];
  const heeftOudKnop = event.knop_label && event.knop_url && knoppen.length === 0;
  return (
    <div className="flex flex-col gap-3 pt-2">
      {heeftOudKnop && (
        <a href={event.knop_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-wide text-sm hover:opacity-85"
          style={{ backgroundColor: '#F27A00', color: '#000' }}>
          {event.knop_label}
        </a>
      )}
      {knoppen.map((knop, i) => (
        knop.url ? (
          <a key={i} href={knop.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-wide text-sm hover:opacity-85 transition-opacity"
            style={{ backgroundColor: knop.kleur === 'transparent' ? 'transparent' : knop.kleur, color: knop.tekst, border: knop.kleur === 'transparent' ? `2px solid ${knop.tekst}` : 'none' }}>
            {knop.label}
          </a>
        ) : (
          <div key={i}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-wide text-sm"
            style={{ backgroundColor: knop.kleur === 'transparent' ? 'transparent' : knop.kleur, color: knop.tekst, border: knop.kleur === 'transparent' ? `2px solid ${knop.tekst}` : 'none' }}>
            {knop.label}
          </div>
        )
      ))}
      <a href={`whatsapp://send?text=${shareText}`}
        className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-oranje text-oranje font-bold uppercase tracking-wide text-sm hover:bg-oranje hover:text-black transition-colors">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        Nodig vrienden uit
      </a>
      {event.ticket_url && (
        <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#333] text-gray-400 font-bold uppercase tracking-wide text-sm hover:text-white transition-colors">
          Tickets kopen →
        </a>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    async function laad() {
      const { data } = await supabase.from('events').select('*').eq('slug', slug).eq('goedgekeurd', true).single();
      setEvent(data || null);
      if (data?.is_centrumbreed) {
        const { data: sub } = await supabase.from('events').select('*')
          .eq('centrumbreed_id', data.id).eq('centrumbreed_link_goedgekeurd', true).order('datum');
        setSubEvents(sub || []);
      }
      setLaden(false);
    }
    if (slug) laad();
  }, [slug]);

  if (laden) return (
    <main className="min-h-screen bg-black"><Header />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600 text-sm">Laden...</div>
    <Footer /></main>
  );

  if (!event) return (
    <main className="min-h-screen bg-black"><Header />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl font-black uppercase text-white" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Event niet gevonden</p>
        <button onClick={() => router.back()} className="text-oranje text-sm mt-4 inline-block hover:underline">← Terug</button>
      </div>
    <Footer /></main>
  );

  const shareUrl = `https://stappen-in-hengelo.nl/events/${event.slug}`;
  const datumLabel = formatDatum(event.datum);
  const shareText = encodeURIComponent(
    `🍺 Kom je ook stappen?\n📅 ${datumLabel}\n🎉 ${event.title}${event.venue_naam ? ` @ ${event.venue_naam}` : ''}\n⏰ ${event.tijd}\n📍 ${event.adres}\n${event.prijs === 'Gratis' ? '✅ Gratis entree' : `🎟️ ${event.prijs} entree`}\n\nMeer info: ${shareUrl}\n\nVia Stappen In Hengelo 🧡`
  );
  const ei = event.extra_info || {};

  const pixels = (
    <>
      {event.meta_pixel_id && (
        <Script id={`meta-pixel-event-${event.id}`} strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${event.meta_pixel_id}');fbq('track','PageView');
        `}</Script>
      )}
      {event.tiktok_pixel_id && (
        <Script id={`tiktok-pixel-event-${event.id}`} strategy="afterInteractive">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${event.tiktok_pixel_id}');ttq.page();}(window,document,'ttq');
        `}</Script>
      )}
    </>
  );

  // ─── CENTRUMBREED LAYOUT ────────────────────────────────────────────────
  if (event.is_centrumbreed) {
    const bannerFotos = ei.banner_fotos?.filter(Boolean) || [];
    const centrumLogo = ei.centrum_logo_url || null;
    return (
      <main className="min-h-screen bg-black">
        <Header />
        {pixels}

        {/* Hero banner */}
        <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
          {bannerFotos.length > 0 ? (
            <img src={bannerFotos[0]} alt={event.title} className="w-full h-full object-cover" />
          ) : event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a0800 0%, #2a1000 50%, #000 100%)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.85) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-5xl mx-auto">
            <div className="flex items-end gap-5">
              {centrumLogo && (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-oranje/40 bg-[#0d0d0d] flex-shrink-0 shadow-2xl">
                  <img src={centrumLogo} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-oranje/40 text-oranje bg-oranje/10 mb-3">
                  🏙️ Centrumbreed evenement
                </span>
                <h1 className="text-6xl font-black uppercase leading-none text-white drop-shadow-xl" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {event.title}
                </h1>
                <p className="text-gray-300 text-sm mt-1">{datumLabel}{event.venue_naam ? ` · ${event.venue_naam}` : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Extra banner fotos strip */}
        {bannerFotos.length > 1 && (
          <div className="grid grid-cols-3 gap-3 px-4 py-4 max-w-5xl mx-auto">
            {bannerFotos.slice(1).map((foto, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[#252525]" style={{ height: '200px' }}>
                <img src={foto} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 py-8">
          <button onClick={() => router.back()} className="text-gray-500 text-xs uppercase tracking-wide hover:text-oranje transition-colors mb-8 inline-block">
            ← Terug
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info blokken */}
              <div className="grid grid-cols-2 gap-3">
                <InfoBlok label="Datum" waarde={datumLabel} />
                <InfoBlok label="Tijd" waarde={event.tijd} />
                <InfoBlok label="Entree" waarde={event.prijs} kleur={event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'} />
                <InfoBlok label="Leeftijd" waarde={event.leeftijd || '18+'} />
              </div>

              {event.adres && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg width="16" height="16" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(event.adres)}`} target="_blank" rel="noopener noreferrer" className="hover:text-oranje underline underline-offset-2">
                    {event.adres}
                  </a>
                </div>
              )}

              {event.omschrijving && (
                <div className="border-t border-[#1e1e1e] pt-5">
                  <p className="text-gray-300 leading-relaxed">{event.omschrijving}</p>
                </div>
              )}

              {/* Extra secties */}
              {ei.extra_secties?.filter(s => s.titel || s.tekst).map((sectie, i) => (
                <div key={i} className="border-t border-[#1e1e1e] pt-5">
                  {sectie.titel && <h2 className="text-2xl font-black uppercase mb-3" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{sectie.titel}</h2>}
                  {sectie.tekst && <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{sectie.tekst}</p>}
                </div>
              ))}

              {/* Artiesten */}
              {ei.artiesten && (
                <div className="border-t border-[#1e1e1e] pt-5">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Line-up / Artiesten</p>
                  <div className="space-y-2">
                    {ei.artiesten.split(',').map(a => a.trim()).filter(Boolean).map((artiest, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#141414] border border-[#252525] rounded-xl px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-oranje/10 border border-oranje/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-oranje text-xs font-black">{i + 1}</span>
                        </div>
                        <span className="text-white text-sm font-bold">{artiest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Genres */}
              {ei.genres?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Muziek</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ei.genres.map(g => <span key={g} className="px-2.5 py-1 rounded-full text-xs font-bold border border-oranje/30 text-oranje/80 bg-oranje/5">{g}</span>)}
                  </div>
                </div>
              )}

              {/* Sub-events van locaties */}
              {subEvents.length > 0 && (
                <div className="border-t border-[#1e1e1e] pt-5">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-4">Events van deelnemende locaties</p>
                  <div className="space-y-3">
                    {subEvents.map(se => (
                      <a key={se.id} href={`/events/${se.slug}`}
                        className="flex items-center gap-4 bg-[#141414] border border-[#252525] rounded-xl p-4 hover:border-oranje transition-colors group">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#333] bg-[#0d0d0d] flex-shrink-0 flex items-center justify-center">
                          {se.poster_url
                            ? <img src={se.poster_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-lg font-black text-gray-700" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{se.title?.charAt(0)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-sm uppercase group-hover:text-oranje transition-colors" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{se.title}</p>
                          <p className="text-xs text-gray-500">{se.venue_naam} · {se.tijd} · <span className={se.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}>{se.prijs}</span></p>
                        </div>
                        <svg width="16" height="16" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket embed */}
              {event.ticket_shortcode && (
                <div className="border-t border-[#1e1e1e] pt-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Tickets</p>
                  <div className="rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: event.ticket_shortcode }} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Deelnemende locaties */}
              {ei.deelnemende_venues?.length > 0 && (
                <div className="bg-[#141414] border border-[#252525] rounded-2xl p-5">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Deelnemende locaties</p>
                  <div className="space-y-2">
                    {ei.deelnemende_venues.map((naam, i) => (
                      <a key={i} href={`/locaties/${naam.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`}
                        className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-oranje flex-shrink-0" />
                        <span className="text-white text-sm font-bold group-hover:text-oranje transition-colors">{naam}</span>
                        <svg width="10" height="10" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><path d="M9 18l6-6-6-6"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="bg-[#141414] border border-[#252525] rounded-2xl p-5">
                <KnoppenRij event={event} shareText={shareText} />
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  // ─── NORMAAL EVENT LAYOUT ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black">
      <Header />
      {pixels}

      {/* Poster bovenaan */}
      <div className="relative w-full bg-[#0d0d0d] aspect-[4/5] max-h-[85vh] overflow-hidden">
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0800 0%, #000 100%)' }}>
            <img src="/images/logo-small.png" alt="" className="w-24 h-24 object-contain opacity-20" />
          </div>
        )}
        {/* Kruisje rechtsboven */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          aria-label="Sluiten"
        >
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        {/* 18+ badge linksboven */}
        {event.leeftijd && (
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            {event.leeftijd}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 sm:pb-10">

        <div className="space-y-4">
          <div>
            <p className="text-oranje font-bold text-sm uppercase tracking-wide mb-1">{event.venue_naam}{event.type ? ` · ${event.type}` : ''}</p>
            <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{event.title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoBlok label="Datum" waarde={datumLabel} />
            <InfoBlok label="Tijd" waarde={event.tijd} />
            <InfoBlok label="Entree" waarde={event.prijs} kleur={event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'} />
            <InfoBlok label="Leeftijd" waarde={event.leeftijd || '18+'} />
          </div>

          {event.adres && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg width="16" height="16" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
              </svg>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(event.adres)}`} target="_blank" rel="noopener noreferrer" className="hover:text-oranje underline underline-offset-2">
                {event.adres}
              </a>
            </div>
          )}

          {(ei.artiesten || ei.verwacht_bezoekers || ei.genres?.length > 0 || ei.publiek?.length > 0) && (
            <div className="border-t border-[#1e1e1e] pt-4 space-y-4">
              {ei.artiesten && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Line-up / Artiesten</p>
                  <div className="space-y-2">
                    {ei.artiesten.split(',').map(a => a.trim()).filter(Boolean).map((artiest, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#141414] border border-[#252525] rounded-xl px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-oranje/10 border border-oranje/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-oranje text-xs font-black">{i + 1}</span>
                        </div>
                        <span className="text-white text-sm font-bold">{artiest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ei.verwacht_bezoekers && (
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span className="text-gray-400 text-sm">{ei.verwacht_bezoekers} verwachte bezoekers</span>
                </div>
              )}
              {ei.genres?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Muziek</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ei.genres.map(g => <span key={g} className="px-2.5 py-1 rounded-full text-xs font-bold border border-oranje/30 text-oranje/80 bg-oranje/5">{g}</span>)}
                  </div>
                </div>
              )}
              {ei.publiek?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Publiek</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ei.publiek.map(p => <span key={p} className="px-2.5 py-1 rounded-full text-xs font-bold border border-[#333] text-gray-400">{p}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {ei.deelnemende_venues?.length > 0 && (
            <div className="border-t border-[#1e1e1e] pt-4">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Deelnemende locaties</p>
              <div className="grid grid-cols-2 gap-2">
                {ei.deelnemende_venues.map((naam, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#141414] border border-[#252525] rounded-xl px-3 py-2.5">
                    <div className="w-2 h-2 rounded-full bg-oranje flex-shrink-0" />
                    <span className="text-white text-sm font-bold">{naam}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ei.extra_secties?.filter(s => s.titel || s.tekst).map((sectie, i) => (
            <div key={i} className="border-t border-[#1e1e1e] pt-4">
              {sectie.titel && <p className="text-white font-black text-lg uppercase mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{sectie.titel}</p>}
              {sectie.tekst && <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{sectie.tekst}</p>}
            </div>
          ))}

          {event.omschrijving && (
            <p className="text-gray-300 leading-relaxed border-t border-[#1e1e1e] pt-4">{event.omschrijving}</p>
          )}

          {event.ticket_shortcode && (
            <div className="border-t border-[#1e1e1e] pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Tickets</p>
              <div className="rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: event.ticket_shortcode }} />
            </div>
          )}

          <KnoppenRij event={event} shareText={shareText} />
        </div>
      </div>

      {/* Grote sluit-knop onderaan — alleen mobiel */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:hidden z-40"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 60%, transparent 100%)' }}>
        <button
          onClick={() => router.back()}
          className="w-full py-4 rounded-2xl font-black uppercase text-base text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Sluiten
        </button>
      </div>

      <Footer />
    </main>
  );
}
