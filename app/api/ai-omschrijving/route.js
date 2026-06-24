import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  const { naam, type, adres, tags, reviews, openingstijden } = await request.json();
  if (!naam) return NextResponse.json({ error: 'naam vereist' }, { status: 400 });

  const reviewTeksten = (reviews || []).slice(0, 3).map(r => `"${r.tekst}"`).join('\n');
  const tagLijst = (tags || []).join(', ');
  const openDagen = openingstijden
    ? Object.entries(openingstijden).filter(([, t]) => !t.gesloten && t.open).map(([dag, t]) => `${dag} ${t.open}–${t.sluit}`).join(', ')
    : null;

  const prompt = `Schrijf een aantrekkelijke, sfeervolle omschrijving voor een horecazaak in Hengelo voor een uitgaansplatform.
Maximaal 2-3 zinnen. Schrijf in het Nederlands. Informeel en uitnodigend van toon. Geen clichés.

Naam: ${naam}
Type: ${type || 'café'}
Adres: ${adres || 'Hengelo'}
${tagLijst ? `Kenmerken: ${tagLijst}` : ''}
${openDagen ? `Open op: ${openDagen}` : ''}
${reviewTeksten ? `Wat bezoekers zeggen:\n${reviewTeksten}` : ''}

Geef alleen de omschrijving terug, geen aanhalingstekens of uitleg.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    const tekst = message.content[0]?.text?.trim() || '';
    return NextResponse.json({ omschrijving: tekst });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
