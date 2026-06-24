'use client';

import { useState, useEffect } from 'react';

const VAPID_PUBLIC = 'BCLcbmZwiJPXUVyskqNNRrykNdwydOBZdZgpn845qWOv6GCIlUcFvEiaWXBdAyRhRQMW61rHrxw9FOY6R2dG-R8';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushToestemming() {
  const [status, setStatus] = useState('laden'); // laden | niet-gevraagd | gevraagd | geabonneerd | geblokkeerd | niet-ondersteund
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('niet-ondersteund');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'granted') {
      setStatus('geabonneerd');
    } else if (perm === 'denied') {
      setStatus('geblokkeerd');
    } else {
      const alGevraagd = localStorage.getItem('push_gevraagd');
      setStatus(alGevraagd ? 'gevraagd' : 'niet-gevraagd');
    }
  }, []);

  async function abonneer() {
    setBezig(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
      localStorage.setItem('push_gevraagd', '1');
      setStatus('geabonneerd');
    } catch (e) {
      if (Notification.permission === 'denied') setStatus('geblokkeerd');
      else setStatus('gevraagd');
    }
    setBezig(false);
  }

  if (status === 'laden' || status === 'geabonneerd' || status === 'niet-ondersteund' || status === 'geblokkeerd' || status === 'gevraagd') return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-oranje/30 p-4 flex items-center gap-4" style={{ backgroundColor: '#0a0500' }}>
      <div className="text-2xl flex-shrink-0">🔔</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">Meldingen ontvangen?</p>
        <p className="text-gray-500 text-xs mt-0.5">Blijf op de hoogte van events en aanbiedingen</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => { localStorage.setItem('push_gevraagd', '1'); setStatus('gevraagd'); }}
          className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1">
          Nee
        </button>
        <button onClick={abonneer} disabled={bezig}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-black disabled:opacity-50"
          style={{ backgroundColor: '#F27A00' }}>
          {bezig ? '...' : 'Ja'}
        </button>
      </div>
    </div>
  );
}
