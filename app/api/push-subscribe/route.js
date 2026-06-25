import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  try {
    const { subscription } = await req.json();
    if (!subscription?.endpoint) {
      return Response.json({ error: 'Geen geldige subscription' }, { status: 400 });
    }
    const { error } = await supabase.from('push_subscriptions').upsert(
      { endpoint: subscription.endpoint, subscription: subscription },
      { onConflict: 'endpoint' }
    );
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
