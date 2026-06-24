import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const API_KEY  = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SB_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const G_DAG = ['Zo','Ma','Di','Wo','Do','Vr','Za'];

function formatTijd(time) {
  if (!time || time.length < 4) return '';
  return `${time.slice(0,2)}:${time.slice(2)}`;
}

async function uploadNaarStorage(imageUrl, bucket, bestandsnaam) {
  const supabase = createClient(SB_URL, SB_KEY);
  const res = await fetch(imageUrl);
  if (!res.ok) return null;
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) return null;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(bestandsnaam, blob, { contentType: blob.type, upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(bestandsnaam);
  return data.publicUrl;
}

async function uploadFotoVanUrl(imageUrl, venueId, index) {
  const ext = 'jpg';
  const naam = `google-${venueId}-${Date.now()}-${index}.${ext}`;
  return uploadNaarStorage(imageUrl, 'venue-fotos', naam);
}

async function zoekLogo(website, venueId) {
  if (!website || !venueId) return null;
  try {
    const parsed = new URL(website);
    const origin = parsed.origin;
    const domain = parsed.hostname.replace(/^www\./, '');

    // Stap 1: scrape de website voor apple-touch-icon of hoge-res favicon
    let iconUrl = null;
    try {
      const html = await fetch(origin, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.text());

      // Zoek apple-touch-icon (180x180, beste kwaliteit)
      const appleMatch = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i);
      if (appleMatch) {
        iconUrl = appleMatch[1].startsWith('http') ? appleMatch[1] : `${origin}${appleMatch[1].startsWith('/') ? '' : '/'}${appleMatch[1]}`;
      }

      // Fallback: zoek groot favicon (192x192 of 512x512)
      if (!iconUrl) {
        const grootMatch = html.match(/<link[^>]+sizes=["'](?:192x192|512x512|256x256|180x180)["'][^>]*href=["']([^"']+)["']/i)
          || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*sizes=["'](?:192x192|512x512|256x256|180x180)["']/i);
        if (grootMatch) {
          iconUrl = grootMatch[1].startsWith('http') ? grootMatch[1] : `${origin}${grootMatch[1].startsWith('/') ? '' : '/'}${grootMatch[1]}`;
        }
      }
    } catch {}

    // Stap 2: als scraping iets vond, upload dat
    if (iconUrl) {
      const naam = `logo-${venueId}-icon-${Date.now()}.png`;
      const resultUrl = await uploadNaarStorage(iconUrl, 'venue-logos', naam);
      if (resultUrl) return { url: resultUrl, bron: 'website-icon' };
    }

    // Stap 3: Google favicon service (altijd beschikbaar, kleinere kwaliteit)
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    const faviconRes = await fetch(faviconUrl);
    if (faviconRes.ok) {
      const blob = await faviconRes.blob();
      // Sla slechte/generieke favicons over (< 500 bytes = waarschijnlijk generiek)
      if (blob.size > 500) {
        const supabase = createClient(SB_URL, SB_KEY);
        const naam = `logo-${venueId}-favicon-${Date.now()}.png`;
        const { error } = await supabase.storage.from('venue-logos').upload(naam, blob, { contentType: blob.type || 'image/png', upsert: true });
        if (!error) {
          const { data } = supabase.storage.from('venue-logos').getPublicUrl(naam);
          return { url: data.publicUrl, bron: 'favicon' };
        }
      }
    }
  } catch {}
  return null;
}

export async function POST(request) {
  const { naam, adres, venueId } = await request.json();
  if (!naam) return NextResponse.json({ error: 'naam vereist' }, { status: 400 });

  try {
    // Stap 1: zoek venue via Text Search
    const query = encodeURIComponent(`${naam} Hengelo`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`
    );
    const searchData = await searchRes.json();
    if (!searchData.results?.length) {
      return NextResponse.json({ error: 'Locatie niet gevonden op Google Maps' }, { status: 404 });
    }

    const placeId = searchData.results[0].place_id;

    // Stap 2: haal alle info + foto-referenties op
    const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,geometry,photos,rating,reviews';
    const detailRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`
    );
    const detailData = await detailRes.json();
    const r = detailData.result;
    if (!r) return NextResponse.json({ error: 'Geen details gevonden op Google' }, { status: 404 });

    // Openingstijden
    let tijden = null;
    if (r.opening_hours?.periods) {
      tijden = { Ma:{open:'',sluit:'',gesloten:true}, Di:{open:'',sluit:'',gesloten:true}, Wo:{open:'',sluit:'',gesloten:true}, Do:{open:'',sluit:'',gesloten:true}, Vr:{open:'',sluit:'',gesloten:true}, Za:{open:'',sluit:'',gesloten:true}, Zo:{open:'',sluit:'',gesloten:true} };
      for (const period of r.opening_hours.periods) {
        const dag = G_DAG[period.open.day];
        if (!dag) continue;
        tijden[dag] = {
          open: formatTijd(period.open.time),
          sluit: period.close ? formatTijd(period.close.time) : '',
          gesloten: false,
        };
      }
    }

    // Website: strip tracking params
    let website = r.website || null;
    if (website) {
      try { const u = new URL(website); website = u.origin + u.pathname; } catch {}
    }

    // Foto's + logo parallel ophalen
    let fotos = [];
    let logo_url = null;

    if (venueId) {
      const [fotosResultaat, logoResultaat] = await Promise.all([
        // Foto's: max 3
        r.photos?.length
          ? Promise.all(r.photos.slice(0, 3).map((p, i) => {
              const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${p.photo_reference}&key=${API_KEY}`;
              return uploadFotoVanUrl(googleUrl, venueId, i);
            })).then(res => res.filter(Boolean))
          : Promise.resolve([]),
        // Logo via website
        zoekLogo(website, venueId),
      ]);
      fotos = fotosResultaat;
      if (logoResultaat) logo_url = logoResultaat.url;
    }

    // Reviews: max 5, alleen tekst + rating + auteur + datum
    const reviews = (r.reviews || []).slice(0, 5).map(rv => ({
      auteur: rv.author_name,
      avatar: rv.profile_photo_url || null,
      rating: rv.rating,
      tekst: rv.text,
      datum: rv.relative_time_description,
    }));

    return NextResponse.json({
      gevonden: r.name,
      adres: r.formatted_address || null,
      telefoon: r.formatted_phone_number || null,
      website,
      lat: r.geometry?.location?.lat || null,
      lng: r.geometry?.location?.lng || null,
      openingstijden: tijden,
      fotos,
      logo_url,
      google_rating: r.rating || null,
      google_reviews: reviews,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
