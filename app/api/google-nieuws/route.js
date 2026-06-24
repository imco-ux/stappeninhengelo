import { NextResponse } from 'next/server';

// Specifieke zoektermen voor uitgaan/nightlife in Hengelo
const QUERIES = [
  'feest kroeg café Hengelo uitgaan',
  'evenement festival Hengelo horeca',
  'club bar nacht Hengelo',
  'Hengelo stappen nightlife',
];

// Woorden die we NIET willen (bouw, gemeente, vergunningen)
const BLACKLIST = [
  'bomenkap', 'sloop', 'bouw', 'vergunning', 'bestemmingsplan',
  'gemeente hengelo melding', 'kapvergunning', 'omgevingsvergunning',
];

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titel = decodeHtmlEntities(
      (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
       block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || ''
    );
    const link  = (block.match(/<link>([\s\S]*?)<\/link>/) ||
                   block.match(/<link\s+href="([^"]+)"/))?.[1]?.trim() || '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    const bron  = decodeHtmlEntities(
      (block.match(/<source[^>]*>([\s\S]*?)<\/source>/))?.[1]?.trim() || ''
    );

    if (!titel || !link) continue;

    // Filter irrelevante artikelen
    const titelLower = titel.toLowerCase();
    if (BLACKLIST.some(w => titelLower.includes(w))) continue;

    const datumRuw = pubDate ? new Date(pubDate) : new Date(0);
    items.push({
      titel,
      link,
      datumRuw,
      datum: datumRuw.getFullYear() > 2000
        ? datumRuw.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
        : '',
      bron: bron || (() => { try { return new URL(link).hostname.replace('www.', ''); } catch { return ''; } })(),
      foto: null,
    });
  }
  return items;
}

// Stopwoorden die we niet als zoekterm willen
const STOPWOORDEN = new Set([
  'de','het','een','en','in','op','van','te','voor','met','aan','bij','uit',
  'dat','die','dit','zijn','heeft','wordt','werd','over','naar','ook','maar',
  'als','door','we','ze','hij','zij','er','hier','daar','na','af','hoe','wat',
  'nog','al','wel','niet','meer','geen','dan','of','zo','om','nu','week',
]);

function extractZoekTermen(titel) {
  const woorden = titel
    .toLowerCase()
    .replace(/[|–\-—]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWOORDEN.has(w));

  // Zet Nederlandse uitgaanswoorden om naar Engels voor Unsplash
  const vertaling = {
    'café': 'cafe bar', 'kroeg': 'pub bar', 'feest': 'party nightlife',
    'festival': 'festival music', 'club': 'nightclub', 'evenement': 'event',
    'uitgaan': 'nightlife bar', 'hengelo': 'nightlife city', 'horeca': 'restaurant bar',
    'nacht': 'night city', 'muziek': 'music concert', 'drank': 'cocktail bar',
    'disco': 'disco dance', 'stappen': 'nightlife', 'bier': 'beer pub',
  };

  const termen = woorden.slice(0, 4).map(w => vertaling[w] || w);

  // Voeg altijd nightlife toe als context
  if (!termen.some(t => t.includes('night') || t.includes('bar') || t.includes('pub'))) {
    termen.unshift('nightlife bar');
  }

  return termen.slice(0, 3).join(',');
}

async function haalOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text().then(t => t.slice(0, 30000));
    const img = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
             || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
             || html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)?.[1]
             || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i)?.[1];
    return (img && img.startsWith('http')) ? img : null;
  } catch { return null; }
}

function haalFallbackFoto(titel) {
  const termen = extractZoekTermen(titel); // bijv. "nightlife,bar,party"
  const hash = titel.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = hash % 1000;
  // loremflickr verwacht komma's ongeëncoded in het pad
  const pad = termen.split(',').map(t => encodeURIComponent(t.trim())).join(',');
  return `https://loremflickr.com/800/500/${pad}?lock=${seed}`;
}

async function haalAfbeelding(url, titel) {
  // Stap 1: probeer og:image van de artikelpagina
  const ogImg = await haalOgImage(url);
  if (ogImg) return ogImg;

  // Stap 2: fallback via loremflickr (keyword + vaste seed per artikel)
  return haalFallbackFoto(titel);
}

export async function GET() {
  try {
    // 1. RSS feeds ophalen
    const resultaten = await Promise.all(
      QUERIES.map(async (q) => {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=nl&gl=NL&ceid=NL:nl`;
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) return [];
          return parseRSS(await res.text());
        } catch { return []; }
      })
    );

    // 2. Dedupliceer op titel (niet op link want Google News heeft redirects)
    const gezienTitels = new Set();
    const artikelen = [];
    for (const lijst of resultaten) {
      for (const item of lijst) {
        const key = item.titel.toLowerCase().slice(0, 60);
        if (!gezienTitels.has(key)) {
          gezienTitels.add(key);
          artikelen.push(item);
        }
      }
    }

    // 3. Nieuwste eerst
    artikelen.sort((a, b) => b.datumRuw - a.datumRuw);
    const top = artikelen.slice(0, 20);

    // 4. Afbeeldingen ophalen voor alle artikelen (og:image → Unsplash fallback)
    await Promise.all(
      top.map(async (item) => {
        item.foto = await haalAfbeelding(item.link, item.titel);
      })
    );

    // 5. Verwijder intern veld datumRuw
    const output = top.map(({ datumRuw, ...rest }) => rest);

    return NextResponse.json(
      { artikelen: output },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
