'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="text-6xl mb-6">👤</div>
        <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-2">Binnenkort</p>
        <h1 className="text-5xl font-black uppercase leading-none mb-4"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
          ACCOUNT
        </h1>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
          Binnenkort kun je hier je favoriete kroegen opslaan, notificaties instellen en je stappen-geschiedenis bekijken.
        </p>
        <div className="mt-8 px-5 py-3 rounded-xl border border-[#2a2a2a] text-gray-600 text-xs uppercase tracking-wide">
          Komt eraan 🚀
        </div>
      </div>
      <Footer />
    </main>
  );
}
