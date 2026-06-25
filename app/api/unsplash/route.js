export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  if (!query) return Response.json({ results: [] });

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return Response.json({ error: 'Geen Unsplash API key geconfigureerd' }, { status: 500 });

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&client_id=${key}`;
  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: 'Unsplash API fout' }, { status: res.status });

  const data = await res.json();
  const results = (data.results || []).map(foto => ({
    id: foto.id,
    url: foto.urls.regular,
    thumb: foto.urls.small,
    alt: foto.alt_description || query,
    auteur: foto.user?.name || 'Unsplash',
    auteurUrl: foto.user?.links?.html || 'https://unsplash.com',
  }));
  return Response.json({ results });
}
