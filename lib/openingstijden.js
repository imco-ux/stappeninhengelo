const WEEK = ['Zo','Ma','Di','Wo','Do','Vr','Za'];

function tijdNaarMinuten(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function berekenOpenStatus(openingstijden) {
  if (!openingstijden) return null;
  const nu = new Date();
  const dagNaam = WEEK[nu.getDay()];
  const nuMin = nu.getHours() * 60 + nu.getMinutes();

  function isOpenOp(dag, minuten) {
    const t = openingstijden[dag];
    if (!t || t.gesloten || !t.open) return false;
    const openMin = tijdNaarMinuten(t.open);
    let sluitMin = tijdNaarMinuten(t.sluit);
    if (sluitMin === null) return false;
    if (sluitMin < openMin) sluitMin += 1440;
    return minuten >= openMin && minuten < sluitMin;
  }

  // Gisteren open, sluit na middernacht vandaag?
  const gisteren = WEEK[(nu.getDay() + 6) % 7];
  const tGister = openingstijden[gisteren];
  if (tGister && !tGister.gesloten && tGister.open && tGister.sluit) {
    const openMin = tijdNaarMinuten(tGister.open);
    const sluitMin = tijdNaarMinuten(tGister.sluit);
    if (sluitMin < openMin && nuMin < sluitMin) {
      return { open: true, sluitOm: tGister.sluit };
    }
  }

  const vandaag = openingstijden[dagNaam];
  if (vandaag && !vandaag.gesloten && vandaag.open) {
    if (isOpenOp(dagNaam, nuMin)) {
      return { open: true, sluitOm: vandaag.sluit };
    }
    const openMin = tijdNaarMinuten(vandaag.open);
    if (nuMin < openMin) {
      return { open: false, openstOm: vandaag.open, dagLabel: 'vandaag' };
    }
  }

  for (let i = 1; i <= 7; i++) {
    const volgende = WEEK[(nu.getDay() + i) % 7];
    const t = openingstijden[volgende];
    if (t && !t.gesloten && t.open) {
      const dagLabels = ['morgen','overmorgen','over 3 dagen','over 4 dagen','over 5 dagen','over 6 dagen'];
      return { open: false, openstOm: t.open, dagLabel: dagLabels[i - 1] || `over ${i} dagen`, dagNaam: volgende };
    }
  }
  return { open: false, openstOm: null };
}
