import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  compressHTML: true,
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss(), viteCompression({ algorithm: 'gzip', threshold: 1024 })],
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'one-dark-pro',
    },
  },
});
