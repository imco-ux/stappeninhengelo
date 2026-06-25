import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Drankcategorieën met voorbeelden van alternatieve namen
const CATEGORIE_VOORBEELDEN = {
  'Bier': 'vaasje, pils, hertog, heineken, grolsch, amstel, biertje, tapbier, fluitje, bokbier, IPA, weizen',
  'Wijn': 'rosé, rode wijn, witte wijn, chardonnay, merlot, sauvignon, prosecco, cava, champagne, huiswijn, glas wijn',
  'Mixdrank': 'gin tonic, vodka cola, rum cola, bacardi, whisky cola, long drink, breezers, WKD, smirnoff ice',
  'Cocktail': 'mojito, cosmopolitan, margarita, aperol spritz, sex on the beach, pina colada, hugo',
  'Hard Seltzer': 'stëlz, stelz, viper, white claw, truly, hard seltzer, alcoholic seltzer',
  'Shot': 'tequila, sambuca, jaegermeister, jager, wodka, shot, borrel, jenever, whisky shot',
  'Frisdrank': 'cola, fanta, sprite, spa, water, appelsap, sinaasappelsap, energy drink, red bull, monster',
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const bestand = formData.get('bon');
    if (!bestand) return Response.json({ error: 'Geen afbeelding ontvangen' }, { status: 400 });

    const buffer = Buffer.from(await bestand.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = bestand.type || 'image/jpeg';

    // 1. Sla afbeelding DIRECT op in storage
    const bestandsnaam = `bon-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('bonnen')
      .upload(bestandsnaam, buffer, { contentType: mediaType });

    let afbeelding_url = null;
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('bonnen').getPublicUrl(bestandsnaam);
      afbeelding_url = urlData?.publicUrl || null;
    }

    // 2. Maak DIRECT een record aan in de database (ook als AI nog niet klaar is)
    const { data: scanRecord, error: insertError } = await supabase
      .from('bon_scans')
      .insert({ afbeelding_url, status: 'scannen', dranken: [] })
      .select()
      .single();

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

    // 3. Haal alle venues op voor matching
    const { data: venues } = await supabase.from('venues').select('id, naam').eq('actief', true);
    const venueNamen = (venues || []).map(v => v.naam).join(', ');

    // 4. Claude analyseert de bon
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Analyseer deze kassabon of prijslijst van een horecagelegenheid.

Bekende locaties in ons systeem: ${venueNamen}

Geef een JSON terug met dit formaat:
{
  "locatie_naam": "naam zoals op de bon of null",
  "venue_gevonden": true of false,
  "dranken": [
    { "naam": "naam van de drank zoals op de bon", "prijs": 2.50, "categorie": "Bier" }
  ]
}

Categorieën met voorbeelden van wat erbij hoort:
${Object.entries(CATEGORIE_VOORBEELDEN).map(([cat, vb]) => `- ${cat}: ${vb}`).join('\n')}

Regels:
- Haal ALLEEN dranken eruit die in één van bovenstaande categorieën passen
- Een "vaasje" is Bier, "Stëlz" of "Viper" is Hard Seltzer, een wijnnaam is Wijn, etc.
- Laat de naam staan zoals hij op de bon staat (bijv. "Vaasje" niet veranderen naar "Bier")
- Geen koffie, thee, eten of non-food items
- Prijs als getal zonder €-teken
- Vergelijk de locatienaam losjes met de bekende locaties (ook bij spellingsverschillen)
- Geef ALLEEN het JSON object terug, geen uitleg`
          }
        ]
      }]
    });

    const tekst = response.content[0].text.trim();
    const json = JSON.parse(tekst.replace(/```json|```/g, '').trim());

    // 5. Zoek venue_id op als Claude er een heeft gevonden
    let venue_id = null;
    if (json.venue_gevonden && json.locatie_naam) {
      const match = (venues || []).find(v =>
        v.naam.toLowerCase().includes(json.locatie_naam.toLowerCase()) ||
        json.locatie_naam.toLowerCase().includes(v.naam.toLowerCase())
      );
      venue_id = match?.id || null;
    }

    // 6. Update het bestaande record met de AI-resultaten
    const { data: updated } = await supabase
      .from('bon_scans')
      .update({
        locatie_naam: json.locatie_naam || null,
        venue_id,
        dranken: json.dranken || [],
        status: 'wacht',
      })
      .eq('id', scanRecord.id)
      .select()
      .single();

    return Response.json({
      ok: true,
      scan: updated,
      venue_gevonden: !!venue_id,
      venue_naam: venue_id ? (venues || []).find(v => v.id === venue_id)?.naam : null,
    });

  } catch (e) {
    console.error('[scan-bon] fout:', e.message);
    let foutTekst = 'Er ging iets mis bij het verwerken van de bon.';
    if (e.message?.includes('ANTHROPIC') || e.message?.includes('api_key')) {
      foutTekst = 'AI service is niet geconfigureerd. Neem contact op met de beheerder.';
    } else if (e.message?.includes('storage') || e.message?.includes('bucket')) {
      foutTekst = 'Foto kon niet worden opgeslagen. Probeer het opnieuw.';
    } else if (e.message?.includes('JSON') || e.message?.includes('parse')) {
      foutTekst = 'AI kon de bon niet lezen. Probeer een duidelijkere foto.';
    }
    return Response.json({ error: foutTekst, detail: e.message }, { status: 500 });
  }
}
