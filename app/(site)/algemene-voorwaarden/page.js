import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Algemene Voorwaarden | Stappen In Hengelo',
  description: 'Lees onze algemene voorwaarden over datagebruik, advertenties en AI-gegenereerde inhoud.',
};

const SECTIES = [
  {
    titel: '1. Over Stappen In Hengelo',
    tekst: `Stappen In Hengelo is een platform voor uitgaansinformatie in Hengelo. Wij bieden een overzicht van evenementen, horecagelegenheden, prijzen en nieuws rondom het Hengelose uitgaansleven.

Door gebruik te maken van onze website of webapp ga je akkoord met deze algemene voorwaarden.`,
  },
  {
    titel: '2. Gegevensverzameling en gerichte advertenties',
    tekst: `Stappen In Hengelo verzamelt gegevens over jouw gebruik van het platform. Dit omvat onder andere:

• Bezochte pagina's en evenementen
• Locatievoorkeur en zoekgedrag
• Apparaat- en browserinformatie
• Interacties met content

Deze gegevens worden gebruikt om jou gerichte advertenties te tonen die aansluiten op jouw interesses. Wij kunnen hiervoor samenwerken met derde partijen zoals advertentienetwerken en sociale mediaplatforms.

Je kunt je afmelden voor gepersonaliseerde advertenties via de instellingen van je browser of apparaat.`,
  },
  {
    titel: '3. Bedrijfs- en eventinformatie via externe bronnen',
    tekst: `Informatie over horecazaken en evenementen op ons platform kan afkomstig zijn uit externe bronnen, waaronder Google. Dit betreft gegevens zoals:

• Naam, adres en openingstijden van horecagelegenheden
• Beschrijvingen van evenementen en locaties
• Foto's en overige publieke bedrijfsinformatie

Deze informatie wordt vooraf ingevuld op basis van beschikbare openbare gegevens. Eigenaren van horecagelegenheden of organisatoren van evenementen kunnen hun gegevens aanpassen via het bedrijfsdashboard op ons platform.

Stappen In Hengelo is niet verantwoordelijk voor de juistheid van automatisch ingeladen externe informatie. We raden bedrijven aan hun profiel te claimen en up-to-date te houden.`,
  },
  {
    titel: '4. AI-gegenereerde en bewerkte inhoud',
    tekst: `Stappen In Hengelo maakt gebruik van kunstmatige intelligentie (AI) voor het aanmaken en bewerken van content. Dit kan van toepassing zijn op:

• Nieuwsberichten en redactionele teksten
• Beschrijvingen van evenementen en locaties
• Samengevatte of herschreven informatie afkomstig uit externe bronnen

AI-gegenereerde content wordt waar mogelijk gecontroleerd op juistheid, maar kan afwijkingen bevatten. Heb je een fout gevonden? Neem dan contact met ons op.`,
  },
  {
    titel: '5. Prijsradar',
    tekst: `De prijzen die worden weergegeven in de Prijsradar zijn op verschillende manieren tot stand gekomen:

• Horecazaken kunnen zelf hun drank- en entreeprijzen invullen via hun bedrijfsdashboard.
• Als er geen actuele prijsopgave beschikbaar is, kunnen bezoekers van het platform zelf prijsinformatie aanleveren.
• In sommige gevallen worden prijzen automatisch opgehaald via externe bronnen zoals Google of andere openbare databronnen.

Stappen In Hengelo kan niet garanderen dat alle weergegeven prijzen volledig actueel of correct zijn. De prijzen dienen uitsluitend als indicatie. Aan de gepubliceerde prijzen kunnen geen rechten worden ontleend.`,
  },
  {
    titel: '6. Auteursrechten en intellectueel eigendom',
    tekst: `Alle originele content op Stappen In Hengelo — waaronder teksten, afbeeldingen en het platform zelf — is eigendom van Stappen In Hengelo tenzij anders vermeld.

Foto's die via Unsplash worden gebruikt, zijn gelicenseerd onder de Unsplash-licentie en zijn vrij te gebruiken voor commerciële doeleinden. De fotograaf wordt waar mogelijk vermeld.

Het is niet toegestaan content van dit platform te kopiëren, distribueren of commercieel te gebruiken zonder voorafgaande schriftelijke toestemming.`,
  },
  {
    titel: '7. Aansprakelijkheid',
    tekst: `Stappen In Hengelo doet haar best om actuele en correcte informatie te bieden, maar kan niet instaan voor de volledigheid, juistheid of beschikbaarheid van de gepubliceerde informatie.

Wij zijn niet aansprakelijk voor:
• Schade als gevolg van onjuiste of verouderde informatie
• Schade door het niet kunnen bereiken van de website
• Schade door handelingen van derden waarop wij geen invloed hebben`,
  },
  {
    titel: '8. Wijzigingen',
    tekst: `Stappen In Hengelo behoudt het recht deze voorwaarden te allen tijde te wijzigen. Wijzigingen worden gepubliceerd op deze pagina. We raden je aan deze pagina periodiek te raadplegen.`,
  },
  {
    titel: '9. Contact',
    tekst: `Heb je vragen over deze voorwaarden of over het gebruik van jouw gegevens? Neem dan contact op via:

info@stappen-in-hengelo.nl`,
  },
];

export default function AlgemeneVoorwaardenPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />

      <section className="py-10 px-4 border-b border-[#1a1a1a]" style={{ background: 'linear-gradient(180deg, #0d0d0d 0%, #000 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-oranje text-xs font-bold uppercase tracking-widest mb-1">Stappen In Hengelo</p>
          <h1 className="text-5xl font-black uppercase leading-none" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
            Algemene Voorwaarden
          </h1>
          <p className="text-gray-500 text-sm mt-2">Laatst bijgewerkt: juni 2026</p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          {SECTIES.map((s, i) => (
            <div key={i}>
              <h2 className="text-xl font-black uppercase mb-3 text-white" style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}>
                {s.titel}
              </h2>
              <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {s.tekst}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
