'use client';

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { berekenOpenStatus } from '@/lib/openingstijden';

function getTypeKleur(type) {
  if (!type) return '#888';
  const map = {
    'Café':'#60a5fa','Bruin café':'#92400e','Bruin Café':'#92400e','Grand Café':'#a78bfa',
    'Muziekcafé':'#34d399','Feestcafé':'#F27A00','Danscafé':'#f472b6','Speciaalbiercafé':'#fbbf24',
    'Club':'#a855f7','Nachtclub':'#c084fc','Cocktailbar':'#06b6d4','Wijnbar':'#e879f9',
    'Sportbar':'#4ade80','Sports bar':'#4ade80','Bistro / Cocktails':'#06b6d4',
    'Cocktailbar / Lounge':'#67e8f9','Restaurant / Bar':'#fb923c','Restaurant / Borrel':'#fb923c',
    'Brouwerij / Restaurant':'#a3e635','Karaoke':'#ec4899','Terras':'#4ade80','Terras/Bar':'#4ade80',
    'Lounge':'#818cf8',
  };
  if (map[type]) return map[type];
  const l = type.toLowerCase();
  if (l.includes('feest')) return '#F27A00';
  if (l.includes('bruin')) return '#92400e';
  if (l.includes('grand')) return '#a78bfa';
  if (l.includes('club')) return '#a855f7';
  if (l.includes('cocktail')) return '#06b6d4';
  if (l.includes('wijn')) return '#e879f9';
  if (l.includes('restaurant')) return '#fb923c';
  if (l.includes('café') || l.includes('cafe')) return '#60a5fa';
  if (l.includes('bar')) return '#67e8f9';
  const hue = [...type].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue},70%,60%)`;
}

const MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

function slugify(naam) {
  return (naam || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}


export default function LocatieDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [loc, setLoc]       = useState(null);
  const [events, setEvents] = useState([]);
  const [prijzen, setPrijzen] = useState([]);
  const [acties, setActies] = useState([]);
  const [laden, setLaden]   = useState(true);
  const [actieveFoto, setActieveFoto] = useState(0);

  useEffect(() => {
    if (!slug) return;
    async function laad() {
      // Haal alle venues op en match op slug
      const { data: venues } = await supabase.from('venues').select('*').eq('actief', true);
      const gevonden = (venues || []).find(v => slugify(v.naam) === slug || v.slug === slug);
      if (!gevonden) { setLaden(false); return; }
      setLoc(gevonden);

      const vandaag = new Date().toISOString().slice(0, 10);
      const [evRes, prijsById, prijsByNaam, actiesRes] = await Promise.all([
        supabase.from('events').select('*').eq('goedgekeurd', true)
          .gte('datum', vandaag)
          .order('datum', { ascending: true }),
        supabase.from('bierprijzen').select('*').eq('venue_id', gevonden.id),
        supabase.from('bierprijzen').select('*').eq('venue_naam', gevonden.naam),
        supabase.from('acties').select('*')
          .eq('venue_id', gevonden.id)
          .eq('gepubliceerd', true)
          .or(`onbepaalde_tijd.eq.true,geldig_tot.gte.${vandaag}`)
          .order('hot', { ascending: false })
          .order('geldig_tot', { ascending: true, nullsLast: true }),
      ]);

      const allePrijzen = [...(prijsById.data || []), ...(prijsByNaam.data || [])];
      const uniekePrijzen = allePrijzen.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

      const locEvents = (evRes.data || []).filter(e => {
        // Primair op venue_naam matchen
        if (e.venue_naam) return e.venue_naam === gevonden.naam;
        // Alleen eigenaar_id als fallback als event geen venue_naam heeft
        return e.eigenaar_id === gevonden.eigenaar_id;
      });
      setEvents(locEvents);
      setPrijzen(uniekePrijzen);
      setActies(actiesRes.data || []);
      setLaden(false);
    }
    laad();
  }, [slug]);

  if (laden) return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="flex items-center justify-center py-40 text-gray-600">Laden...</div>
      <Footer />
    </main>
  );

  if (!loc) return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-gray-500 text-xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Locatie niet gevonden</p>
        <a href="/locaties" className="text-oranje text-sm hover:underline">← Alle locaties</a>
      </div>
      <Footer />
    </main>
  );

  const typeKleur = getTypeKleur(loc.type);
  const fotos = Array.isArray(loc.fotos) ? loc.fotos.filter(Boolean) : [];

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Tracking pixels */}
      {loc.meta_pixel_id && (
        <Script id={`meta-pixel-${loc.id}`} strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${loc.meta_pixel_id}');fbq('track','PageView');
        `}</Script>
      )}
      {loc.tiktok_pixel_id && (
        <Script id={`tiktok-pixel-${loc.id}`} strategy="afterInteractive">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${loc.tiktok_pixel_id}');ttq.page();}(window,document,'ttq');
        `}</Script>
      )}

      {/* Hero met sfeerbeelden */}
      <section className="relative border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        {/* Achtergrond sfeerbeeld */}
        {fotos[actieveFoto] && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={fotos[actieveFoto]} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.9) 100%)' }} />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
          <a href="/locaties" className="text-gray-500 text-xs uppercase tracking-wide hover:text-oranje transition-colors mb-6 inline-block">
            ← Alle locaties
          </a>

          <div className="flex items-end gap-6 flex-wrap">
            {/* Logo */}
            {loc.logo_url && (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-oranje/40 bg-black shadow-2xl flex-shrink-0">
                <img src={loc.logo_url} alt={loc.naam} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wide mb-3 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeKleur }} />
                <span style={{ color: typeKleur }}>{loc.type}</span>
              </span>

              <h1 className="text-5xl md:text-6xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {loc.naam}
              </h1>
              <div className="flex items-center gap-1 mt-3">
                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="text-gray-400 text-sm">{loc.adres}</span>
              </div>
              {/* Sterren + open status op één rij */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {loc.google_rating && (
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= Math.round(loc.google_rating) ? '#F27A00' : '#444'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                    <span className="text-sm font-bold text-white">{loc.google_rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-600">Google</span>
                  </div>
                )}
                {(() => {
                  const status = berekenOpenStatus(loc.openingstijden);
                  if (!status) return null;
                  if (status.open) return (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ backgroundColor: '#16a34a22', border: '1px solid #16a34a66', color: '#4ade80' }}>
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                      Nu open
                      {status.sluitOm && <span className="font-normal text-green-600 ml-1">· sluit {status.sluitOm}</span>}
                    </span>
                  );
                  return (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ backgroundColor: '#7f1d1d22', border: '1px solid #7f1d1d66', color: '#f87171' }}>
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Gesloten
                      {status.openstOm
                        ? <span className="font-normal text-red-400 ml-1">· opent {status.dagLabel} om {status.openstOm}</span>
                        : <span className="font-normal text-red-400 ml-1">· tijden onbekend</span>}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {loc.leeftijd && (
                <span className="text-sm font-bold px-4 py-2 rounded-lg bg-[#181818] border border-[#333] text-white">
                  {loc.leeftijd}
                </span>
              )}
            </div>
          </div>

          {/* Eigen knop */}
          {loc.knop_label && loc.knop_url && (
            <div className="mt-5">
              <a href={loc.knop_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-black text-sm"
                style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {loc.knop_label}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          )}

          {/* Tags */}
          {loc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {loc.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full font-bold"
                  style={{ backgroundColor: '#F27A0018', color: '#F27A00', border: '1px solid #F27A0040' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sfeerbeelden gallery */}
      {fotos.length > 0 && (
        <section className="px-4 py-8 border-b border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-3" style={{ gridTemplateColumns: fotos.length === 1 ? '1fr' : fotos.length === 2 ? '1fr 1fr' : '2fr 1fr 1fr' }}>
              {fotos.map((foto, i) => (
                <div key={i} className={`relative overflow-hidden rounded-xl bg-[#0d0d0d] cursor-pointer ${i === 0 && fotos.length === 3 ? 'row-span-2' : ''}`}
                  style={{ height: i === 0 && fotos.length === 3 ? 320 : 155 }}
                  onClick={() => setActieveFoto(i)}>
                  <img src={foto} alt={`${loc.naam} sfeerbeeld ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info */}
      <section className="px-4 py-10 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-black uppercase mb-3" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
              Over {loc.naam}
            </h2>
            <p className="text-gray-300 leading-relaxed">{loc.omschrijving || 'Geen omschrijving beschikbaar.'}</p>

            {/* Contact */}
            <div className="mt-6 space-y-2">
              {loc.telefoon && (
                <a href={`tel:${loc.telefoon}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-oranje transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.18C.03.6.46.02 1.05.02h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L5.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {loc.telefoon}
                </a>
              )}
              {loc.website && (
                <a href={loc.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-oranje transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                  </svg>
                  {loc.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {loc.instagram && (
                <a href={`https://instagram.com/${loc.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-oranje transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  @{loc.instagram}
                </a>
              )}
            </div>
          </div>

          {/* Openingstijden + kaart */}
          <div className="space-y-4">
            {loc.openingstijden && Object.values(loc.openingstijden).some(t => t?.open || t?.sluit || t?.gesloten) && (() => {
              const DAGEN = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
              const nu = new Date();
              const dagIndex = nu.getDay(); // 0=zo, 1=ma
              const dagNamen = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
              const vandaag = dagNamen[dagIndex];
              return (
                <div className="rounded-xl border border-[#1e1e1e] overflow-hidden" style={{ backgroundColor: '#141414' }}>
                  <div className="px-5 py-3 border-b border-[#1e1e1e]">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Openingstijden</p>
                  </div>
                  <div className="divide-y divide-[#1a1a1a]">
                    {DAGEN.map(dag => {
                      const t = loc.openingstijden[dag];
                      if (!t) return null;
                      const isVandaag = dag === vandaag;
                      const gesloten = t.gesloten || (!t.open && !t.sluit);
                      return (
                        <div key={dag} className={`flex items-center justify-between px-5 py-2.5 ${isVandaag ? 'bg-oranje/5' : ''}`}>
                          <span className={`text-sm font-bold w-8 ${isVandaag ? 'text-oranje' : 'text-gray-400'}`}>{dag}</span>
                          {isVandaag && <span className="text-[10px] bg-oranje/20 text-oranje px-2 py-0.5 rounded-full font-bold mr-auto ml-2">Vandaag</span>}
                          <span className={`text-sm ${gesloten ? 'text-gray-600' : isVandaag ? 'text-white font-semibold' : 'text-gray-300'}`}>
                            {gesloten ? 'Gesloten' : `${t.open} – ${t.sluit}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {/* Google Maps embed */}
          {loc.lat && loc.lng && (
            <div className="rounded-xl overflow-hidden border border-[#1e1e1e]" style={{ height: 240 }}>
              <iframe
                width="100%" height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=16&output=embed`}
              />
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Prijzen */}
      {prijzen.length > 0 && (
        <section className="px-4 py-10 border-b border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                Prijsradar
              </h2>
              <a href="/prijzen" className="text-xs text-gray-500 hover:text-oranje transition-colors uppercase tracking-wide">
                Vergelijk alle locaties →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {prijzen
                .sort((a, b) => (a.drankje || '').localeCompare(b.drankje || ''))
                .map((p, i) => {
                  const prijs = parseFloat(p.prijs);
                  const kleur = prijs <= 2.5 ? '#22c55e' : prijs <= 4 ? '#F27A00' : '#ef4444';
                  const emoji = {
                    Bier: '🍺', Wijn: '🍷', Mixdrank: '🍹', Shot: '🥃',
                    Frisdrank: '🥤', 'Hard Seltzer': '🫧',
                  }[p.drankje] || '🍶';
                  return (
                    <div key={i} className="rounded-xl border border-[#252525] p-4 flex items-center gap-3" style={{ backgroundColor: '#141414' }}>
                      <span className="text-2xl flex-shrink-0">{emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">{p.drankje}</p>
                        <p className="text-xl font-black leading-none" style={{ color: kleur, fontFamily: "'Big Shoulders Display', sans-serif" }}>
                          €{prijs.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Acties */}
      {acties.length > 0 && (
        <section className="px-4 py-10 border-b border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                Acties & Deals
              </h2>
              <a href="/acties" className="text-xs text-gray-500 hover:text-oranje transition-colors uppercase tracking-wide">
                Alle acties →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {acties.map(a => {
                const foto = a.foto_url || fotos[0] || null;
                const geldig = a.onbepaalde_tijd ? 'Altijd geldig'
                  : a.vaste_dagen?.length ? a.vaste_dagen.map(d => ['zo','ma','di','wo','do','vr','za'][d]).join(' · ')
                  : a.geldig_tot ? `t/m ${new Date(a.geldig_tot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
                const isNieuw = a.geldig_van && new Date(a.geldig_van) > new Date(Date.now() - 7*24*60*60*1000);
                return (
                  <div key={a.id} className="bg-[#141414] rounded-xl border border-[#252525] hover:border-oranje transition-colors overflow-hidden flex flex-col">
                    {/* Foto */}
                    <div className="relative overflow-hidden" style={{ paddingBottom: '62.5%' }}>
                      {foto ? (
                        <img src={foto} alt={a.titel} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #1a0800 0%, #2B1400 100%)' }}>
                          <span className="text-4xl font-black text-white/10" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>%</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {a.hot && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black" style={{ backgroundColor: '#F27A00', color: '#000' }}>🔥 HOT</span>
                        )}
                        {isNieuw && !a.hot && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-white/10 text-white border border-white/20">NIEUW</span>
                        )}
                      </div>
                      {a.label && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-black bg-black/70 text-white border border-white/20">
                          {a.label}
                        </span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-4 flex flex-col gap-1.5 flex-1">
                      <h3 className="text-lg font-black uppercase leading-tight" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                        {a.titel}
                      </h3>
                      {a.omschrijving && <p className="text-sm text-gray-500 line-clamp-2 flex-1">{a.omschrijving}</p>}
                      <p className="text-xs text-gray-600 font-semibold mt-1">{geldig}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black uppercase mb-6" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Aankomende events bij {loc.naam}
          </h2>
          {events.length === 0 ? (
            <p className="text-gray-600">Geen aankomende events gevonden.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(ev => (
                <div key={ev.id} className="bg-[#141414] rounded-xl border border-[#252525] overflow-hidden">
                  {ev.poster_url && (
                    <img src={ev.poster_url} alt={ev.title} className="w-full object-cover" style={{ height: 140 }} />
                  )}
                  <div className="p-4">
                    <p className="font-black uppercase text-lg leading-tight" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ev.datum ? `${new Date(ev.datum).getDate()} ${MAANDEN[new Date(ev.datum).getMonth()]}` : ''} · {ev.tijd}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{ev.leeftijd}</span>
                      <span className={`text-sm font-bold ${ev.prijs === 'Gratis' ? 'text-green-400' : 'text-oranje'}`}>{ev.prijs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Google Reviews */}
      {(loc.google_rating || loc.google_reviews?.length > 0) && (
        <section className="px-4 py-10 border-b border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                Google Reviews
              </h2>
              {loc.google_rating && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#252525] bg-[#141414]">
                  <span className="text-2xl font-black text-white" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                    {loc.google_rating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(loc.google_rating) ? '#F27A00' : '#333'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">via Google</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(loc.google_reviews || []).map((rv, i) => (
                <div key={i} className="bg-[#141414] rounded-xl border border-[#252525] p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {rv.avatar ? (
                      <img src={rv.avatar} alt={rv.auteur} className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-400">
                        {(rv.auteur || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{rv.auteur}</p>
                      <p className="text-xs text-gray-600">{rv.datum}</p>
                    </div>
                    <div className="ml-auto flex">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= rv.rating ? '#F27A00' : '#333'}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{rv.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
