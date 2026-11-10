import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { Layers } from 'lucide-react';

interface NavigationMapProps {
  currentPosition: [number, number];
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  onZoneClick?: (zone: DangerZone) => void;
  className?: string;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  currentPosition,
  selectedRoute,
  dangerZones,
  incidents,
  isNavigating,
  onZoneClick,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowRef = useRef<L.Polyline | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Map Tile Layers refs
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);

  // 'satellite' (Esri World Imagery + Labels) vs 'street' (CartoDB Voyager / Google Style)
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentPosition,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    // 1. ESRI Real Photographic Satellite Layer (100% Reliable, Global, High-Res)
    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Esri World Imagery',
      }
    );

    // 2. Road Labels & Boundaries layer on top of Satellite
    const labelsLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.9,
      }
    );

    satLayer.addTo(map);
    labelsLayer.addTo(map);

    baseTileLayerRef.current = satLayer;
    labelsTileLayerRef.current = labelsLayer;

    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Trigger initial invalidation
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 350);
    const timer3 = setTimeout(() => map.invalidateSize(), 800);

    let ro: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      ro.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (ro) ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Type Switch (Satélite Real vs Mapa Vetor)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelsTileLayerRef.current) {
      map.removeLayer(labelsTileLayerRef.current);
      labelsTileLayerRef.current = null;
    }

    if (mapType === 'satellite') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      const labelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.95 }
      ).addTo(map);

      baseTileLayerRef.current = satLayer;
      labelsTileLayerRef.current = labelsLayer;
    } else {
      const streetLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);

      baseTileLayerRef.current = streetLayer;
    }

    map.invalidateSize();
  }, [mapType]);

  // Update Route Polyline & Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRoute.path || selectedRoute.path.length === 0) return;

    if (routeGlowRef.current) routeGlowRef.current.remove();
    if (routePolylineRef.current) routePolylineRef.current.remove();
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();

    const isSafe = selectedRoute.type === 'segura';
    const mainColor = isSafe ? '#1a73e8' : '#64748b';
    const glowColor = 'rgba(0, 0, 0, 0.45)';

    // Shadow underlay for high visibility and contrast
    const glowLine = L.polyline(selectedRoute.path, {
      color: glowColor,
      weight: 9,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeGlowRef.current = glowLine;

    // Main line
    const mainLine = L.polyline(selectedRoute.path, {
      color: mainColor,
      weight: 5.5,
      opacity: 0.98,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routePolylineRef.current = mainLine;

    // Origin Start Marker (Clean White Dot with Shadow)
    const originCoords = selectedRoute.path[0];
    const originHtml = `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #0f172a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        "></div>
      </div>
    `;
    const originIcon = L.divIcon({
      html: originHtml,
      className: 'origin-pin-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const originMarker = L.marker(originCoords, { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #171717; padding: 2px;">
        <strong>Ponto de Partida</strong>
        <p style="margin: 3px 0 0; font-size: 11px;">Início do trajeto</p>
      </div>
    `);
    originMarkerRef.current = originMarker;

    // Destination Pin (Red Pin)
    const destCoords = selectedRoute.path[selectedRoute.path.length - 1];
    const destHtml = `
      <div style="position: relative; width: 34px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));">
        <div style="
          width: 30px;
          height: 30px;
          background: #ef4444;
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
        <div style="width: 8px; height: 3px; background: rgba(0,0,0,0.5); border-radius: 50%; filter: blur(1px); margin-top: 1px;"></div>
      </div>
    `;

    const destIcon = L.divIcon({
      html: destHtml,
      className: 'dest-pin-marker',
      iconSize: [34, 42],
      iconAnchor: [17, 39],
    });

    const marker = L.marker(destCoords, { icon: destIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #171717; padding: 2px;">
        <strong style="color: #ef4444;">📍 Destino</strong>
        <p style="margin: 3px 0 0; font-size: 11px;">${selectedRoute.name}</p>
      </div>
    `);
    destinationMarkerRef.current = marker;

    // Smoothly fly camera to encompass the full calculated route
    try {
      const bounds = L.latLngBounds(selectedRoute.path);
      map.flyToBounds(bounds, { padding: [45, 45], duration: 1.2 });
    } catch {}
  }, [selectedRoute]);

  // Update Danger Zones
  useEffect(() => {
    const layerGroup = zonesLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    dangerZones.forEach((zone) => {
      const circle = L.circle(zone.coordinates, {
        color: '#ff334b',
        fillColor: '#ff1744',
        fillOpacity: 0.22,
        radius: zone.radiusMeters,
        weight: 2,
        dashArray: '5, 5',
      });

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #171717; min-width: 200px;">
          <div style="font-weight: 700; color: #dc2626; margin-bottom: 2px;">
            ⚠️ Alerta &bull; ${zone.neighborhood}
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${zone.name}
          </div>
          <div style="color: #404040; margin: 4px 0; font-size: 11px;">
            ${zone.title}
          </div>
          <div style="margin-top: 6px; padding: 6px 8px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px; font-size: 11px; color: #991b1b;">
            <strong>Dica Defesa Civil:</strong> ${zone.defenseCivilTip}
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

  // Update Incident Markers
  useEffect(() => {
    const layerGroup = incidentsLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    incidents.forEach((inc) => {
      const iconHtml = `
        <div style="
          background: #0f172a;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'incident-marker-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(inc.coordinates, { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #171717;">
          <strong style="color: #b91c1c;">${inc.title}</strong>
          <p style="margin: 4px 0; color: #404040; font-size: 11px;">${inc.description}</p>
          <div style="font-size: 10px; color: #737373;">
            ${inc.neighborhood} &bull; ${inc.confirmationsCount} confirmações
          </div>
        </div>
      `);

      marker.addTo(layerGroup);
    });
  }, [incidents]);

  // Car Navigation Puck (Google Maps Navigation signature blue arrow)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const carHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Directional cone -->
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 18px solid transparent;
          border-right: 18px solid transparent;
          border-bottom: 34px solid rgba(41, 121, 255, 0.35);
          top: -14px;
          pointer-events: none;
        "></div>
        <!-- Blue navigation puck -->
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #2979ff;
          border: 3px solid #ffffff;
          box-shadow: 0 3px 8px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 2;
        ">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff">
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

    // Follow vehicle during active navigation
    if (isNavigating) {
      map.panTo(currentPosition, { animate: true, duration: 0.9 });
    }
  }, [currentPosition, isNavigating]);

  return (
    <div className={`relative w-full h-full bg-[#111] overflow-hidden ${className}`}>
      {/* Real Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Layer Toggle Switch (Satélite Real vs Vetor) */}
      <div className="absolute top-16 right-3 z-[400] pointer-events-auto">
        <button
          onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
          className="px-2.5 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-[11px] font-semibold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          title="Alternar entre Satélite Real e Mapa de Ruas"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>{mapType === 'satellite' ? '🛰️ Satélite' : '🗺️ Ruas'}</span>
        </button>
      </div>
    </div>
  );
};
