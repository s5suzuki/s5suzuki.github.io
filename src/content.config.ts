import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional().default([]),
    katex: z.boolean().optional().default(false),
    toc: z.boolean().optional().default(false),
  }),
});

const aboutCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/about" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
  'about': aboutCollection,
};