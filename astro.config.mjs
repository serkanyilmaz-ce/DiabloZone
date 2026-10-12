import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const rawBase = process.env.BASE_PATH || '/';
const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.github.io',
  base: normalizedBase,
  output: 'static',
  vite: { plugins: [tailwindcss()], server: { proxy: { '/api/': 'http://127.0.0.1:8787' } } },
});
