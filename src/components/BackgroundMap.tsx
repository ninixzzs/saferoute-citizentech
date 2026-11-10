import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NavigationRoute } from '../types';

interface BackgroundMapProps {
  selectedRoute: NavigationRoute;
  currentPosition: [number, number];
}

export const BackgroundMap: React.FC<BackgroundMapProps> = ({
  selectedRoute,
  currentPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-23.5505, -46.6333], // São Paulo Centro
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    // Sleek dark architectural vector map of São Paulo
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    mapRef.current = map;

    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync background map smoothly to active route in São Paulo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedRoute.path || selectedRoute.path.length === 0) return;

    if (polylineRef.current) polylineRef.current.remove();

    polylineRef.current = L.polyline(selectedRoute.path, {
      color: '#1a73e8',
      weight: 4,
      opacity: 0.45,
      lineCap: 'round',
    }).addTo(map);

    try {
      const bounds = L.latLngBounds(selectedRoute.path);
      map.flyToBounds(bounds, { padding: [120, 120], maxZoom: 14, duration: 1.5 });
    } catch {}
  }, [selectedRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(currentPosition, { animate: true, duration: 1.5 });
  }, [currentPosition]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Live São Paulo Map Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full opacity-55 scale-[1.02]"
      />
      {/* Refined Glass Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/90 backdrop-blur-[1.5px]" />
    </div>
  );
};
