import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemaTypes';

export default defineConfig({
  name: 'stappeninhengelo',
  title: 'Stappen In Hengelo — CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'jouw-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
