import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    years: z.string(),
    body: z.string(),
    order: z.number(),
    tags: z.array(z.string()),
  }),
});

export const collections = { work };
