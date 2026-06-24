import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { subscription } = await req.json();
    if (!subscription?.endpoint) {
      return Response.json({ error: 'Geen geldige subscription' }, { status: 400 });
    }
    await supabase.from('push_subscriptions').upsert(
      { endpoint: subscription.endpoint, subscription: subscription },
      { onConflict: 'endpoint' }
    );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
