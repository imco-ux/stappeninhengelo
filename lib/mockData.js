// ── Datum helpers ─────────────────────────────────────────────────────
const DAGEN   = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MAANDEN = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

function datumVanaf(dagOffset) {
  const d = new Date();
  d.setDate(d.getDate() + dagOffset);
  return d.toISOString().split('T')[0];
}
function nextWeekday(targetDay) {
  const now = new Date();
  const diff = (targetDay - now.getDay() + 7) % 7 || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().split('T')[0];
}
function formatDatum(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${DAGEN[d.getDay()]} ${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}
function dagNaam(iso) {
  const d = new Date(iso + 'T12:00:00');
  const naam = DAGEN[d.getDay()];
  return naam.charAt(0).toUpperCase() + naam.slice(1);
}

const vrDate  = nextWeekday(5);
const zaDate  = nextWeekday(6);
const zoDate  = nextWeekday(0);
const maDate  = datumVanaf(1);
const diDate  = datumVanaf(2);
const woDate  = datumVanaf(3);
const doDate  = datumVanaf(4);

// Volgende week
function nextWeekdayPlus(targetDay, extraWeeks = 1) {
  const now = new Date();
  const diff = (targetDay - now.getDay() + 7) % 7 || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + diff + extraWeeks * 7);
  return d.toISOString().split('T')[0];
}
const vr2Date = nextWeekdayPlus(5, 1);
const za2Date = nextWeekdayPlus(6, 1);
const zo2Date = nextWeekdayPlus(0, 1);
const do2Date = nextWeekdayPlus(4, 1);
const vr3Date = nextWeekdayPlus(5, 2);
const za3Date = nextWeekdayPlus(6, 2);

