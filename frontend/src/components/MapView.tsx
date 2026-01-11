'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VoiceInput from './VoiceInput';

interface Route {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number][];
    };
    properties: any;
  }>;
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([13.0827, 80.2707], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers for nodes
    const nodes = [
      { id: 1, name: 'Central Chennai', lat: 13.0827, lng: 80.2707 },
      { id: 2, name: 'Marina Beach', lat: 13.0878, lng: 80.2799 },
      { id: 3, name: 'Anna University', lat: 13.0604, lng: 80.2451 },
      { id: 4, name: 'Guindy Station', lat: 13.0050, lng: 80.2250 },
    ];

    nodes.forEach((node) => {
      L.circleMarker([node.lat, node.lng], {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(`<b>${node.name}</b><br/>ID: ${node.id}`)
        .addTo(map);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  const fetchRoute = async (start: number, end: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/routes/${start}/${end}`
      );
      const data: Route = await res.json();

      setRoute(data);

      // Remove old route if exists
      if (routeLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }

      // Draw new route
      if (
        data.features &&
        data.features.length > 0 &&
        mapInstanceRef.current
      ) {
        const coordinates = data.features[0].geometry.coordinates.map(
          (coord) => [coord[1], coord[0]] // Swap lat/lng
        );

        const polyline = L.polyline(coordinates as L.LatLngExpression[], {
          color: '#ef4444',
          weight: 4,
          opacity: 0.8,
          dashArray: '5, 5',
        }).addTo(mapInstanceRef.current);

        routeLayerRef.current = polyline;

        // Fit map to route
        mapInstanceRef.current.fitBounds(polyline.getBounds());
      }
    } catch (error) {
      console.error('Route error:', error);
    }
    setLoading(false);
  };

  const handleVoiceDestination = (destination: string, nodeId: number) => {
    fetchRoute(1, nodeId); // Always route from node 1 (Central Chennai)
  };

  return (
    <div className="flex flex-col h-screen gap-4 p-4 bg-gray-50">
      {/* Voice Input Component */}
      <VoiceInput onDestination={handleVoiceDestination} />

      {/* Manual Route Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => fetchRoute(1, 2)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
        >
          1 → 2 (Marina)
        </button>
        <button
          onClick={() => fetchRoute(2, 3)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
        >
          2 → 3 (Anna Uni)
        </button>
        <button
          onClick={() => fetchRoute(1, 3)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
        >
          1 → 3 (Direct)
        </button>
        <button
          onClick={() => fetchRoute(3, 4)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
        >
          3 → 4 (Guindy)
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="flex-1 rounded-lg shadow-lg"
        style={{ minHeight: '500px' }}
      />

      {/* Route Status */}
      {route && (
        <div className="p-4 bg-green-100 border border-green-400 rounded text-green-800">
          <p className="text-sm font-semibold">
            ✅ Route found with {route.features.length} segment(s)
          </p>
        </div>
      )}
    </div>
  );
}
