import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    companyUrl: z.string().url().optional(),
    years: z.string(),
    body: z.string(),
    bodyLink: z.object({ label: z.string().min(1), url: z.string().url() }).optional(),
    highlights: z.array(z.object({ lead: z.string(), text: z.string() })),
    order: z.number(),
    tags: z.array(z.string()),
  }),
});

export const collections = { work };
