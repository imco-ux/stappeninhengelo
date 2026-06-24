'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';

const SNELLE_LINKS = [
  { label: 'Agenda', url: '/agenda' },
  { label: 'Acties', url: '/acties' },
  { label: 'Kroegentocht', url: '/kroegentocht' },
  { label: 'Prijzen', url: '/prijzen' },
  { label: 'Locaties', url: '/locaties' },
];

export default function AdminNotificaties() {
  const [form, setForm] = useState({ title: '', body: '', url: '/' });
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState('');
  const [aantalSubs, setAantalSubs] = useState(null);
  const [geschiedenis, setGeschiedenis] = useState([]);

  useEffect(() => { laad(); }, []);

  async function laad() {
    const [subRes, histRes] = await Promise.all([
      supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('push_geschiedenis').select('*').order('verstuurd_op', { ascending: false }).limit(20),
    ]);
    setAantalSubs(subRes.count || 0);
    setGeschiedenis(histRes.data || []);
  }

  function upd(v, w) { setForm(f => ({ ...f, [v]: w })); }

  async function verstuur(e) {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setBezig(true);
    try {
      const res = await fetch('/api/push-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setMelding('❌ Fout: ' + data.error);
      } else {
        await supabase.from('push_geschiedenis').insert({
          title: form.title,
          body: form.body,
          url: form.url,
          verstuurd_naar: data.verstuurd,
        });
        setMelding(`✓ Verstuurd naar ${data.verstuurd} apparaten`);
        setForm({ title: '', body: '', url: '/' });
        laad();
      }
    } catch (e) {
      setMelding('❌ ' + e.message);
    }
    setBezig(false);
    setTimeout(() => setMelding(''), 5000);
  }

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje';

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Push Notificaties
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {aantalSubs !== null ? `${aantalSubs} geabonneerde apparaten` : 'Laden...'}
          </p>
        </div>

        {melding && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${melding.startsWith('❌') ? 'bg-red-950/30 border border-red-800/40 text-red-400' : 'bg-green-950/30 border border-green-800/40 text-green-400'}`}>
            {melding}
          </div>
        )}

        <form onSubmit={verstuur} className="rounded-xl border border-[#1e1e1e] p-6 space-y-4 mb-8" style={{ backgroundColor: '#141414' }}>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Titel *</label>
            <input value={form.title} onChange={e => upd('title', e.target.value)} required
              placeholder="bijv. Nieuw event toegevoegd!" maxLength={50} className={INP} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Bericht *</label>
            <textarea value={form.body} onChange={e => upd('body', e.target.value)} required rows={3}
              placeholder="bijv. Check de nieuwe acties bij Good Fellows deze vrijdag..." maxLength={120}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje resize-none" />
            <p className="text-xs text-gray-600 mt-1">{form.body.length}/120 tekens</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Link naar pagina</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SNELLE_LINKS.map(l => (
                <button key={l.url} type="button" onClick={() => upd('url', l.url)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${form.url === l.url ? 'bg-oranje border-oranje text-black' : 'border-[#333] text-gray-500 hover:border-oranje hover:text-oranje'}`}>
                  {l.label}
                </button>
              ))}
            </div>
            <input value={form.url} onChange={e => upd('url', e.target.value)}
              placeholder="/agenda of /events/slug" className={INP} />
          </div>

          {/* Preview */}
          {(form.title || form.body) && (
            <div className="rounded-xl border border-[#2a2a2a] p-4 bg-[#0d0d0d]">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Preview</p>
              <div className="flex items-start gap-3">
                <img src="/images/profile-icon.png" alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm">{form.title || 'Titel...'}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{form.body || 'Bericht...'}</p>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={bezig || aantalSubs === 0}
            className="w-full py-3 rounded-xl font-black uppercase text-sm text-black disabled:opacity-40"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
            {bezig ? 'Versturen...' : `Verstuur naar ${aantalSubs || 0} apparaten →`}
          </button>
        </form>

        {/* Geschiedenis */}
        {geschiedenis.length > 0 && (
          <div>
            <h2 className="text-lg font-black uppercase mb-3" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Eerder verstuurd
            </h2>
            <div className="space-y-2">
              {geschiedenis.map(g => (
                <div key={g.id} className="rounded-xl border border-[#1e1e1e] p-4" style={{ backgroundColor: '#141414' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-sm">{g.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{g.body}</p>
                      {g.url && g.url !== '/' && <p className="text-oranje text-xs mt-1">→ {g.url}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-600 text-xs">{new Date(g.verstuurd_op).toLocaleDateString('nl-NL')}</p>
                      <p className="text-green-400 text-xs mt-0.5">{g.verstuurd_naar} apparaten</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
