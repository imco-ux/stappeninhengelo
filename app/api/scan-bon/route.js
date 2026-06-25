import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Drankcategorieën die wij bijhouden op de site
const DRANK_CATEGORIEEN = ['Bier', 'Wijn', 'Mixdrank', 'Cocktail', 'Hard Seltzer', 'Shot', 'Frisdrank'];

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
  "venue_id": "id van de locatie als die overeenkomt met een bekende locatie, anders null",
  "venue_gevonden": true of false,
  "dranken": [
    { "naam": "naam van de drank", "prijs": 2.50, "categorie": "Bier" }
  ]
}

Regels voor dranken:
- Haal ALLEEN dranken eruit die in één van deze categorieën vallen: ${DRANK_CATEGORIEEN.join(', ')}
- Geen water, koffie, thee, eten of andere niet-alcoholische items (behalve Frisdrank)
- Prijs als getal zonder €
- Kies de dichtstbijzijnde categorie uit de lijst
- Vergelijk de locatienaam op de bon met de bekende locaties (ook als de spelling iets afwijkt)
- Als je de venue_id niet kunt bepalen, geef null
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
    return Response.json({ error: e.message }, { status: 500 });
  }
}
