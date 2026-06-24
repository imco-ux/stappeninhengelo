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

function localNaarISO(local) {
  if (!local) return null;
  return new Date(local).toISOString();
}

function isoNaarLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminNotificaties() {
  const [form, setForm] = useState({ title: '', body: '', url: '/', gepland: false, verstuur_op: '' });
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState('');
  const [aantalSubs, setAantalSubs] = useState(null);
  const [geschiedenis, setGeschiedenis] = useState([]);
  const [geplandeLijst, setGeplandeLijst] = useState([]);

  useEffect(() => { laad(); }, []);

  async function laad() {
    const [subRes, histRes, geplandRes] = await Promise.all([
      supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('push_geschiedenis').select('*').order('verstuurd_op', { ascending: false }).limit(20),
      supabase.from('push_gepland').select('*').eq('verstuurd', false).order('verstuur_op', { ascending: true }),
    ]);
    setAantalSubs(subRes.count || 0);
    setGeschiedenis(histRes.data || []);
    setGeplandeLijst(geplandRes.data || []);
  }

  function upd(v, w) { setForm(f => ({ ...f, [v]: w })); }

  async function verstuur(e) {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setBezig(true);

    try {
      if (form.gepland && form.verstuur_op) {
        // Inplannen
        const { error } = await supabase.from('push_gepland').insert({
          title: form.title,
          body: form.body,
          url: form.url,
          verstuur_op: localNaarISO(form.verstuur_op),
          verstuurd: false,
        });
        if (error) throw new Error(error.message);
        setMelding(`✓ Ingepland voor ${new Date(form.verstuur_op).toLocaleString('nl-NL')}`);
      } else {
        // Direct versturen
        const res = await fetch('/api/push-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, body: form.body, url: form.url }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        await supabase.from('push_geschiedenis').insert({
          title: form.title, body: form.body, url: form.url, verstuurd_naar: data.verstuurd,
        });
        setMelding(`✓ Verstuurd naar ${data.verstuurd} apparaten`);
      }
      setForm({ title: '', body: '', url: '/', gepland: false, verstuur_op: '' });
      laad();
    } catch (e) {
      setMelding('❌ Fout: ' + e.message);
    }

    setBezig(false);
    setTimeout(() => setMelding(''), 5000);
  }

  async function annuleerGepland(id) {
    if (!confirm('Geplande notificatie annuleren?')) return;
    await supabase.from('push_gepland').delete().eq('id', id);
    setGeplandeLijst(l => l.filter(x => x.id !== id));
  }

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje';

  // Minimum datetime = nu + 2 minuten
  const minDT = new Date(Date.now() + 2 * 60000).toISOString().slice(0, 16);

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

        <form onSubmit={verstuur} className="rounded-xl border border-[#1e1e1e] p-6 space-y-4 mb-6" style={{ backgroundColor: '#141414' }}>
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

          {/* Inplannen toggle */}
          <div className="border-t border-[#1e1e1e] pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => upd('gepland', !form.gepland)}
                className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${form.gepland ? 'bg-oranje' : 'bg-[#333]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.gepland ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-300 font-semibold">Inplannen voor later</span>
            </label>

            {form.gepland && (
              <div className="mt-3">
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Datum & tijd</label>
                <input
                  type="datetime-local"
                  value={form.verstuur_op}
                  min={minDT}
                  onChange={e => upd('verstuur_op', e.target.value)}
                  required={form.gepland}
                  className={INP + ' [color-scheme:dark]'}
                />
                <p className="text-xs text-gray-600 mt-1">Wordt automatisch verstuurd op het gekozen moment</p>
              </div>
            )}
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
            {bezig ? 'Bezig...' : form.gepland
              ? `Inplannen →`
              : `Verstuur nu naar ${aantalSubs || 0} apparaten →`}
          </button>
        </form>

        {/* Geplande notificaties */}
        {geplandeLijst.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-black uppercase mb-3" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
              Ingepland
            </h2>
            <div className="space-y-2">
              {geplandeLijst.map(g => (
                <div key={g.id} className="rounded-xl border border-yellow-800/40 p-4" style={{ backgroundColor: '#1a1400' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 text-xs font-bold">⏰ {new Date(g.verstuur_op).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-white font-bold text-sm">{g.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{g.body}</p>
                      {g.url && g.url !== '/' && <p className="text-oranje text-xs mt-1">→ {g.url}</p>}
                    </div>
                    <button onClick={() => annuleerGepland(g.id)}
                      className="text-red-400 text-xs border border-red-900/40 px-2 py-1 rounded hover:bg-red-950/30 flex-shrink-0">
                      Annuleer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
