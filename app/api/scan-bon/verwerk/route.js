import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIEEN = {
  'Bier': 'vaasje, pils, hertog, heineken, grolsch, amstel, biertje, tapbier, fluitje, bokbier, IPA, weizen, speciaalbier',
  'Wijn': 'rosé, rode wijn, witte wijn, chardonnay, merlot, sauvignon, prosecco, cava, champagne, huiswijn, glas wijn',
  'Mixdrank': 'gin tonic, vodka cola, rum cola, bacardi, whisky cola, long drink, breezers, WKD, smirnoff ice',
  'Cocktail': 'mojito, cosmopolitan, margarita, aperol spritz, sex on the beach, pina colada, hugo',
  'Hard Seltzer': 'stëlz, stelz, viper, white claw, truly, hard seltzer, alcoholic seltzer',
  'Shot': 'tequila, sambuca, jaegermeister, jager, wodka, shot, borrel, jenever, whisky shot',
  'Frisdrank': 'cola, fanta, sprite, spa, water, appelsap, sinaasappelsap, energy drink, red bull, monster',
};

// PATCH: sla de bewerkte versie op vanuit de gebruiker
export async function PATCH(req) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { scan_id, locatie_naam, dranken } = await req.json();
    if (!scan_id) return Response.json({ error: 'Geen scan_id' }, { status: 400 });

    const { error } = await supabase
      .from('bon_scans')
      .update({ locatie_naam, dranken, status: 'wacht' })
      .eq('id', scan_id);

    if (error) {
      console.error('[PATCH bon_scans]', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error('[PATCH verwerk]', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST: AI analyseert de bon
export async function POST(req) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { scan_id } = await req.json();
    if (!scan_id) return Response.json({ error: 'Geen scan_id' }, { status: 400 });

    const { data: scan, error: scanError } = await supabase
      .from('bon_scans').select('*').eq('id', scan_id).single();
    if (scanError || !scan) return Response.json({ error: 'Scan niet gevonden' }, { status: 404 });

    const { data: venues } = await supabase.from('venues').select('id, naam').eq('actief', true);
    const venueNamen = (venues || []).map(v => v.naam).join(', ');

    const imgRes = await fetch(scan.afbeelding_url);
    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString('base64');

    // Stap A: laat Claude de bon in platte tekst uitlezen
    const leesResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: `Lees deze kassabon en geef per drankregeléén regel terug in dit exacte formaat:
NAAM | AANTAL | REGELTOTAAL | LOCATIE

Voorbeeld:
Bier Vaasje | 5 | 17.50 | Road House
Wijn | 4 | 18.00 | Road House
Gin Tonic | 2 | 15.00 | Road House

Wat je WEL opneemt (standaard consumpties):
- Gewoon bier / vaasje / pils / fluitje
- Wijn (glas)
- Mixdranken (gin tonic, vodka cola, etc.)
- Cocktails
- Hard seltzer (Stëlz, Viper, etc.)
- Shots
- Frisdrank

Wat je NIET opneemt (sla deze regels over):
- Speciaalbieren (speciaalbier, IPA, weizen, bokbier, craft beer)
- Kannetje, kan, pitcher, fles bier
- Eten, snacks, koffie, thee
- Poolen, open bedrag, servicekosten, BTW-regels
- Wijnfles (alleen glas)
- Alles met "VERBORGEN" in de naam

- AANTAL = getal uit de "Aantal" kolom van de bon
- REGELTOTAAL = bedrag uit de "Kosten" of "Bedrag" kolom (het totaal voor die regel)
- LOCATIE = naam van het café/bar zoals op de bon
- Geef ALLEEN de tabel terug, geen uitleg` }
        ]
      }]
    });

    const bonTekst = leesResponse.content[0].text.trim();
    console.log('[claude bon tekst]', bonTekst);

    // Stap B: parseer de tabel en bereken stukprijzen
    const regels = bonTekst.split('\n').filter(r => r.includes('|'));
    let locatie_naam = null;
    const dranken = [];

    for (const regel of regels) {
      const delen = regel.split('|').map(s => s.trim());
      if (delen.length < 3) continue;
      const naam = delen[0];
      const aantal = parseFloat(delen[1]) || 1;
      const regeltotaal = parseFloat(delen[2].replace(',', '.')) || 0;
      if (delen[3] && !locatie_naam) locatie_naam = delen[3];

      if (!naam || regeltotaal === 0) continue;

      const stukprijs = Math.round((regeltotaal / aantal) * 100) / 100;

      // Bepaal categorie
      const naamLower = naam.toLowerCase();
      let categorie = 'Overig';
      for (const [cat, voorbeelden] of Object.entries(CATEGORIEEN)) {
        if (voorbeelden.split(', ').some(v => naamLower.includes(v.toLowerCase())) ||
            cat.toLowerCase() === naamLower) {
          categorie = cat; break;
        }
      }
      // Sla speciaalbieren, kannetjes en verborgen items over
      const uitsluitingen = ['speciaal', 'ipa', 'weizen', 'bokbier', 'kannetje', 'kan ', 'pitcher', 'fles', 'verborgen', 'craft'];
      if (uitsluitingen.some(u => naamLower.includes(u))) continue;

      if ((naamLower.includes('bier') || naamLower.includes('vaasje') || naamLower.includes('pils') || naamLower.includes('fluitje')) && !naamLower.includes('speciaal')) categorie = 'Bier';
      if (naamLower.includes('wijn') || naamLower.includes('rosé')) categorie = 'Wijn';
      if (naamLower.includes('mix') && naamLower.includes('frisdrank')) categorie = 'Frisdrank';
      if (naamLower.includes('mixdrank')) categorie = 'Mixdrank';

      dranken.push({ naam, aantal, prijs: stukprijs, categorie });
    }

    let venue_id = null;
    if (locatie_naam) {
      const match = (venues || []).find(v =>
        v.naam.toLowerCase().includes(locatie_naam.toLowerCase()) ||
        locatie_naam.toLowerCase().includes(v.naam.toLowerCase())
      );
      venue_id = match?.id || null;
    }

    const { data: updated, error: updateError } = await supabase
      .from('bon_scans')
      .update({
        locatie_naam: locatie_naam || null,
        venue_id,
        dranken,
        status: 'wacht',
      })
      .eq('id', scan_id)
      .select()
      .single();

    if (updateError) console.error('[update bon_scans]', updateError.message);

    return Response.json({
      ok: true,
      scan: updated,
      venue_gevonden: !!venue_id,
      venue_naam: venue_id ? (venues || []).find(v => v.id === venue_id)?.naam : null,
    });

  } catch (e) {
    console.error('[scan-bon verwerk POST]', e.message);
    return Response.json({ error: 'Er ging iets mis bij het analyseren.', detail: e.message }, { status: 500 });
  }
}