// ── Events ────────────────────────────────────────────────────────────
export const mockEvents = [
  {
    _id: '1',
    title: 'Weekendkick Good Fellows',
    slug: 'weekendkick-good-fellows',
    venue: 'Good Fellows',
    venueSlug: 'good-fellows',
    type: 'Feestcafé',
    dag: dagNaam(vrDate),
    datum: vrDate,
    datumLabel: formatDatum(vrDate),
    tijd: '22:00 – 05:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€5,–',
    leeftijd: '18+',
    adres: 'Beekstraat 12, Hengelo',
    omschrijving: 'Het weekend begint bij Good Fellows! DJ Stephan draait de beste urban, R&B en dancehits. Vol = vol.',
    posterUrl: '/images/poster-good-fellows-wk.png',
  },
  {
    _id: '2',
    title: "90's & 00's Party",
    slug: '90s-00s-party',
    venue: 'Good Fellows',
    venueSlug: 'good-fellows',
    type: 'Club',
    dag: dagNaam(zaDate),
    datum: zaDate,
    datumLabel: formatDatum(zaDate),
    tijd: '22:00 – 05:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€5,–',
    leeftijd: '18+',
    adres: 'Beekstraat 12, Hengelo',
    omschrijving: "De beste nummers van de jaren 90 en 00. Van Spice Girls tot Eminem — nostalgie in optima forma.",
    posterUrl: '/images/poster-ss-event.png',
  },
  {
    _id: '3',
    title: 'Karaoke Night',
    slug: 'karaoke-night',
    venue: 'Zing It!',
    venueSlug: 'zing-it',
    type: 'Karaoke',
    dag: dagNaam(vrDate),
    datum: vrDate,
    datumLabel: formatDatum(vrDate),
    tijd: '21:00 – 01:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '18+',
    adres: 'Centrumplein 4, Hengelo',
    omschrijving: 'Pak de microfoon en zing mee. Open podium én privé-cabines beschikbaar.',
    posterUrl: '/images/poster-karaoke.png',
  },
  {
    _id: '4',
    title: 'Nacht Van Hengelo',
    slug: 'nacht-van-hengelo',
    venue: 'De Loft XL',
    venueSlug: 'de-loft-xl',
    type: 'Club',
    dag: dagNaam(zaDate),
    datum: zaDate,
    datumLabel: formatDatum(zaDate),
    tijd: '22:00 – 06:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€15,–',
    leeftijd: '18+',
    adres: 'Industriestraat 48, Hengelo',
    omschrijving: 'Het grootste club-event van Hengelo. 3 zalen, 6 artiesten en een onvergetelijke nacht.',
    posterUrl: '/images/poster-nacht-van-hengelo.png',
  },
  {
    _id: '5',
    title: 'Joe Party',
    slug: 'joe-party',
    venue: 'High5 Hengelo',
    venueSlug: 'high5-hengelo',
    type: 'Feestcafé',
    dag: dagNaam(zaDate),
    datum: zaDate,
    datumLabel: formatDatum(zaDate),
    tijd: '23:00 – 04:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '25+',
    adres: 'Marktstraat 15, Hengelo',
    omschrijving: 'Joe Party is terug. De gezelligste avond van de week met de beste classics.',
    posterUrl: '/images/poster-joe-party.png',
  },
  {
    _id: '6',
    title: 'Karaoke Sunday',
    slug: 'karaoke-sunday',
    venue: 'Zing It!',
    venueSlug: 'zing-it',
    type: 'Karaoke',
    dag: dagNaam(zoDate),
    datum: zoDate,
    datumLabel: formatDatum(zoDate),
    tijd: '19:00 – 00:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '18+',
    adres: 'Centrumplein 4, Hengelo',
    omschrijving: 'Sluit het weekend af met een epische karaoke sessie. Gratis drankje voor iedereen die optreedt!',
    posterUrl: '/images/poster-karaoke.png',
  },
  {
    _id: '7',
    title: 'Jazz & Borrel Avond',
    slug: 'jazz-borrel',
    venue: 'Anno 1890',
    venueSlug: 'anno-1890',
    type: 'Live',
    dag: dagNaam(doDate),
    datum: doDate,
    datumLabel: formatDatum(doDate),
    tijd: '19:00 – 23:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '25+',
    adres: 'Enschedesestraat 55, Hengelo',
    omschrijving: 'Live jazz met een goed glas wijn of bier. Perfecte donderdagavond in de sfeervolste wijnbar van Hengelo.',
    posterUrl: null,
  },
  {
    _id: '8',
    title: 'Open Podium',
    slug: 'open-podium',
    venue: 'Cactus Cafe',
    venueSlug: 'cactus-cafe',
    type: 'Live',
    dag: dagNaam(woDate),
    datum: woDate,
    datumLabel: formatDatum(woDate),
    tijd: '20:00 – 23:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '25+',
    adres: 'Marktstraat 20, Hengelo',
    omschrijving: 'Lokale artiesten op het podium van Cactus Cafe. Iedere woensdag — intiem en puur.',
    posterUrl: null,
  },
  {
    _id: '9',
    title: 'Deep House Sessions',
    slug: 'deep-house-sessions',
    venue: 'The Green Room',
    venueSlug: 'the-green-room',
    type: 'Club',
    dag: dagNaam(vrDate),
    datum: vrDate,
    datumLabel: formatDatum(vrDate),
    tijd: '22:00 – 04:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€5,–',
    leeftijd: '18+',
    adres: 'Brinkstraat 10, Hengelo',
    omschrijving: 'Deep, melodische house in de sfeervol verlichte lounge van The Green Room.',
    posterUrl: null,
  },
  {
    _id: '10',
    title: 'Craft Bier Festival',
    slug: 'craft-bier-festival',
    venue: 'Twentse Bierbrouwerij',
    venueSlug: 'twentse-bierbrouwerij',
    type: 'Live',
    dag: dagNaam(zaDate),
    datum: zaDate,
    datumLabel: formatDatum(zaDate),
    tijd: '14:00 – 22:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€8,–',
    leeftijd: '18+',
    adres: 'Gieterijstraat 3, Hengelo',
    omschrijving: 'Proef meer dan 30 craft bieren van lokale en regionale brouwerijen. Live muziek de hele dag.',
    posterUrl: null,
  },

  // ── Volgende week ──
  {
    _id: '11',
    title: 'Vrijdagnacht Good Fellows',
    slug: 'vrijdagnacht-good-fellows-2',
    venue: 'Good Fellows',
    venueSlug: 'good-fellows',
    type: 'Feestcafé',
    dag: dagNaam(vr2Date),
    datum: vr2Date,
    datumLabel: formatDatum(vr2Date),
    tijd: '22:00 – 05:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€5,–',
    leeftijd: '18+',
    adres: 'Beekstraat 12, Hengelo',
    omschrijving: 'Terug voor een nieuwe nacht vol urban en dancehits. DJ Stephan staat weer achter de draaitafels.',
    posterUrl: '/images/poster-good-fellows-wk.png',
  },
  {
    _id: '12',
    title: 'Latin Night',
    slug: 'latin-night',
    venue: 'Café Road House',
    venueSlug: 'cafe-road-house',
    type: 'Feestcafé',
    dag: dagNaam(vr2Date),
    datum: vr2Date,
    datumLabel: formatDatum(vr2Date),
    tijd: '21:00 – 03:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '21+',
    adres: 'Willemstraat 35, Hengelo',
    omschrijving: 'Salsa, bachata en reggaeton. Dé avond voor Latin lovers in Hengelo. Gratis entree!',
    posterUrl: null,
  },
  {
    _id: '13',
    title: 'Nacht Van Hengelo II',
    slug: 'nacht-van-hengelo-2',
    venue: 'De Loft XL',
    venueSlug: 'de-loft-xl',
    type: 'Club',
    dag: dagNaam(za2Date),
    datum: za2Date,
    datumLabel: formatDatum(za2Date),
    tijd: '22:00 – 06:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€12,–',
    leeftijd: '18+',
    adres: 'Industriestraat 48, Hengelo',
    omschrijving: 'De tweede editie van Nacht Van Hengelo. 3 zalen, top-artiesten en een onvergetelijke nacht.',
    posterUrl: '/images/poster-nacht-van-hengelo.png',
  },
  {
    _id: '14',
    title: 'Karaoke Marathon',
    slug: 'karaoke-marathon',
    venue: 'Zing It!',
    venueSlug: 'zing-it',
    type: 'Karaoke',
    dag: dagNaam(zo2Date),
    datum: zo2Date,
    datumLabel: formatDatum(zo2Date),
    tijd: '16:00 – 23:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '18+',
    adres: 'Centrumplein 4, Hengelo',
    omschrijving: '7 uur nonstop karaoke. Kampioenschapformaat — de beste zanger wint een fles champagne!',
    posterUrl: '/images/poster-karaoke.png',
  },
  {
    _id: '15',
    title: 'Borrel Donderdag',
    slug: 'borrel-donderdag',
    venue: 'Bar Bistro Loev',
    venueSlug: 'bar-bistro-loev',
    type: 'Live',
    dag: dagNaam(do2Date),
    datum: do2Date,
    datumLabel: formatDatum(do2Date),
    tijd: '17:00 – 22:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '25+',
    adres: 'Brinkstraat 5, Hengelo',
    omschrijving: 'Gezellige borrelborrel bij Loev. Hapjes, cocktails en live gitarist. Start van het weekend op z\'n Hengeloers.',
    posterUrl: null,
  },

  // ── Over twee weken ──
  {
    _id: '16',
    title: 'SS Summer Party',
    slug: 'ss-summer-party',
    venue: 'Good Fellows',
    venueSlug: 'good-fellows',
    type: 'Club',
    dag: dagNaam(vr3Date),
    datum: vr3Date,
    datumLabel: formatDatum(vr3Date),
    tijd: '22:00 – 06:00',
    ticketUrl: 'https://ticketswap.nl',
    prijs: '€8,–',
    leeftijd: '18+',
    adres: 'Beekstraat 12, Hengelo',
    omschrijving: 'Het zomerfeest van het jaar. Buitenpodium, 4 DJ\'s en zomerse cocktails. Limiteerde tickets beschikbaar!',
    posterUrl: '/images/poster-ss-event.png',
  },
  {
    _id: '17',
    title: 'Joe Party Summer Edition',
    slug: 'joe-party-summer',
    venue: 'High5 Hengelo',
    venueSlug: 'high5-hengelo',
    type: 'Feestcafé',
    dag: dagNaam(za3Date),
    datum: za3Date,
    datumLabel: formatDatum(za3Date),
    tijd: '23:00 – 04:00',
    ticketUrl: null,
    prijs: 'Gratis',
    leeftijd: '25+',
    adres: 'Marktstraat 15, Hengelo',
    omschrijving: 'Joe Party is terug — zomerse editie met terrasterras en outdoor bar. Tot ziens op het terras!',
    posterUrl: '/images/poster-joe-party.png',
  },
];

