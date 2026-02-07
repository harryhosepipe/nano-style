// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: true,
  },
  vite: {
    server: {
      // Allow Cloudflare quick tunnel hostnames during local sharing.
      allowedHosts: ['.trycloudflare.com'],
    },
  },
});
