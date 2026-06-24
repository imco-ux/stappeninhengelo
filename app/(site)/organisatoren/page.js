import Header from '@/components/Header';
import Footer from '@/components/Footer';

const voordelen = [
  { icon: '📅', titel: 'Events op de agenda', tekst: 'Jouw events komen direct op de homepage en de volledige agenda. Bereik alle stapelaars van Hengelo.' },
  { icon: '🏷️', titel: 'Acties promoten', tekst: 'Publiceer happy hours, kortingen en arrangementen op de Acties pagina. Wekelijks of eenmalig.' },
  { icon: '📊', titel: 'Dashboard (binnenkort)', tekst: 'Bewerk je eigen locatiepagina, voeg posters toe en beheer je agenda. Dashboard in aanbouw.' },
  { icon: '💰', titel: 'Gratis om mee te doen', tekst: 'Aanmelden en vermelden is volledig gratis. We verdienen later aan premium features.' },
];

export default function OrganisatorenPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(135deg, #1a0800 0%, #2B1400 50%, #000 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#F27A00' }} />
        <div className="max-w-4xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-3">Stappen In Hengelo — Voor organisatoren</p>
          <h1 className="font-black uppercase leading-none mb-6" style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
            JIJ BEPAALT<br />
            <span style={{ color: '#F27A00' }}>HET UITGAANSLEVEN</span><br />
            VAN HENGELO
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mb-8">
            Organiseer jij events, run je een café of club? Meld je aan bij Stappen In Hengelo en bereik duizenden bezoekers die elke week op zoek zijn naar de beste avond uit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/event-aanmelden"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black uppercase text-xl tracking-wide hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}
            >
              Event aanmelden →
            </a>
            <a
              href="mailto:info@stappeninhengelo.nl"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold uppercase text-sm tracking-wide border-2 border-oranje text-oranje hover:bg-oranje hover:text-black transition-colors"
            >
              Contact opnemen
            </a>
          </div>
        </div>
      </section>

      {/* Voordelen */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black uppercase mb-8" style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}>
            WAAROM MEEDOEN?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {voordelen.map((v) => (
              <div key={v.titel} className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-xl font-black uppercase mb-2" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                  {v.titel}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="px-4 py-12 border-t border-[#1a1a1a]" style={{ backgroundColor: '#0a0500' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black uppercase mb-8" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            HOE WERKT HET?
          </h2>
          <ol className="space-y-5">
            {[
              { stap: '1', titel: 'Meld je event aan', tekst: 'Vul het formulier in met naam, datum, tijd, adres en type event.' },
              { stap: '2', titel: 'Wij beoordelen het', tekst: 'We checken het event en nemen binnen 24 uur contact met je op.' },
              { stap: '3', titel: 'Live op de website', tekst: 'Na goedkeuring staat je event op de agenda en homepage van Stappen In Hengelo.' },
            ].map((s) => (
              <li key={s.stap} className="flex gap-5">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-black text-black flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#F27A00', fontFamily: "'Big Shoulders Display', sans-serif" }}
                >
                  {s.stap}
                </span>
                <div>
                  <p className="font-black uppercase text-lg" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>{s.titel}</p>
                  <p className="text-gray-400 text-sm">{s.tekst}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 p-5 rounded-2xl border border-oranje/30 bg-oranje/5">
            <p className="text-oranje font-bold uppercase text-sm tracking-wide mb-2">Vragen?</p>
            <p className="text-gray-300 text-sm">Stuur een mail naar <a href="mailto:info@stappeninhengelo.nl" className="text-oranje underline">info@stappeninhengelo.nl</a> of DM ons op Instagram <a href="https://instagram.com/stappeninhengelo" target="_blank" rel="noopener noreferrer" className="text-oranje underline">@stappeninhengelo</a>.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
