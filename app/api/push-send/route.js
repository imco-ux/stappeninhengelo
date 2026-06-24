import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

webpush.setVapidDetails(
  'mailto:imco@viosevents.nl',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(req) {
  try {
    const { title, body, url } = await req.json();
    if (!title || !body) {
      return Response.json({ error: 'Titel en bericht zijn verplicht' }, { status: 400 });
    }

    const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
    if (!subs || subs.length === 0) {
      return Response.json({ verstuurd: 0, bericht: 'Geen subscribers gevonden' });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });
    let verstuurd = 0;
    let mislukt = 0;

    await Promise.allSettled(
      subs.map(async ({ subscription }) => {
        try {
          await webpush.sendNotification(subscription, payload);
          verstuurd++;
        } catch (e) {
          mislukt++;
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
          }
        }
      })
    );

    return Response.json({ verstuurd, mislukt });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