// ── Highlights ────────────────────────────────────────────────────────
export const mockHighlights = [
  {
    _id: 'h1',
    title: 'Good Fellows opent vernieuwd terras',
    excerpt: 'Vanaf deze vrijdag is het vernieuwde terras van Good Fellows open. Verwacht speciale terrasacties en een zomers programma.',
    categorie: 'Nieuws',
    datum: '23 juni 2026',
    foto: '/images/foto-sfeer-1.jpg',
  },
  {
    _id: 'h2',
    title: 'Zomer in Hengelo — het bruist',
    excerpt: 'Het centrum van Hengelo staat deze zomer volledig in het teken van stappen, feesten en genieten. Bekijk wat er allemaal te doen is.',
    categorie: 'Nieuws',
    datum: '20 juni 2026',
    foto: '/images/foto-sfeer-2.jpg',
  },
  {
    _id: 'h3',
    title: 'Nacht Van Hengelo — limited tickets',
    excerpt: 'Het grootste club-event van Hengelo komt eraan. Nog maar 50 tickets beschikbaar voor de Nacht Van Hengelo.',
    categorie: 'Events',
    datum: '18 juni 2026',
    foto: '/images/foto-sfeer-3.jpg',
  },
];

// ── Locaties (alle echte Hengelo horeca) ─────────────────────────────
export const mockLocaties = [
  { _id:'l1',  naam:'Good Fellows',          slug:'good-fellows',          type:'Feestcafé',               soort:'Feestcafé',                   adres:'Beekstraat 12, Hengelo',        lat:52.2625, lng:6.7948, leeftijd:'18-30', omschrijving:'De populairste feestcafé van Hengelo. Urban, R&B en dancehits iedere week. Grote dansvloer met professioneel lichtshow.', openingstijden:{Vrijdag:'22:00–05:00',Zaterdag:'22:00–05:00',Zondag:'Gesloten'} },
  { _id:'l2',  naam:'High5 Hengelo',         slug:'high5-hengelo',         type:'Café / Cocktailbar',      soort:'Café / Cocktailbar / Terras',  adres:'Marktstraat 15, Hengelo',       lat:52.2618, lng:6.7935, leeftijd:'25+',   omschrijving:'Cocktailbar met een groot terras op de Marktstraat. Gezellig voor een drankje voor het stappen of een late night cocktail.', openingstijden:{Vrijdag:'20:00–04:00',Zaterdag:'20:00–04:00',Zondag:'14:00–00:00'} },
  { _id:'l3',  naam:'Zing It!',              slug:'zing-it',               type:'Karaokebar',              soort:'Karaokebar',                   adres:'Centrumplein 4, Hengelo',       lat:52.2610, lng:6.7960, leeftijd:'21-45', omschrijving:"Hengelo's gezelligste karaokebar. Privé-cabines voor groepen en open podium. Perfect voor vrijgezellessen.", openingstijden:{Vrijdag:'20:00–01:00',Zaterdag:'20:00–01:00',Zondag:'19:00–00:00'} },
  { _id:'l4',  naam:'De Loft XL',            slug:'de-loft-xl',            type:'Club',                    soort:'Evenementenlocatie / Club',    adres:'Industriestraat 48, Hengelo',   lat:52.2640, lng:6.7975, leeftijd:'18+',   omschrijving:'De grootste eventlocatie van Hengelo. 3 zalen, capaciteit 1.200 man. Thuisbasis van de grootste club-events.', openingstijden:{Vrijdag:'22:00–06:00',Zaterdag:'22:00–06:00',Zondag:'Gesloten'} },
  { _id:'l5',  naam:'Café Feris',            slug:'cafe-feris',            type:'Café',                    soort:'Café',                         adres:'Marktstraat 8, Hengelo',        lat:52.2615, lng:6.7930, leeftijd:'25+',   omschrijving:'Gezellig café op de Marktstraat. Goed bier, goede muziek en vaste stamgasten. Elke avond gezellig.', openingstijden:{Vrijdag:'17:00–02:00',Zaterdag:'17:00–02:00',Zondag:'14:00–00:00'} },
  { _id:'l6',  naam:"'t Caféetje",           slug:'t-cafeeetje',           type:'Bruin café',              soort:'Bruin café',                   adres:'Enschedesestraat 30, Hengelo',  lat:52.2608, lng:6.7922, leeftijd:'25+',   omschrijving:"Klassiek bruin café met een warme sfeer. 't Caféetje is al decennialang een vaste waarde in Hengelo.", openingstijden:{Vrijdag:'16:00–01:00',Zaterdag:'14:00–01:00',Zondag:'14:00–23:00'} },
  { _id:'l7',  naam:'Café Road House',       slug:'cafe-road-house',       type:'Danscafé',                soort:'Kroeg / Danscafé',             adres:'Willemstraat 35, Hengelo',      lat:52.2632, lng:6.7920, leeftijd:'21-45', omschrijving:'Danscafé met een gevarieerde muziekkeuze van jaren 80 tot nu. Altijd een volle dansvloer op het weekend.', openingstijden:{Vrijdag:'21:00–04:00',Zaterdag:'21:00–04:00',Zondag:'Gesloten'} },
  { _id:'l8',  naam:'Feestcafé The Rits',    slug:'feestcafe-the-rits',    type:'Feestcafé',               soort:'Feestcafé',                    adres:'Nieuwstraat 12, Hengelo',       lat:52.2620, lng:6.7955, leeftijd:'18-30', omschrijving:'Energiek feestcafé in het centrum. Populaire drankacties en een enthousiaste crowd iedere vrijdag en zaterdag.', openingstijden:{Vrijdag:'21:00–04:00',Zaterdag:'21:00–04:00',Zondag:'Gesloten'} },
  { _id:'l9',  naam:'Club Merlijn',          slug:'club-merlijn',          type:'Club',                    soort:'Club',                         adres:'Oelerweg 100, Hengelo',         lat:52.2650, lng:6.7890, leeftijd:'18-30', omschrijving:'Club aan de rand van het centrum met meerdere zalen. Techno, house en urban op afwisselende avonden.', openingstijden:{Vrijdag:'22:00–05:00',Zaterdag:'22:00–05:00',Zondag:'Gesloten'} },
  { _id:'l10', naam:"Café 't Neutje",        slug:'cafe-t-neutje',         type:'Bruin café',              soort:'Bruin café',                   adres:'Burgemeesterslaan 5, Hengelo',  lat:52.2602, lng:6.7935, leeftijd:'30+',   omschrijving:'Rustig bruin café voor de iets oudere Hengelonaar. Goed bier, goed gezelschap en geen gedoe.', openingstijden:{Vrijdag:'15:00–01:00',Zaterdag:'13:00–01:00',Zondag:'13:00–23:00'} },
  { _id:'l11', naam:'Cactus Cafe',           slug:'cactus-cafe',           type:'Muziekcafé',              soort:'Muziekcafé',                   adres:'Marktstraat 20, Hengelo',       lat:52.2622, lng:6.7938, leeftijd:'25-55', omschrijving:'Muziekcafé met live optredens, open podium en muziekquiz. Voor liefhebbers van echte livemuziek.', openingstijden:{Vrijdag:'19:00–02:00',Zaterdag:'19:00–02:00',Zondag:'Gesloten'} },
  { _id:'l12', naam:'Grand Café De Twee Wezen', slug:'grand-cafe-de-twee-wezen', type:'Grand Café',        soort:'Grand Café',                   adres:'Marktplein 3, Hengelo',         lat:52.2612, lng:6.7943, leeftijd:'25+',   omschrijving:'Groots Grand Café op het Marktplein. Uitgebreide kaart, gezellige sfeer en een groot terras. Van lunch tot last minute borrel.', openingstijden:{Vrijdag:'10:00–02:00',Zaterdag:'10:00–02:00',Zondag:'11:00–00:00'} },
  { _id:'l13', naam:'De Appel',              slug:'de-appel',              type:'Restaurant / Borrel',     soort:'Restaurant / Borrel',          adres:'Haaksbergerstraat 25, Hengelo', lat:52.2605, lng:6.7950, leeftijd:'25+',   omschrijving:'Restaurant met borrelkeuken en uitgebreide drankkaart. Perfect voor een avond uit met vrienden.', openingstijden:{Vrijdag:'17:00–01:00',Zaterdag:'16:00–01:00',Zondag:'16:00–23:00'} },
  { _id:'l14', naam:'Jansen',                slug:'jansen',                type:'Café',                    soort:'Café / Terras',                adres:'Piet Heinstraat 4, Hengelo',    lat:52.2635, lng:6.7928, leeftijd:'25+',   omschrijving:"Populair café met een groot zomerterras. Jansen is dé plek om de avond te beginnen.", openingstijden:{Vrijdag:'16:00–02:00',Zaterdag:'14:00–02:00',Zondag:'13:00–23:00'} },
  { _id:'l15', naam:'Bar Bistro Loev',       slug:'bar-bistro-loev',       type:'Bistro / Cocktails',      soort:'Bistro / Cocktails',           adres:'Brinkstraat 5, Hengelo',        lat:52.2628, lng:6.7915, leeftijd:'25+',   omschrijving:'Trendy bar-bistro met culinaire cocktails en een uitgebreid borrelmenu. Sfeervol en hip.', openingstijden:{Vrijdag:'17:00–01:00',Zaterdag:'16:00–01:00',Zondag:'16:00–23:00'} },
  { _id:'l16', naam:'Lab26 Aperitivo Club',  slug:'lab26-aperitivo-club',  type:'Cocktailbar',             soort:'Cocktailbar',                  adres:'Twentestraat 26, Hengelo',      lat:52.2618, lng:6.7908, leeftijd:'25+',   omschrijving:'Exclusieve cocktailbar met Italiaanse aperitivo-cultuur. Handgemaakte cocktails en kleine hapjes.', openingstijden:{Vrijdag:'17:00–01:00',Zaterdag:'16:00–01:00',Zondag:'Gesloten'} },
  { _id:'l17', naam:'Anno 1890',             slug:'anno-1890',             type:'Wijnbar',                 soort:'Wijnbar',                      adres:'Enschedesestraat 55, Hengelo',  lat:52.2598, lng:6.7945, leeftijd:'30+',   omschrijving:'Intieme wijnbar met meer dan 80 wijnen per glas. Live jazz op donderdag en vrijdag. De rustplek van Hengelo.', openingstijden:{Vrijdag:'17:00–01:00',Zaterdag:'16:00–01:00',Zondag:'Gesloten'} },
  { _id:'l18', naam:'Het Uurwerk',           slug:'het-uurwerk',           type:'Speciaalbiercafé',        soort:'Speciaalbiercafé',             adres:'Brinkstraat 22, Hengelo',       lat:52.2626, lng:6.7912, leeftijd:'25+',   omschrijving:'Speciaalbiercafé met meer dan 100 bieren op de kaart. Proefplanken, bierborrels en een gepassioneerde bierkaart.', openingstijden:{Vrijdag:'15:00–01:00',Zaterdag:'13:00–01:00',Zondag:'13:00–23:00'} },
  { _id:'l19', naam:'The Green Room',        slug:'the-green-room',        type:'Cocktailbar / Lounge',    soort:'Cocktailbar / Lounge',         adres:'Brinkstraat 10, Hengelo',       lat:52.2624, lng:6.7910, leeftijd:'25+',   omschrijving:'Sfeervol verlichte lounge met live DJ\'s, cocktails en een ontspannen vibe. Dé plek voor een avond genieten.', openingstijden:{Vrijdag:'20:00–03:00',Zaterdag:'20:00–03:00',Zondag:'Gesloten'} },
  { _id:'l20', naam:'Stadscafé De Basiliek', slug:'stadscafe-de-basiliek', type:'Grand Café',              soort:'Lunch / Terras',               adres:'Marktplein 1, Hengelo',         lat:52.2611, lng:6.7940, leeftijd:'Iedereen', omschrijving:'Het café van Hengelo. Overdag lunch, savonds borrels. Groot terras op het Marktplein en altijd een welkome sfeer.', openingstijden:{Vrijdag:'10:00–02:00',Zaterdag:'10:00–02:00',Zondag:'11:00–23:00'} },
  { _id:'l21', naam:'Stravinsky',            slug:'stravinsky',            type:'Restaurant / Bar',        soort:'Restaurant / Hotelbar',        adres:'Steenstraat 15, Hengelo',       lat:52.2630, lng:6.7965, leeftijd:'25+',   omschrijving:'Chique hotelbar en restaurant in het hart van Hengelo. Verfijnd interieur, sterke cocktails en uitgebreid diner.', openingstijden:{Vrijdag:'12:00–01:00',Zaterdag:'12:00–01:00',Zondag:'12:00–23:00'} },
  { _id:'l22', naam:'Twentse Bierbrouwerij', slug:'twentse-bierbrouwerij', type:'Brouwerij / Restaurant',  soort:'Brouwerij / Restaurant',       adres:'Gieterijstraat 3, Hengelo',     lat:52.2645, lng:6.7982, leeftijd:'18+',   omschrijving:'Lokale ambachtelijke brouwerij met eigen restaurant. Proef de Twentse bieren direct aan de bron. Rondleidingen mogelijk.', openingstijden:{Vrijdag:'16:00–23:00',Zaterdag:'14:00–23:00',Zondag:'12:00–20:00'} },
  { _id:'l23', naam:"Bier- en Eetcafé 't Pleintje", slug:'t-pleintje',   type:'Biercafé',                soort:'Biercafé',                     adres:'Parallelweg 8, Hengelo',        lat:52.2638, lng:6.7900, leeftijd:'25+',   omschrijving:"Gezellig biercafé met uitgebreide bierkaart en simpel maar goed eetmenu. Stamkroeg voor een trouwe vaste klantenkring.", openingstijden:{Vrijdag:'15:00–01:00',Zaterdag:'13:00–01:00',Zondag:'13:00–23:00'} },
  { _id:'l24', naam:'LUST Bakery Kitchen Club', slug:'lust-bakery-kitchen-club', type:'Lunchroom / Terras', soort:'Lunchroom / Terras',          adres:'Wolterstraat 24, Hengelo',      lat:52.2604, lng:6.7958, leeftijd:'20-45', omschrijving:"Overdag bakkerij en lunchroom, 's avonds trendy bar. Groot terras en een gevarieerd publiek.", openingstijden:{Vrijdag:'08:00–00:00',Zaterdag:'08:00–00:00',Zondag:'09:00–22:00'} },
  { _id:'l25', naam:'De Hoptimist',          slug:'de-hoptimist',          type:'Bar & Keuken',            soort:'Bar & Keuken',                 adres:'Wethouder Beverstraat 12, Hengelo', lat:52.2642, lng:6.7952, leeftijd:'25+', omschrijving:'Craft bier bar met uitgebreide keuken. Meer dan 50 bieren op tap en uit de fles. Hét adres voor bierliefhebbers.', openingstijden:{Vrijdag:'16:00–01:00',Zaterdag:'14:00–01:00',Zondag:'14:00–22:00'} },
];

