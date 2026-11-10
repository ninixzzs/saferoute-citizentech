import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';

interface NavigationMapProps {
  currentPosition: [number, number];
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  onZoneClick?: (zone: DangerZone) => void;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  currentPosition,
  selectedRoute,
  dangerZones,
  incidents,
  isNavigating,
  onZoneClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on São Paulo Centro/Paulista
    const map = L.map(mapContainerRef.current, {
      center: currentPosition,
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Matter CartoDB Tiles for high-tech cyberpunk / security command center look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    const isSafe = selectedRoute.type === 'segura';
    const routeColor = isSafe ? '#10b981' : '#f59e0b'; // Green if safe, Amber/Red if standard

    const polyline = L.polyline(selectedRoute.path, {
      color: routeColor,
      weight: 6,
      opacity: 0.85,
      dashArray: isSafe ? undefined : '8, 8',
    }).addTo(map);

    routePolylineRef.current = polyline;

    // Pan map to fit route smoothly
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  }, [selectedRoute]);

  // Update Danger Zones (Circles & Warning markers)
  useEffect(() => {
    const layerGroup = zonesLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    dangerZones.forEach((zone) => {
      const color =
        zone.riskLevel === 'critico'
          ? '#ef4444'
          : zone.riskLevel === 'alto'
          ? '#f97316'
          : '#eab308';

      // Geofence Circle with pulsing radar style
      const circle = L.circle(zone.coordinates, {
        color: color,
        fillColor: color,
        fillOpacity: 0.22,
        radius: zone.radiusMeters,
        weight: 2,
        dashArray: '4, 4',
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 800; font-size: 13px; color: ${color}; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
            ${zone.name}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
            ${zone.neighborhood} &bull; Risco ${zone.riskLevel}
          </div>
          <div style="margin-top: 6px; color: #f1f5f9; font-weight: 600;">
            ${zone.title}
          </div>
          <div style="margin-top: 6px; padding: 8px; background: rgba(245, 158, 11, 0.12); border-left: 3px solid #f59e0b; border-radius: 4px; color: #fef08a;">
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
          background: #dc2626;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 12px rgba(220, 38, 38, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'incident-marker-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(inc.coordinates, { icon: customIcon });
      marker.bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: #f87171;">${inc.title}</strong>
          <p style="margin: 4px 0; color: #cbd5e1;">${inc.description}</p>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            ${inc.neighborhood} &bull; ${inc.timestamp} &bull; ${inc.confirmationsCount} confirmações
          </div>
        </div>
      `);

      marker.addTo(layerGroup);
    });
  }, [incidents]);

  // Update Car Navigation Position & Center (Google Maps Navigation Puck)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const carHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          animation: radar-pulse 1.8s infinite;
        "></div>
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1d4ed8;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4), 0 0 16px rgba(29, 78, 216, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style="transform: rotate(0deg); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
            <polygon points="12,2 20,21 12,17 4,21"/>
          </svg>
        </div>
      </div>
    `;

    const carIcon = L.divIcon({
      html: carHtml,
      className: 'car-navigation-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
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
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs shadow-xl space-y-2 pointer-events-auto max-w-[210px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>Camadas do Radar</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-300"></span>
          <span className="text-slate-300">Zona Crítica (Celular)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500/80 border border-orange-300"></span>
          <span className="text-slate-300">Ponto de Atenção</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-emerald-500 rounded-full"></span>
          <span className="text-emerald-400 font-semibold">SafeRoute SP</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-amber-500 rounded-full border-dashed"></span>
          <span className="text-amber-400">Rota Convencional</span>
        </div>
      </div>
    </div>
  );
};
