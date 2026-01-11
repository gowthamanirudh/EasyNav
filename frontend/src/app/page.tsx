'use client';

import dynamic from 'next/dynamic';

// Load MapView only on client (no SSR)
const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl md:text-4xl font-bold text-center">
        Voice-Enabled Map – Prototype
      </h1>
      <p className="text-gray-600 text-center max-w-xl">
        Phase 2: Basic Leaflet map rendered with OpenStreetMap tiles.
      </p>
      <div className="w-full max-w-5xl">
        <MapView />
      </div>
    </main>
  );
}
