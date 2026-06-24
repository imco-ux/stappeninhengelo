'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [stap, setStap] = useState(1); // 1 = account, 2 = bevestiging
  const [modus, setModus] = useState('nieuw'); // 'nieuw' of 'claim'
  const [form, setForm] = useState({
    email: '',
    wachtwoord: '',
    wachtwoord2: '',
    voornaam: '',
    achternaam: '',
    venue: '',
    telefoon: '',
    claimVenue: '',
    claimBewijs: '',
  });
  const [laden, setLaden]  = useState(false);
  const [fout, setFout]    = useState('');

  function update(veld, waarde) {
    setForm(f => ({ ...f, [veld]: waarde }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setFout('');

    if (form.wachtwoord !== form.wachtwoord2) {
      setFout('Wachtwoorden komen niet overeen.');
      return;
    }
    if (form.wachtwoord.length < 8) {
      setFout('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }

    setLaden(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.wachtwoord,
      options: {
        data: {
          voornaam: form.voornaam,
          achternaam: form.achternaam,
          naam: `${form.voornaam} ${form.achternaam}`.trim(),
          venue_naam: modus === 'nieuw' ? form.venue : form.claimVenue,
          telefoon: form.telefoon,
          rol: 'eigenaar',
          goedgekeurd: false,
          modus,
        },
      },
    });

    if (error) {
      setFout(error.message);
      setLaden(false);
    } else {
      // Als het een claim is, sla de claim op
      if (authData?.user) {
        // Sla op in gebruikers tabel zodat admin het kan zien
        await supabase.from('gebruikers').insert({
          user_id: authData.user.id,
          naam: `${form.voornaam} ${form.achternaam}`.trim(),
          email: form.email,
          telefoon: form.telefoon,
          venue_naam: modus === 'nieuw' ? form.venue : form.claimVenue,
          rol: 'eigenaar',
          goedgekeurd: false,
        });
        if (modus === 'claim') {
          await supabase.from('venue_claims').insert({
            user_id: authData.user.id,
            venue_naam: form.claimVenue,
            bewijs: form.claimBewijs,
            status: 'pending',
          });
        }
      }
      setStap(2);
    }
  }

  if (stap === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#F27A00' }}>
            <svg width="32" height="32" fill="none" stroke="black" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase mb-3" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Aanvraag ontvangen!
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            Bedankt <strong className="text-white">{form.voornaam} {form.achternaam}</strong>! We hebben je aanvraag voor{' '}
            <strong className="text-oranje">{form.venue}</strong> ontvangen.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Controleer je e-mail <strong className="text-white">{form.email}</strong> om je account te bevestigen.
            Na goedkeuring door ons team kun je inloggen op het dashboard.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 rounded-lg font-black uppercase text-black text-sm"
            style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            Terug naar de website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/">
            <img src="/images/logo-small.png" alt="" className="w-12 h-12 rounded-full mx-auto mb-4" />
          </a>
          <h1 className="text-3xl font-black uppercase" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
            Partner worden
          </h1>
          <p className="text-gray-500 text-sm mt-1">Meld je zaak aan op Stappen In Hengelo</p>
        </div>

        <div className="rounded-2xl border border-[#222] p-8" style={{ backgroundColor: '#141414' }}>
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Modus keuze */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button type="button" onClick={() => setModus('nieuw')}
                className="py-3 rounded-lg text-sm font-bold border transition-all"
                style={{
                  backgroundColor: modus === 'nieuw' ? '#F27A00' : 'transparent',
                  borderColor: modus === 'nieuw' ? '#F27A00' : '#333',
                  color: modus === 'nieuw' ? 'black' : '#888',
                }}>
                Nieuwe zaak toevoegen
              </button>
              <button type="button" onClick={() => setModus('claim')}
                className="py-3 rounded-lg text-sm font-bold border transition-all"
                style={{
                  backgroundColor: modus === 'claim' ? '#F27A00' : 'transparent',
                  borderColor: modus === 'claim' ? '#F27A00' : '#333',
                  color: modus === 'claim' ? 'black' : '#888',
                }}>
                Bestaande zaak claimen
              </button>
            </div>
            {modus === 'claim' && (
              <div className="bg-yellow-950/20 border border-yellow-800/30 rounded-lg px-4 py-3 text-yellow-600 text-xs">
                Staat jouw zaak al op Stappen In Hengelo? Dan kun je hem claimen. Na goedkeuring kun je hem zelf beheren.
              </div>
            )}

            {/* Persoonlijke info */}
            <div className="pb-4 border-b border-[#222] mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Jouw gegevens</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Voornaam *</label>
                    <input type="text" value={form.voornaam} onChange={e => update('voornaam', e.target.value)} required
                      placeholder="Jan"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Achternaam *</label>
                    <input type="text" value={form.achternaam} onChange={e => update('achternaam', e.target.value)} required
                      placeholder="de Vries"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">E-mailadres</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                    placeholder="jan@mijnzaak.nl"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Telefoonnummer</label>
                  <input type="tel" value={form.telefoon} onChange={e => update('telefoon', e.target.value)}
                    placeholder="06-12345678"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                </div>
              </div>
            </div>

            {/* Zaak */}
            <div className="pb-4 border-b border-[#222] mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">
                {modus === 'nieuw' ? 'Je zaak' : 'Te claimen zaak'}
              </p>
              {modus === 'nieuw' ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Naam van de zaak</label>
                  <input type="text" value={form.venue} onChange={e => update('venue', e.target.value)} required
                    placeholder="Good Fellows, Café De Kroeg..."
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Naam van de zaak (zoals op de site)</label>
                    <input type="text" value={form.claimVenue} onChange={e => update('claimVenue', e.target.value)} required
                      placeholder="Good Fellows"
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Bewijs van eigenaarschap (optioneel)</label>
                    <input type="text" value={form.claimBewijs} onChange={e => update('claimBewijs', e.target.value)}
                      placeholder="KvK-nummer, website, Instagram..."
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* Wachtwoord */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Wachtwoord</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Wachtwoord</label>
                  <input type="password" value={form.wachtwoord} onChange={e => update('wachtwoord', e.target.value)} required
                    placeholder="Minimaal 8 tekens"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Herhaal wachtwoord</label>
                  <input type="password" value={form.wachtwoord2} onChange={e => update('wachtwoord2', e.target.value)} required
                    placeholder="••••••••"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors" />
                </div>
              </div>
            </div>

            {fout && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">
                {fout}
              </div>
            )}

            <button type="submit" disabled={laden}
              className="w-full py-3 rounded-lg font-black uppercase tracking-wide text-black transition-opacity disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif", fontSize: '1rem' }}>
              {laden ? 'Aanmelden...' : 'Account aanmaken →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#222] text-center">
            <p className="text-gray-600 text-sm">
              Al een account?{' '}
              <a href="/dashboard/login" className="text-oranje font-semibold hover:underline">Inloggen →</a>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          <a href="/" className="hover:text-gray-500 transition-colors">← Terug naar de website</a>
        </p>
      </div>
    </div>
  );
}
