import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  'mailto:imco@viosevents.nl',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler() {
  // Haal alle geplande notificaties op die nu verstuurd moeten worden
  const nu = new Date().toISOString();
  const { data: gepland } = await supabase
    .from('push_gepland')
    .select('*')
    .eq('verstuurd', false)
    .lte('verstuur_op', nu);

  if (!gepland || gepland.length === 0) return;

  const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
  if (!subs || subs.length === 0) return;

  for (const notif of gepland) {
    const payload = JSON.stringify({ title: notif.title, body: notif.body, url: notif.url || '/' });
    let verstuurd = 0;

    await Promise.allSettled(
      subs.map(async ({ subscription }) => {
        try {
          await webpush.sendNotification(subscription, payload);
          verstuurd++;
        } catch (e) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
          }
        }
      })
    );

    // Markeer als verstuurd
    await supabase.from('push_gepland').update({ verstuurd: true, verstuurd_naar: verstuurd }).eq('id', notif.id);

    // Sla op in geschiedenis
    await supabase.from('push_geschiedenis').insert({
      title: notif.title,
      body: notif.body,
      url: notif.url,
      verstuurd_naar: verstuurd,
    });
  }
}

export const config = {
  schedule: '* * * * *', // elke minuut
};
