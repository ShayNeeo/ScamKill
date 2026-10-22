// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  session: {
    driver: 'memory',
  },
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [react(), svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: { enabled: false },
});
