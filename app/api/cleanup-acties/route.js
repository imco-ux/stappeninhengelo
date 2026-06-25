import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const vandaag = new Date().toISOString().slice(0, 10);
  // Verwijder acties die verlopen zijn (niet onbepaald, geen vaste_dagen, geldig_tot < vandaag)
  const { error, count } = await supabase
    .from('acties')
    .delete({ count: 'exact' })
    .eq('onbepaalde_tijd', false)
    .is('vaste_dagen', null)
    .lt('geldig_tot', vandaag);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ verwijderd: count ?? 0 });
}
