'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

function geldigheidsLabel(actie) {
  if (actie.onbepaalde_tijd) return 'Altijd geldig';
  if (actie.vaste_dagen?.length) {
    return actie.vaste_dagen.map(d => DAGEN_KORT[d]).join(' · ');
  }
  if (actie.geldig_van && actie.geldig_tot) {
    const van = new Date(actie.geldig_van).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const tot = new Date(actie.geldig_tot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    return `${van} – ${tot}`;
  }
  if (actie.geldig_tot) {
    const tot = new Date(actie.geldig_tot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    return `t/m ${tot}`;
  }
  return '';
}

function slugify(naam) {
  return naam?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || '';
}

function getDagenVandaag() {
  return new Date().getDay(); // 0=zo..6=za
}

function ActieKaart({ actie }) {
  const foto = actie.foto_url
    || actie.event?.poster_url
    || actie.venue?.fotos?.[0]
    || null;
  const logo = actie.venue?.logo_url || null;
  const naam = actie.venue?.naam || actie.event?.title || '';
  const slug = actie.venue?.naam ? `/locaties/${slugify(actie.venue.naam)}` : actie.event?.slug ? `/events/${actie.event.slug}` : null;
  const label = geldigheidsLabel(actie);

  const Wrapper = slug ? 'a' : 'div';
  return (
    <Wrapper href={slug || undefined} className="bg-[#141414] rounded-xl border border-[#252525] hover:border-oranje transition-colors overflow-hidden flex flex-col group cursor-pointer active:scale-[0.98]">
      {/* Foto 4:5 */}
      <div className="relative overflow-hidden" style={{ paddingBottom: '125%' }}>
        {foto ? (
          <img src={foto} alt={actie.titel}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a0800 0%, #2B1400 100%)' }}>
            <span className="text-5xl font-black text-white/10" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              {naam.charAt(0) || 'A'}
            </span>
          </div>
        )}

        {/* Overlay met logo + zaaksnaam */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* HOT badge */}
        {actie.hot && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-black uppercase"
            style={{ backgroundColor: '#F27A00', color: '#000' }}>
            🔥 HOT
          </div>
        )}

        {/* Label badge */}
        {actie.label && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-black/70 text-white border border-white/20">
            {actie.label}
          </div>
        )}

        {/* Zaak info onderaan foto */}
        {naam && (
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
            {logo && (
              <img src={logo} alt="" className="w-8 h-8 rounded-full border-2 border-white/20 object-cover flex-shrink-0 bg-black" />
            )}
            <span className="text-white text-sm font-bold truncate drop-shadow">{naam}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-lg font-black uppercase leading-tight" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          {actie.titel}
        </h3>
        {actie.omschrijving && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{actie.omschrijving}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-gray-600 font-semibold">{label}</span>
          {slug && <span className="text-oranje text-xs font-bold">Bekijk →</span>}
        </div>
      </div>
    </Wrapper>
  );
}

export default function ActiesPage() {
  const [acties, setActies]     = useState([]);
  const [laden, setLaden]       = useState(true);
  const [dagFilter, setDagFilter] = useState(null); // null = alle

  useEffect(() => {
    // Verwijder verlopen acties op de achtergrond
    fetch('/api/cleanup-acties', { method: 'POST' }).catch(() => {});

    async function laad() {
      const vandaag = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('acties')
        .select(`*, venue:venue_id(id, naam, logo_url, fotos), event:event_id(id, title, slug, poster_url)`)
        .eq('gepubliceerd', true)
        .or(`onbepaalde_tijd.eq.true,geldig_tot.gte.${vandaag},vaste_dagen.not.is.null`)
        .order('hot', { ascending: false })
        .order('geldig_tot', { ascending: true, nullsLast: true });
      setActies(data || []);
      setLaden(false);
    }
    laad();
  }, []);

  const vandaag = getDagenVandaag();

  const gefilterd = dagFilter === null ? acties : acties.filter(a => {
    if (a.vaste_dagen?.length) return a.vaste_dagen.includes(dagFilter);
    if (a.onbepaalde_tijd) return true;
    return false;
  });

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
          <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>ACTIES</h1>
          <p className="text-gray-500 text-sm mt-1">Deals & aanbiedingen van Hengelo's horeca</p>
        </div>
      </section>

      {/* Dag filters */}
      <section className="bg-black border-b border-[#1a1a1a] px-4 py-3">
        <div className="max-w-6xl mx-auto flex gap-2 flex-wrap">
          <button onClick={() => setDagFilter(null)}
            className={`text-xs font-bold uppercase px-4 py-1.5 rounded-full border transition-colors ${dagFilter === null ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-400 hover:border-oranje hover:text-oranje'}`}>
            Alle dagen
          </button>
          {[0,1,2,3,4,5,6].map(d => (
            <button key={d} onClick={() => setDagFilter(d === dagFilter ? null : d)}
              className={`text-xs font-bold uppercase px-4 py-1.5 rounded-full border transition-colors ${dagFilter === d ? 'bg-oranje border-oranje text-black' : d === vandaag ? 'border-oranje/40 text-oranje/70 hover:border-oranje hover:text-oranje' : 'border-[#333] text-gray-400 hover:border-oranje hover:text-oranje'}`}>
              {DAGEN_LANG[d]}{d === vandaag ? ' ★' : ''}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {laden ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-xl bg-[#141414] animate-pulse" style={{ paddingBottom: '125%' }} />
              ))}
            </div>
          ) : gefilterd.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <p className="text-2xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Geen acties gevonden</p>
              <p className="text-sm mt-2">Pas de filters aan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gefilterd.map(actie => <ActieKaart key={actie.id} actie={actie} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
