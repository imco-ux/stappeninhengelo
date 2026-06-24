'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [laden, setLaden]       = useState(false);
  const [fout, setFout]         = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLaden(true);
    setFout('');

    const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord });

    if (error) {
      setFout('E-mail of wachtwoord klopt niet. (' + error.message + ')');
      setLaden(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/">
            <img src="/images/logo-small.png" alt="Stappen In Hengelo" className="w-12 h-12 rounded-full mx-auto mb-4" />
          </a>
          <h1
            className="text-3xl font-black uppercase"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}
          >
            Stappen In Hengelo
          </h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard voor horecapartners</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#222] p-8" style={{ backgroundColor: '#141414' }}>
          <h2 className="text-xl font-black uppercase mb-6" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Inloggen
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jouw@email.nl"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1.5">
                Wachtwoord
              </label>
              <input
                type="password"
                value={wachtwoord}
                onChange={e => setWachtwoord(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-oranje transition-colors"
              />
            </div>

            {fout && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 text-red-400 text-sm">
                {fout}
              </div>
            )}

            <button
              type="submit"
              disabled={laden}
              className="w-full py-3 rounded-lg font-black uppercase tracking-wide text-sm text-black transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif", fontSize: '1rem' }}
            >
              {laden ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#222] text-center">
            <p className="text-gray-600 text-sm">
              Nog geen account?{' '}
              <a href="/dashboard/register" className="text-oranje font-semibold hover:underline">
                Aanmelden als partner →
              </a>
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
