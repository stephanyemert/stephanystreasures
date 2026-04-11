// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Imperial Script",
      cssVariable: "--font-title"
    }
  ],

  output: "server",
  adapter: netlify(),
});