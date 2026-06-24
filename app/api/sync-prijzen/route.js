import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DRANKEN = ['Bier', 'Wijn', 'Mixdrank', 'Cocktail', 'Hard Seltzer', 'Shot', 'Frisdrank'];

// Scrape tekst van een URL (max 50KB)
async function scrapePagina(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip HTML tags, bewaar alleen tekst
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);
  } catch {
    return null;
  }
}

// Zoek menu/prijzen pagina links op de homepage
async function zoekMenuLink(website) {
  try {
    const res = await fetch(website, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const parsed = new URL(website);
    const origin = parsed.origin;

    // Zoek links met menu/dranken/prijzen/kaart in href of tekst
    const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const trefwoorden = ['menu', 'dranken', 'prijzen', 'kaart', 'drinks', 'beverages', 'cocktails'];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const tekst = match[2].replace(/<[^>]+>/g, '').toLowerCase();
      const hrefLower = href.toLowerCase();
      if (trefwoorden.some(t => hrefLower.includes(t) || tekst.includes(t))) {
        const absUrl = href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
        return absUrl;
      }
    }
  } catch {}
  return null;
}

// AI extractie van prijzen uit tekst
async function extraheerPrijzen(tekst, naam, bron) {
  const prompt = `Je bent een assistent die drankprijzen extraheert uit tekst van een café of bar.

Café/bar naam: ${naam}
Bron: ${bron}

Tekst:
${tekst}

Extraheer de prijzen voor de volgende dranken (als ze vermeld worden): ${DRANKEN.join(', ')}.

Voor "Cocktail" moet je specifiek zoeken naar cocktailprijzen — een Pornstar Martini of andere cocktail.
Voor "Mixdrank" zoek naar mixdrankjes (vodka cola, gin tonic, etc.).
Voor "Shot" zoek naar shots of borreltjes.

Geef ALLEEN een JSON object terug zoals:
{"Bier": 3.50, "Wijn": 4.00, "Shot": 2.50}

Gebruik null voor dranken waarvan je de prijs NIET zeker weet. Geef geen geschatte prijzen op.
Als er geen enkele prijs gevonden wordt, geef dan {} terug.
Geef ALLEEN het JSON object terug, geen uitleg.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    const parsed = JSON.parse(jsonMatch[0]);
    // Filter null waarden eruit
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== null && typeof v === 'number' && v > 0));
  } catch {
    return {};
  }
}

export async function POST(request) {
  const { naam, website, googleReviews } = await request.json();
  if (!naam) return NextResponse.json({ error: 'naam vereist' }, { status: 400 });

  const gevondenPrijzen = {};
  const bronnen = [];

  // Stap 1: scrape website menu
  if (website) {
    try {
      // Zoek eerst een menu/prijzen pagina
      const menuLink = await zoekMenuLink(website);
      const scrapeUrl = menuLink || website;
      const tekst = await scrapePagina(scrapeUrl);

      if (tekst && tekst.length > 100) {
        const bron = menuLink ? `menukaart (${menuLink})` : 'website';
        const prijzen = await extraheerPrijzen(tekst, naam, bron);
        if (Object.keys(prijzen).length > 0) {
          Object.assign(gevondenPrijzen, prijzen);
          bronnen.push(bron);
        }
      }
    } catch {}
  }

  // Stap 2: analyse van Google reviews op prijsvermeldingen
  if (googleReviews?.length && Object.keys(gevondenPrijzen).length < 2) {
    const reviewTekst = googleReviews
      .map(r => r.tekst || r.text || '')
      .filter(Boolean)
      .join('\n\n');

    if (reviewTekst.length > 50) {
      const prijzen = await extraheerPrijzen(reviewTekst, naam, 'Google reviews');
      let nieuw = 0;
      for (const [drankje, prijs] of Object.entries(prijzen)) {
        if (!gevondenPrijzen[drankje]) {
          gevondenPrijzen[drankje] = prijs;
          nieuw++;
        }
      }
      if (nieuw > 0) bronnen.push('Google reviews');
    }
  }

  return NextResponse.json({
    prijzen: gevondenPrijzen,
    aantalGevonden: Object.keys(gevondenPrijzen).length,
    bronnen,
  });
}