// ── Bierprijzen ───────────────────────────────────────────────────────
export const mockBierprijzen = [
  { venue:'Good Fellows',    slug:'good-fellows',         type:'Feestcafé',    dranken:[{naam:'Bier',prijs:2.70},{naam:'Wijn',prijs:3.20},{naam:'Mixdrank',prijs:4.50},{naam:'Hard Seltzer',prijs:3.50},{naam:'Shot',prijs:2.50},{naam:'Frisdrank',prijs:1.80}] },
  { venue:'High5 Hengelo',   slug:'high5-hengelo',        type:'Café',         dranken:[{naam:'Bier',prijs:2.90},{naam:'Wijn',prijs:3.50},{naam:'Mixdrank',prijs:5.00},{naam:'Hard Seltzer',prijs:3.80},{naam:'Shot',prijs:2.50},{naam:'Frisdrank',prijs:2.00}] },
  { venue:'Zing It!',        slug:'zing-it',              type:'Karaokebar',   dranken:[{naam:'Bier',prijs:3.00},{naam:'Wijn',prijs:3.80},{naam:'Mixdrank',prijs:5.50},{naam:'Hard Seltzer',prijs:4.00},{naam:'Shot',prijs:3.00},{naam:'Frisdrank',prijs:2.20}] },
  { venue:'De Loft XL',      slug:'de-loft-xl',           type:'Club',         dranken:[{naam:'Bier',prijs:3.50},{naam:'Wijn',prijs:4.00},{naam:'Mixdrank',prijs:6.00},{naam:'Hard Seltzer',prijs:4.50},{naam:'Shot',prijs:3.00},{naam:'Frisdrank',prijs:2.50}] },
  { venue:'Café Road House',  slug:'cafe-road-house',     type:'Danscafé',     dranken:[{naam:'Bier',prijs:2.50},{naam:'Wijn',prijs:3.00},{naam:'Mixdrank',prijs:4.00},{naam:'Hard Seltzer',prijs:3.20},{naam:'Shot',prijs:2.00},{naam:'Frisdrank',prijs:1.50}] },
  { venue:'Cactus Cafe',     slug:'cactus-cafe',          type:'Muziekcafé',   dranken:[{naam:'Bier',prijs:2.80},{naam:'Wijn',prijs:3.40},{naam:'Mixdrank',prijs:4.80},{naam:'Hard Seltzer',prijs:3.60},{naam:'Shot',prijs:2.50},{naam:'Frisdrank',prijs:1.80}] },
  { venue:'Anno 1890',       slug:'anno-1890',            type:'Wijnbar',      dranken:[{naam:'Bier',prijs:3.20},{naam:'Wijn',prijs:4.50},{naam:'Mixdrank',prijs:7.00},{naam:'Hard Seltzer',prijs:4.20},{naam:'Shot',prijs:3.50},{naam:'Frisdrank',prijs:2.00}] },
  { venue:'Het Uurwerk',     slug:'het-uurwerk',          type:'Biercafé',     dranken:[{naam:'Bier',prijs:3.50},{naam:'Wijn',prijs:3.80},{naam:'Mixdrank',prijs:5.50},{naam:'Hard Seltzer',prijs:3.90},{naam:'Shot',prijs:3.00},{naam:'Frisdrank',prijs:2.00}] },
  { venue:'The Green Room',  slug:'the-green-room',       type:'Cocktailbar',  dranken:[{naam:'Bier',prijs:3.00},{naam:'Wijn',prijs:3.80},{naam:'Mixdrank',prijs:6.50},{naam:'Hard Seltzer',prijs:4.00},{naam:'Shot',prijs:3.00},{naam:'Frisdrank',prijs:2.00}] },
  { venue:'De Hoptimist',   slug:'de-hoptimist',          type:'Biercafé',     dranken:[{naam:'Bier',prijs:3.30},{naam:'Wijn',prijs:3.60},{naam:'Mixdrank',prijs:5.00},{naam:'Hard Seltzer',prijs:3.70},{naam:'Shot',prijs:2.80},{naam:'Frisdrank',prijs:1.80}] },
];

