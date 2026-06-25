'use client';

import { useState } from 'react';
import emailjs from '@emailjs/browser';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SERVICE_ID  = 'service_5wovhiq';
const TEMPLATE_ID = 'template_5dhewgj';
const PUBLIC_KEY  = 'oHD3HvhZPo_-koG35';

const ONDERWERPEN = [
  'Algemene vraag',
  'Event aanmelden',
  'Locatie toevoegen',
  'Samenwerking',
  'Fout melden',
  'Anders',
];

export default function ContactPage() {
  const [form, setForm] = useState({ from_name: '', from_email: '', onderwerp: '', bericht: '' });
  const [bezig, setBezig] = useState(false);
  const [status, setStatus] = useState(null); // 'ok' | 'fout'

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function verstuur(e) {
    e.preventDefault();
    setBezig(true);
    setStatus(null);
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY);
      setStatus('ok');
      setForm({ from_name: '', from_email: '', onderwerp: '', bericht: '' });
    } catch {
      setStatus('fout');
    }
    setBezig(false);
  }

  const INP = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-oranje transition-colors placeholder-gray-600';

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
          <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>CONTACT</h1>
          <p className="text-gray-500 text-sm mt-2">Vragen, ideeën of wil je samenwerken? Stuur een bericht.</p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto">

          {status === 'ok' ? (
            <div className="rounded-2xl border border-green-800/40 bg-green-950/20 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-2xl font-black uppercase text-white mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>Bericht verstuurd!</h2>
              <p className="text-gray-400 text-sm mb-6">We nemen zo snel mogelijk contact met je op.</p>
              <button onClick={() => setStatus(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-black"
                style={{ backgroundColor: '#F27A00' }}>
                Nog een bericht sturen
              </button>
            </div>
          ) : (
            <form onSubmit={verstuur} className="space-y-4">
              {status === 'fout' && (
                <div className="rounded-xl bg-red-950/30 border border-red-800/40 px-4 py-3 text-red-400 text-sm">
                  Er ging iets mis. Probeer het opnieuw of mail direct naar <a href="mailto:imco@viosevents.nl" className="underline">imco@viosevents.nl</a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Naam *</label>
                  <input value={form.from_name} onChange={e => upd('from_name', e.target.value)}
                    required placeholder="Jouw naam" className={INP} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">E-mailadres *</label>
                  <input type="email" value={form.from_email} onChange={e => upd('from_email', e.target.value)}
                    required placeholder="jouw@email.nl" className={INP} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Onderwerp *</label>
                <select value={form.onderwerp} onChange={e => upd('onderwerp', e.target.value)}
                  required className={INP + ' cursor-pointer'}>
                  <option value="">Kies een onderwerp...</option>
                  {ONDERWERPEN.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Bericht *</label>
                <textarea value={form.bericht} onChange={e => upd('bericht', e.target.value)}
                  required rows={6} placeholder="Schrijf hier je bericht..."
                  className={INP + ' resize-none'} />
              </div>

              <button type="submit" disabled={bezig}
                className="w-full py-4 rounded-xl font-black uppercase text-black text-sm disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {bezig ? 'Versturen...' : 'Verstuur bericht →'}
              </button>

              <p className="text-gray-600 text-xs text-center">
                Of mail direct naar <a href="mailto:imco@viosevents.nl" className="text-oranje hover:underline">imco@viosevents.nl</a>
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
