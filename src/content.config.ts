import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lectures = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lectures' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    lecture: z.number(),
  }),
});

export const collections = { lectures };