// ── Acties / Deals ────────────────────────────────────────────────────
export const mockActies = [
  { _id:'a1', venue:'High5 Hengelo',   venueSlug:'high5-hengelo',   titel:'2 voor 1 cocktails',         omschrijving:'Elke vrijdag van 21:00 tot 23:00 betaal je voor twee cocktails de prijs van één.', type:'Wekelijks', dag:'Vrijdag',   geldigheidLabel:'Elke vrijdag · 21:00–23:00',      categorie:'Drank' },
  { _id:'a2', venue:'Good Fellows',    venueSlug:'good-fellows',     titel:'Ladies gratis entree',        omschrijving:'Dames betalen geen entree. Geldig vóór 23:00.',                                   type:'Wekelijks', dag:'Zaterdag',  geldigheidLabel:'Elke zaterdag · voor 23:00',      categorie:'Entree' },
  { _id:'a3', venue:'Café Road House', venueSlug:'cafe-road-house',  titel:'Happy Hour €2 bier',          omschrijving:'Van 17:00 tot 19:00 is een biertje slechts €2,00. Elke dag!',                    type:'Wekelijks', dag:null,        geldigheidLabel:'Elke dag · 17:00–19:00',          categorie:'Drank' },
  { _id:'a4', venue:'The Green Room',  venueSlug:'the-green-room',   titel:'Gratis shot bij aankomst',    omschrijving:'Kom je vrijdag voor 22:00? Dan krijg je een gratis welkomstshot.',                 type:'Wekelijks', dag:'Vrijdag',   geldigheidLabel:'Elke vrijdag · voor 22:00',       categorie:'Drank' },
  { _id:'a5', venue:'Zing It!',        venueSlug:'zing-it',          titel:'Vrijgezellenfeest deal',      omschrijving:'Privé karaoke zaal + 2 flessen prosecco voor €49 voor groepen van 6+.',           type:'Altijd geldig', dag:null,    geldigheidLabel:'Altijd geldig · reserveren via DM', categorie:'Arrangement' },
  { _id:'a6', venue:'Good Fellows',    venueSlug:'good-fellows',     titel:'Student korting €3 entree',   omschrijving:'Met je studentenkaart betaal je maar €3 entree op vrijdag.',                      type:'Wekelijks', dag:'Vrijdag',   geldigheidLabel:'Elke vrijdag · studentenkaart',   categorie:'Entree' },
  { _id:'a7', venue:'Het Uurwerk',     venueSlug:'het-uurwerk',      titel:'Gratis proefplank bij 4 bieren', omschrijving:'Bestel 4 bieren en krijg een gratis proefplank naar keuze.',                 type:'Altijd geldig', dag:null,    geldigheidLabel:'Altijd geldig',                   categorie:'Drank' },
  { _id:'a8', venue:'Anno 1890',       venueSlug:'anno-1890',        titel:'Wijn van de maand €3,50',    omschrijving:'Elke maand een andere wijn uitgelicht voor slechts €3,50 per glas.',               type:'Wekelijks', dag:null,        geldigheidLabel:'Hele maand geldig',               categorie:'Drank' },
];

