// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// SSR on Cloudflare Workers. The landing page opts into static prerendering
// (`export const prerender = true`); API routes and /dashboard stay dynamic.
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true, configPath: './wrangler.jsonc' },
  }),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: { enabled: false },
});
