import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Panel Maestro NeoVox',
    short_name: 'Admin NeoVox',
    description: 'Consola de administración y soporte técnico.',
    start_url: '/login', // Te lleva directo a tu login de administrador
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#00A8E8',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}