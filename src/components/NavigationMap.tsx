import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { Layers, Sun, Moon } from 'lucide-react';

interface NavigationMapProps {
  currentPosition: [number, number];
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  onZoneClick?: (zone: DangerZone) => void;
  className?: string;
  defaultTheme?: 'google-light' | 'google-dark';
  showLegend?: boolean;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  currentPosition,
  selectedRoute,
  dangerZones,
  incidents,
  isNavigating,
  onZoneClick,
  className = '',
  defaultTheme = 'google-light',
  showLegend = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapTheme, setMapTheme] = useState<'google-light' | 'google-dark'>(defaultTheme);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentPosition,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Google Maps style tile providers
    const tileUrl =
      mapTheme === 'google-light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Critical fix: Force map to calculate dimensions and render tiles immediately
    const triggerResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    const timer1 = setTimeout(triggerResize, 100);
    const timer2 = setTimeout(triggerResize, 350);
    const timer3 = setTimeout(triggerResize, 800);

    // ResizeObserver ensures map updates whenever its parent container flexes or resizes
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        triggerResize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileUrl =
      mapTheme === 'google-light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [mapTheme]);

  // Update Route Polyline with authentic Google Maps styling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    const isSafe = selectedRoute.type === 'segura';
    // Google Maps signature blue or safety emerald green
    const routeColor = isSafe ? '#0d904f' : '#1a73e8';

    const polyline = L.polyline(selectedRoute.path, {
      color: routeColor,
      weight: 7,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routePolylineRef.current = polyline;

    // Adjust view
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    setTimeout(() => map.invalidateSize(), 150);
  }, [selectedRoute]);

  // Update Danger Zones (Circles & Warning markers)
  useEffect(() => {
    const layerGroup = zonesLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    dangerZones.forEach((zone) => {
      const color =
        zone.riskLevel === 'critico'
          ? '#d93025'
          : zone.riskLevel === 'alto'
          ? '#ea580c'
          : '#f59e0b';

      const circle = L.circle(zone.coordinates, {
        color: color,
        fillColor: color,
        fillOpacity: 0.22,
        radius: zone.radiusMeters,
        weight: 2,
        dashArray: '5, 5',
      });

      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.45; min-width: 220px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: ${color}; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
            ${zone.name}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">
            ${zone.neighborhood} &bull; Risco ${zone.riskLevel}
          </div>
          <div style="margin-top: 6px; font-weight: 600; color: #202124;">
            ${zone.title}
          </div>
          <div style="margin-top: 6px; padding: 8px; background: #fef7e0; border-left: 3px solid #f9ab00; border-radius: 4px; color: #202124; font-size: 11px;">
            <strong>Defesa Civil SP:</strong> ${zone.defenseCivilTip}
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on('click', () => {
        if (onZoneClick) onZoneClick(zone);
      });

      circle.addTo(layerGroup);
    });
  }, [dangerZones, onZoneClick]);

  // Update Incident markers
  useEffect(() => {
    const layerGroup = incidentsLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    incidents.forEach((inc) => {
      const iconHtml = `
        <div style="
          background: #d93025;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        ">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'incident-marker-pin',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(inc.coordinates, { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #202124;">
          <strong style="color: #d93025;">${inc.title}</strong>
          <p style="margin: 4px 0; color: #3c4043;">${inc.description}</p>
          <div style="font-size: 10px; color: #70757a; margin-top: 4px;">
            ${inc.neighborhood} &bull; ${inc.timestamp} &bull; ${inc.confirmationsCount} confirmações
          </div>
        </div>
      `);

      marker.addTo(layerGroup);
    });
  }, [incidents]);

  // Update Car Navigation Position & Center (Authentic Google Maps navigation puck)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const carHtml = `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <!-- Directional flashlight cone beam -->
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 22px solid transparent;
          border-right: 22px solid transparent;
          border-bottom: 40px solid rgba(26, 115, 232, 0.28);
          top: -16px;
          pointer-events: none;
        "></div>
        <!-- Pulsing accuracy circle -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(26, 115, 232, 0.2);
          animation: radar-pulse 1.8s infinite;
        "></div>
        <!-- Center Blue Puck -->
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1a73e8;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 2;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));">
            <polygon points="12,2 20,21 12,17 4,21"/>
          </svg>
        </div>
      </div>
    `;

    const carIcon = L.divIcon({
      html: carHtml,
      className: 'car-navigation-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(currentPosition, { icon: carIcon }).addTo(map);
    } else {
      carMarkerRef.current.setLatLng(currentPosition);
    }

    if (isNavigating) {
      map.panTo(currentPosition, { animate: true, duration: 1 });
    }
  }, [currentPosition, isNavigating]);

  return (
    <div
      className={`relative w-full h-full min-h-[380px] overflow-hidden bg-[#e8eaed] ${className}`}
    >
      {/* Actual Leaflet mount point */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating Theme Switcher & Map Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={() =>
            setMapTheme(mapTheme === 'google-light' ? 'google-dark' : 'google-light')
          }
          className="p-2 rounded-lg bg-white/95 text-slate-700 hover:bg-white shadow-md border border-slate-200 transition-colors"
          title={
            mapTheme === 'google-light'
              ? 'Mudar para Google Maps Noite'
              : 'Mudar para Google Maps Dia'
          }
        >
          {mapTheme === 'google-light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>
      </div>

      {/* Optional Map Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 text-[11px] shadow-lg space-y-1.5 pointer-events-auto max-w-[200px] text-slate-800">
          <div className="font-bold border-b border-slate-200 pb-1 flex items-center justify-between text-slate-900">
            <span>Legenda de Segurança</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Área Crítica (Furto Celular)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-emerald-600 rounded-full"></span>
            <span className="font-semibold text-emerald-700">SafeRoute SP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-blue-600 rounded-full"></span>
            <span>Rota Mais Rápida</span>
          </div>
        </div>
      )}
    </div>
  );
};
