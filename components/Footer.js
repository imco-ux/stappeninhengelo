export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-black py-10 px-4 mt-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        <div>
          <span
            className="text-lg font-black uppercase"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            STAPPEN IN <span style={{ color: '#F27A00' }}>HENGELO</span>
          </span>
          <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest">Jouw uitgaansplatform</p>
        </div>

        <div className="flex gap-6 text-sm text-gray-500">
          <a href="/agenda"        className="hover:text-white transition-colors">Agenda</a>
          <a href="/locaties"      className="hover:text-white transition-colors">Locaties</a>
          <a href="/kroegentocht"  className="hover:text-white transition-colors">Kroegentocht</a>
          <a href="/prijzen"       className="hover:text-white transition-colors">Prijzen Radar</a>
        </div>

        <div className="flex gap-4">
          <a href="https://instagram.com/vioshengelo" target="_blank" rel="noopener noreferrer"
            className="text-gray-600 hover:text-oranje transition-colors" aria-label="Instagram">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
            className="text-gray-600 hover:text-oranje transition-colors" aria-label="Facebook">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#111] flex items-center justify-between text-xs text-gray-700">
        <span>© {new Date().getFullYear()} Stappen In Hengelo · stappeninhengelo.nl</span>
        <div className="flex gap-4">
          <a href="/algemene-voorwaarden" className="text-gray-700 hover:text-gray-500 transition-colors">Algemene voorwaarden</a>
          <a href="/dashboard" className="text-gray-700 hover:text-gray-500 transition-colors">Dashboard</a>
        </div>
      </div>
    </footer>
  );
}
