// @ts-check
import { defineConfig } from 'astro/config';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://justinpeterman.com',
  output: 'static',
  integrations: [partytown({ config: { forward: ['dataLayer.push'] } })],
});