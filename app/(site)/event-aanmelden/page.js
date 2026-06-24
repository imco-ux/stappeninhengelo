'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const initialState = {
  naamEvent: '',
  venue: '',
  datum: '',
  begintijd: '',
  type: '',
  ticketLink: '',
  omschrijving: '',
  naamOrganisator: '',
  email: '',
  akkoord: false,
};

export default function EventAanmeldenPage() {
  const [form, setForm] = useState(initialState);
  const [ingediend, setIngediend] = useState(false);
  const [fouten, setFouten] = useState({});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fouten[name]) setFouten((prev) => ({ ...prev, [name]: null }));
  }

  function valideer() {
    const nieuweFouten = {};
    if (!form.naamEvent.trim())        nieuweFouten.naamEvent = 'Verplicht';
    if (!form.venue.trim())            nieuweFouten.venue = 'Verplicht';
    if (!form.datum)                   nieuweFouten.datum = 'Verplicht';
    if (!form.begintijd)               nieuweFouten.begintijd = 'Verplicht';
    if (!form.type)                    nieuweFouten.type = 'Verplicht';
    if (!form.naamOrganisator.trim())  nieuweFouten.naamOrganisator = 'Verplicht';
    if (!form.email.trim())            nieuweFouten.email = 'Verplicht';
    if (!form.akkoord)                 nieuweFouten.akkoord = 'Verplicht';
    return nieuweFouten;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const f = valideer();
    if (Object.keys(f).length > 0) {
      setFouten(f);
      return;
    }
    setIngediend(true);
  }

  const inputClass = (naam) =>
    `w-full bg-[#181818] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-oranje transition-colors ${
      fouten[naam] ? 'border-red-500' : 'border-[#2a2a2a]'
    }`;

  if (ingediend) {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🎉</div>
            <h1
              className="text-4xl font-black uppercase mb-4"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: '#F27A00' }}
            >
              Bedankt!
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              We bekijken je aanmelding en nemen contact op via <strong>{form.email}</strong>.
            </p>
            <a
              href="/"
              className="inline-block px-8 py-3 rounded-lg font-bold uppercase tracking-wide text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#F27A00', color: '#000' }}
            >
              Terug naar home
            </a>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />

      {/* Paginakop */}
      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #1a0800 0%, #000 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Voor organisatoren</p>
          <h1
            className="text-5xl font-black uppercase leading-none"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            EVENT AANMELDEN
          </h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Organiseer jij een event in Hengelo? Meld het hier aan. Na goedkeuring verschijnt het op de website.
          </p>
        </div>
      </section>

      {/* Formulier */}
      <section className="px-4 py-10">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

          {/* Naam event */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Naam event <span className="text-oranje">*</span>
            </label>
            <input
              name="naamEvent"
              value={form.naamEvent}
              onChange={handleChange}
              placeholder="bijv. Tropical Night"
              className={inputClass('naamEvent')}
            />
            {fouten.naamEvent && <p className="text-red-400 text-xs mt-1">{fouten.naamEvent}</p>}
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Locatie / venue <span className="text-oranje">*</span>
            </label>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="bijv. High5, Marktstraat 5"
              className={inputClass('venue')}
            />
            {fouten.venue && <p className="text-red-400 text-xs mt-1">{fouten.venue}</p>}
          </div>

          {/* Datum + Begintijd */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Datum <span className="text-oranje">*</span>
              </label>
              <input
                type="date"
                name="datum"
                value={form.datum}
                onChange={handleChange}
                className={inputClass('datum') + ' [color-scheme:dark]'}
              />
              {fouten.datum && <p className="text-red-400 text-xs mt-1">{fouten.datum}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Begintijd <span className="text-oranje">*</span>
              </label>
              <input
                type="time"
                name="begintijd"
                value={form.begintijd}
                onChange={handleChange}
                className={inputClass('begintijd') + ' [color-scheme:dark]'}
              />
              {fouten.begintijd && <p className="text-red-400 text-xs mt-1">{fouten.begintijd}</p>}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Type event <span className="text-oranje">*</span>
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className={inputClass('type') + ' [color-scheme:dark]'}
            >
              <option value="">Kies een type…</option>
              <option>Feestcafé</option>
              <option>Club</option>
              <option>Karaoke</option>
              <option>Live</option>
              <option>Anders</option>
            </select>
            {fouten.type && <p className="text-red-400 text-xs mt-1">{fouten.type}</p>}
          </div>

          {/* Ticket link */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Ticket link <span className="text-gray-600">(optioneel)</span>
            </label>
            <input
              name="ticketLink"
              value={form.ticketLink}
              onChange={handleChange}
              placeholder="https://ticketswap.nl/..."
              className={inputClass('ticketLink')}
            />
          </div>

          {/* Omschrijving */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Omschrijving <span className="text-gray-600">(optioneel)</span>
            </label>
            <textarea
              name="omschrijving"
              value={form.omschrijving}
              onChange={handleChange}
              rows={4}
              placeholder="Vertel kort wat dit event inhoudt…"
              className={inputClass('omschrijving') + ' resize-none'}
            />
          </div>

          {/* Scheidingslijn */}
          <div className="border-t border-[#2a2a2a] pt-6">
            <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-5">Jouw gegevens</p>

            {/* Naam organisator */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Naam organisator <span className="text-oranje">*</span>
              </label>
              <input
                name="naamOrganisator"
                value={form.naamOrganisator}
                onChange={handleChange}
                placeholder="Jouw naam of organisatienaam"
                className={inputClass('naamOrganisator')}
              />
              {fouten.naamOrganisator && <p className="text-red-400 text-xs mt-1">{fouten.naamOrganisator}</p>}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                E-mailadres <span className="text-oranje">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jouw@email.nl"
                className={inputClass('email')}
              />
              {fouten.email && <p className="text-red-400 text-xs mt-1">{fouten.email}</p>}
            </div>
          </div>

          {/* Akkoord */}
          <div>
            <label className={`flex items-start gap-3 cursor-pointer ${fouten.akkoord ? 'text-red-400' : 'text-gray-400'}`}>
              <input
                type="checkbox"
                name="akkoord"
                checked={form.akkoord}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 accent-oranje flex-shrink-0"
              />
              <span className="text-sm">
                Ik ga akkoord met de voorwaarden van Stappen In Hengelo. Het event kan worden geweigerd of aangepast.{' '}
                <span className="text-oranje">*</span>
              </span>
            </label>
            {fouten.akkoord && <p className="text-red-400 text-xs mt-1 ml-7">Verplicht</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl font-black uppercase text-xl tracking-wide transition-all hover:scale-[1.02] active:scale-95 hover:opacity-90"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", backgroundColor: '#F27A00', color: '#000' }}
          >
            Event aanmelden →
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}
