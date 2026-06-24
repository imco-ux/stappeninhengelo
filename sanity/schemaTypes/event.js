export default {
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    { name: 'title',     title: 'Naam event',   type: 'string',   validation: R => R.required() },
    { name: 'venue',     title: 'Locatie',       type: 'string',   validation: R => R.required() },
    {
      name: 'type', title: 'Type', type: 'string',
      options: { list: ['Feestcafé', 'Club', 'Karaoke', 'Live', 'Terras', 'Anders'] },
    },
    {
      name: 'dag', title: 'Dag', type: 'string',
      options: { list: ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'] },
      validation: R => R.required(),
    },
    { name: 'tijd',      title: 'Begintijd (bv. 22:00)', type: 'string' },
    { name: 'ticketUrl', title: 'Ticket link (optioneel)', type: 'url' },
    { name: 'omschrijving', title: 'Omschrijving', type: 'text', rows: 3 },
    { name: 'afbeelding', title: 'Afbeelding', type: 'image', options: { hotspot: true } },
    {
      name: 'status', title: 'Status', type: 'string',
      options: { list: ['concept', 'ter_goedkeuring', 'gepubliceerd', 'afgewezen'] },
      initialValue: 'ter_goedkeuring',
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'venue', media: 'afbeelding' },
  },
};
