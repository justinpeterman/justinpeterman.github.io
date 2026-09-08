// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import partytown from '@astrojs/partytown';

const theme = 'bold';
const activeTheme = fileURLToPath(
  new URL(`./src/themes/${theme}/Home.astro`, import.meta.url),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://justinpeterman.com',
  output: 'static',
  integrations: [partytown({ config: { forward: ['dataLayer.push'] } })],
  vite: {
    resolve: {
      alias: {
        '@active-theme': activeTheme,
      },
    },
  },
});
