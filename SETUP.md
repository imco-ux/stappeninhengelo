# Stappen In Hengelo — Website Setup

## Vereisten
- Node.js 18+ geïnstalleerd (nodejs.org)
- Een gratis account op sanity.io
- Een gratis account op vercel.com (voor live zetten)

---

## Stap 1 — Project installeren

Open Terminal (Mac) of Command Prompt (Windows) in deze map en typ:

```
npm install
```

---

## Stap 2 — Sanity project aanmaken

1. Ga naar **sanity.io** en maak een gratis account
2. Maak een nieuw project aan, noem het "Stappen In Hengelo"
3. Kies dataset: **production**
4. Kopieer je **Project ID** (staat in de instellingen)

---

## Stap 3 — .env.local aanmaken

Maak een bestand `.env.local` in deze map (kopieer `.env.local.example`) en vul in:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=jouw-project-id-hier
NEXT_PUBLIC_SANITY_DATASET=production
```

---

## Stap 4 — Lokaal starten

```
npm run dev
```

Open dan je browser op **http://localhost:3000**

De website staat live op je computer.
Je CMS (Sanity Studio) staat op **http://localhost:3000/studio**

---

## Stap 5 — Live zetten op Vercel

1. Zet de map op GitHub (github.com, gratis)
2. Ga naar vercel.com → "Import Project" → kies je GitHub repo
3. Voeg de environment variables toe (zelfde als .env.local)
4. Klik Deploy — je site is live op een vercel.app URL
5. Koppel je TransIP domein in de Vercel instellingen (DNS instructies geeft Vercel automatisch)

---

## Content beheren

Na setup ga je naar **/studio** op je website en log je in met je Sanity account.

Daar kun je:
- **Events toevoegen** (naam, dag, tijd, locatie, ticket link, foto)
- **Highlights/nieuws plaatsen**
- Alles **goedkeuren of afwijzen** (via het status veld)

---

## Vragen?

Stel ze aan Claude in Cowork — die heeft alle context van dit project.
