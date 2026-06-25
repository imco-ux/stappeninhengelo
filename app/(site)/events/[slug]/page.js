'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

function formatDatum(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    async function laad() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('goedgekeurd', true)
        .single();
      setEvent(data || null);
      setLaden(false);
    }
    if (slug) laad();
  }, [slug]);

  if (laden) return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600 text-sm">Laden...</div>
      <Footer />
    </main>
  );

  if (!event) return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl font-black uppercase text-white" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Event niet gevonden</p>
        <a href="/agenda" className="text-oranje text-sm mt-4 inline-block hover:underline">← Terug naar agenda</a>
      </div>
      <Footer />
    </main>
  );

  const shareUrl = `https://stappen-in-hengelo.nl/events/${event.slug}`;
  const datumLabel = formatDatum(event.datum);
  const shareText = encodeURIComponent(
    `🍺 Kom je ook stappen?\n📅 ${datumLabel}\n🎉 ${event.title} @ ${event.venue_naam || ''}\n⏰ ${event.tijd}\n📍 ${event.adres}\n${event.prijs === 'Gratis' ? '✅ Gratis entree' : `🎟️ ${event.prijs} entree`}\n\nMeer info: ${shareUrl}\n\nVia Stappen In Hengelo 🧡`
  );

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Meta Pixel */}
      {event.meta_pixel_id && (
        <Script id={`meta-pixel-event-${event.id}`} strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${event.meta_pixel_id}');fbq('track','PageView');
        `}</Script>
      )}

      {/* TikTok Pixel */}
      {event.tiktok_pixel_id && (
        <Script id={`tiktok-pixel-event-${event.id}`} strategy="afterInteractive">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${event.tiktok_pixel_id}');ttq.page();}(window,document,'ttq');
        `}</Script>
      )}

      <div className="max-w-2xl mx-auto px-4 py-10">
        <a href="/agenda" className="text-gray-500 text-xs uppercase tracking-wide hover:text-oranje transition-colors mb-6 inline-block">
          ← Terug naar agenda
        </a>

        {/* Poster */}
        <div className="w-full flex items-center justify-center bg-[#0d0d0d] rounded-2xl border-2 border-[#F27A00]/30 mb-6 overflow-hidden" style={{ height: '260px' }}>
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <img src="/images/logo-small.png" alt="" className="w-24 h-24 object-contain opacity-20" />
          )}
        </div>

        {/* Event info */}
        <div className="space-y-4">
          <div>
            <p className="text-oranje font-bold text-sm uppercase tracking-wide mb-1">{event.venue_naam} · {event.type}</p>
            <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {event.title}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Datum', waarde: datumLabel },
              { label: 'Tijd', waarde: event.tijd },
              { label: 'Entree', waarde: event.prijs, kleur: event.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje' },
              { label: 'Leeftijd', waarde: event.leeftijd || '18+' },
            ].map((item) => (
              <div key={item.label} className="bg-[#141414] rounded-xl p-4 border border-[#252525]">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{item.label}</p>
                <p className={`font-bold text-sm capitalize ${item.kleur || 'text-white'}`}>{item.waarde}</p>
              </div>
            ))}
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

          {/* Artiesten, genres, publiek, bezoekers */}
          {(event.extra_info?.artiesten || event.extra_info?.verwacht_bezoekers || event.extra_info?.genres?.length > 0 || event.extra_info?.publiek?.length > 0) && (
            <div className="border-t border-[#1e1e1e] pt-4 space-y-4">
              {event.extra_info?.artiesten && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Line-up / Artiesten</p>
                  <div className="space-y-2">
                    {event.extra_info.artiesten.split(',').map(a => a.trim()).filter(Boolean).map((artiest, i) => (
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
              {event.extra_info?.verwacht_bezoekers && (
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" stroke="#F27A00" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span className="text-gray-400 text-sm">{event.extra_info.verwacht_bezoekers} verwachte bezoekers</span>
                </div>
              )}
              {event.extra_info?.genres?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Muziek</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.extra_info.genres.map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-full text-xs font-bold border border-oranje/30 text-oranje/80 bg-oranje/5">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {event.extra_info?.publiek?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Publiek</p>
                  <div className="flex flex-wrap gap-1.5">
                    {event.extra_info.publiek.map(p => (
                      <span key={p} className="px-2.5 py-1 rounded-full text-xs font-bold border border-[#333] text-gray-400">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deelnemende locaties */}
          {event.extra_info?.deelnemende_venues?.length > 0 && (
            <div className="border-t border-[#1e1e1e] pt-4">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Deelnemende locaties</p>
              <div className="grid grid-cols-2 gap-2">
                {event.extra_info.deelnemende_venues.map((naam, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#141414] border border-[#252525] rounded-xl px-3 py-2.5">
                    <div className="w-2 h-2 rounded-full bg-oranje flex-shrink-0" />
                    <span className="text-white text-sm font-bold">{naam}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra content secties */}
          {event.extra_info?.extra_secties?.filter(s => s.titel || s.tekst).map((sectie, i) => (
            <div key={i} className="border-t border-[#1e1e1e] pt-4">
              {sectie.titel && (
                <p className="text-white font-black text-lg uppercase mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{sectie.titel}</p>
              )}
              {sectie.tekst && (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{sectie.tekst}</p>
              )}
            </div>
          ))}

          {event.omschrijving && (
            <p className="text-gray-300 leading-relaxed border-t border-[#1e1e1e] pt-4">{event.omschrijving}</p>
          )}

          {/* Ticketshop embed */}
          {event.ticket_shortcode && (
            <div className="border-t border-[#1e1e1e] pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Tickets</p>
              <div
                className="rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: event.ticket_shortcode }}
              />
            </div>
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
            <a
              href={`whatsapp://send?text=${shareText}`}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-oranje text-oranje font-bold uppercase tracking-wide text-sm hover:bg-oranje hover:text-black transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Nodig vrienden uit
            </a>
            {event.ticket_url && (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#333] text-gray-400 font-bold uppercase tracking-wide text-sm hover:text-white transition-colors"
              >
                Tickets kopen →
              </a>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