// ── Kroegentocht opdrachten ───────────────────────────────────────────
export const kroegOpdrachtPool = [
  { tekst:'Bestel een rondje voor de groep.', type:'groep' },
  { tekst:'Foto met een onbekende — maar vraag netjes!', type:'sociaal' },
  { tekst:'Vraag de barman om zijn favoriete drankje te raden.', type:'sociaal' },
  { tekst:'Vertel een mop aan iemand aan de bar.', type:'sociaal' },
  { tekst:'60 seconden lang niet praten. Wie faalt koopt een rondje.', type:'groep' },
  { tekst:'Dansvloer op, minimaal 1 minuut dansen.', type:'actie' },
  { tekst:'Selfie van de hele groep.', type:'groep' },
  { tekst:'Iedereen die een rood kledingstuk draagt drinkt mee.', type:'groep' },
  { tekst:'Koop een drankje voor iemand die je niet kent.', type:'sociaal' },
  { tekst:'Steen-papier-schaar — verliezer betaalt de volgende ronde.', type:'groep' },
  { tekst:'Maak een Instagram Reel voor @stappeninhengelo!', type:'sociaal' },
  { tekst:"Vraag de DJ om jouw favoriete nummer te draaien.", type:'actie' },
  { tekst:'Iedereen drinkt tegelijk. Wie als laatste klaar is betaalt.', type:'groep' },
  { tekst:'Maak een ludieke TikTok-video in de kroeg.', type:'actie' },
  { tekst:'Vind iemand met dezelfde verjaardag — lukt het niet? Drinken!', type:'sociaal' },
];
