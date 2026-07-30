import type { MetadataRoute } from 'next';
import { JEWEL } from '@/lib/theme/tokens';

// Sprint 9 — makes the app installable. Next's file-convention manifest (not
// a static public/manifest.json + manual <link>) generates /manifest.webmanifest
// and wires it into <head> automatically; theme_color/background_color use the
// same dark-mode jade/charcoal tokens the rest of the app is built from, not
// arbitrary brand colors picked separately.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PROJECT SHRED',
    short_name: 'SHRED',
    description: 'מעקב תזונה ואימונים',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0E0C0A',
    theme_color: JEWEL.dark.jade,
    dir: 'rtl',
    lang: 'he',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
