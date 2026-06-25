import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const bestand = formData.get('bon');
    if (!bestand) return Response.json({ error: 'Geen afbeelding ontvangen' }, { status: 400 });

    const buffer = Buffer.from(await bestand.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = bestand.type || 'image/jpeg';

    // Upload afbeelding naar Supabase Storage
    const bestandsnaam = `bon-${Date.now()}.jpg`;
    await supabase.storage.from('bonnen').upload(bestandsnaam, buffer, { contentType: mediaType });
    const { data: urlData } = supabase.storage.from('bonnen').getPublicUrl(bestandsnaam);
    const afbeelding_url = urlData?.publicUrl || null;

    // Claude analyseert de bon
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
Geef een JSON terug met dit formaat:
{
  "locatie_naam": "naam van het café/bar/restaurant of null als onbekend",
  "dranken": [
    { "naam": "naam van de drank", "prijs": 2.50 }
  ]
}

Regels:
- Haal alleen dranken eruit (bier, wijn, cocktails, frisdrank, etc.)
- Prijs als getal (geen €)
- Als iets geen drank is, sla het over
- Als je de locatienaam niet kunt lezen, gebruik null
- Geef ALLEEN het JSON object terug, geen uitleg`
          }
        ]
      }]
    });

    const tekst = response.content[0].text.trim();
    const json = JSON.parse(tekst.replace(/```json|```/g, '').trim());

    // Sla op in Supabase
    const { data, error } = await supabase.from('bon_scans').insert({
      locatie_naam: json.locatie_naam || null,
      dranken: json.dranken || [],
      afbeelding_url,
      status: 'wacht',
    }).select().single();

    if (error) throw new Error(error.message);
    return Response.json({ ok: true, scan: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
