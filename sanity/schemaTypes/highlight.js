export default {
  name: 'highlight',
  title: 'Highlight / Nieuws',
  type: 'document',
  fields: [
    { name: 'title',     title: 'Titel',      type: 'string', validation: R => R.required() },
    { name: 'excerpt',   title: 'Korte tekst', type: 'text',   rows: 3 },
    {
      name: 'categorie', title: 'Categorie', type: 'string',
      options: { list: ['Nieuws', 'Feature', 'Events', 'Locatie'] },
    },
    { name: 'afbeelding', title: 'Afbeelding', type: 'image', options: { hotspot: true } },
    { name: 'gepubliceerdOp', title: 'Datum', type: 'date' },
  ],
  preview: {
    select: { title: 'title', subtitle: 'categorie', media: 'afbeelding' },
  },
};
