import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Stap 1: upload de foto en sla op in de database — geeft direct een scan_id terug
export async function POST(req) {
  try {
    const formData = await req.formData();
    const bestand = formData.get('bon');
    if (!bestand) return Response.json({ error: 'Geen afbeelding ontvangen' }, { status: 400 });

    const buffer = Buffer.from(await bestand.arrayBuffer());

    const bestandsnaam = `bon-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('bonnen')
      .upload(bestandsnaam, buffer, { contentType: 'image/jpeg' });

    let afbeelding_url = null;
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('bonnen').getPublicUrl(bestandsnaam);
      afbeelding_url = urlData?.publicUrl || null;
    }

    const { data: scanRecord, error: insertError } = await supabase
      .from('bon_scans')
      .insert({ afbeelding_url, status: 'scannen', dranken: [] })
      .select()
      .single();

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

    return Response.json({ ok: true, scan_id: scanRecord.id, afbeelding_url });
  } catch (e) {
    console.error('[scan-bon upload] fout:', e.message);
    return Response.json({ error: 'Foto kon niet worden opgeslagen. Probeer het opnieuw.' }, { status: 500 });
  }
}
