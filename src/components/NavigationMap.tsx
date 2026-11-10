import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { Layers, Crosshair, Plus, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface NavigationMapProps {
  currentPosition: [number, number];
  nextPosition?: [number, number];
  selectedRoute: NavigationRoute;
  allRoutes?: NavigationRoute[];
  onSelectRoute?: (route: NavigationRoute) => void;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  onZoneClick?: (zone: DangerZone) => void;
  focusPoint?: { coords: [number, number]; ts: number } | null;
  topControlOffsetClass?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}

function calculateBearing(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLng = toRad(to[1] - from[1]);

  if (Math.abs(from[0] - to[0]) < 1e-6 && Math.abs(from[1] - to[1]) < 1e-6) {
    return 0;
  }

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  currentPosition,
  nextPosition,
  selectedRoute,
  allRoutes = [],
  onSelectRoute,
  dangerZones,
  incidents,
  isNavigating,
  onZoneClick,
  focusPoint = null,
  topControlOffsetClass = 'top-16',
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowRef = useRef<L.Polyline | null>(null);
  const altRoutesLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);

  const isNavigatingRef = useRef<boolean>(isNavigating);
  isNavigatingRef.current = isNavigating;

  const onSelectRouteRef = useRef(onSelectRoute);
  onSelectRouteRef.current = onSelectRoute;

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

    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );

    const labelsLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.92 }
    );

    satLayer.addTo(map);
    labelsLayer.addTo(map);

    baseTileLayerRef.current = satLayer;
    labelsTileLayerRef.current = labelsLayer;

    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    altRoutesLayerRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

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
      carMarkerRef.current = null;
    };
  }, []);

  // Recalculate size smoothly when fullscreen toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  // Handle Map Type Switch (Satélite vs Ruas)
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
      satLayer.bringToBack();

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
      streetLayer.bringToBack();

      baseTileLayerRef.current = streetLayer;
    }

    if (routeGlowRef.current) routeGlowRef.current.bringToFront();
    if (routePolylineRef.current) routePolylineRef.current.bringToFront();

    map.invalidateSize();
  }, [mapType]);

  // Render Alternative Routes & Selected Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRoute.path || selectedRoute.path.length === 0) return;

    if (altRoutesLayerRef.current) altRoutesLayerRef.current.clearLayers();
    if (routeGlowRef.current) routeGlowRef.current.remove();
    if (routePolylineRef.current) routePolylineRef.current.remove();
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();

    if (!isNavigating && allRoutes.length > 1 && altRoutesLayerRef.current) {
      allRoutes
        .filter((r) => r.id !== selectedRoute.id && r.path.length > 1)
        .forEach((alt) => {
          const altLine = L.polyline(alt.path, {
            color: '#94a3b8',
            weight: 4.5,
            opacity: 0.65,
            dashArray: '6, 6',
            lineCap: 'round',
          });
          altLine.on('click', () => {
            if (!isNavigatingRef.current && onSelectRouteRef.current) {
              onSelectRouteRef.current(alt);
            }
          });
          altLine.bindTooltip(`${alt.durationMin} min (${alt.distanceKm} km)`, {
            sticky: true,
          });
          altLine.addTo(altRoutesLayerRef.current!);
        });
    }

    const isSafe = selectedRoute.type === 'segura';
    const mainColor = isSafe ? '#2563eb' : '#475569';
    const glowColor = 'rgba(0, 0, 0, 0.5)';

    const glowLine = L.polyline(selectedRoute.path, {
      color: glowColor,
      weight: 9.5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeGlowRef.current = glowLine;

    const mainLine = L.polyline(selectedRoute.path, {
      color: mainColor,
      weight: 5.5,
      opacity: 0.98,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routePolylineRef.current = mainLine;

    // Origin Pin
    const originCoords = selectedRoute.path[0];
    const originIcon = L.divIcon({
      html: `
        <div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
          <div style="width:15px;height:15px;border-radius:50%;background:#ffffff;border:3px solid #0f172a;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>
        </div>
      `,
      className: 'origin-pin-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    const originMarker = L.marker(originCoords, { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family:system-ui,sans-serif;font-size:12px;color:#171717;padding:2px;">
        <strong>Ponto de Partida</strong>
        <p style="margin:3px 0 0;font-size:11px;">Início do trajeto</p>
      </div>
    `);
    originMarkerRef.current = originMarker;

    // Destination Pin
    const destCoords = selectedRoute.path[selectedRoute.path.length - 1];
    const destIcon = L.divIcon({
      html: `
        <div style="position:relative;width:32px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.6));">
          <div style="width:26px;height:26px;background:#111827;border:2.5px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
            <div style="width:8px;height:8px;background:white;border-radius:50%;transform:rotate(45deg);"></div>
          </div>
          <div style="width:8px;height:3px;background:rgba(0,0,0,0.5);border-radius:50%;filter:blur(1px);margin-top:2px;"></div>
        </div>
      `,
      className: 'dest-pin-marker',
      iconSize: [32, 40],
      iconAnchor: [16, 37],
    });
    const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(map);
    destMarker.bindPopup(`
      <div style="font-family:system-ui,sans-serif;font-size:12px;color:#171717;padding:2px;">
        <strong>Destino</strong>
        <p style="margin:3px 0 0;font-size:11px;">${selectedRoute.name}</p>
      </div>
    `);
    destinationMarkerRef.current = destMarker;

    if (!isNavigatingRef.current) {
      try {
        const bounds = L.latLngBounds(selectedRoute.path);
        map.flyToBounds(bounds, { padding: [55, 55], duration: 1.0 });
      } catch {}
    }
  }, [selectedRoute, allRoutes, isNavigating]);

  // Focus specific coordinate when user clicks an incident
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusPoint) return;
    map.flyTo(focusPoint.coords, 16, { duration: 0.9 });
  }, [focusPoint]);

  // Update Danger Zones
  useEffect(() => {
    const layerGroup = zonesLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    dangerZones.forEach((zone) => {
      const circle = L.circle(zone.coordinates, {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.16,
        radius: zone.radiusMeters,
        weight: 1.5,
        dashArray: '5, 5',
      });

      circle.bindPopup(`
        <div style="font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.4;color:#171717;min-width:200px;">
          <div style="font-weight:700;color:#171717;margin-bottom:2px;">
            Zona de Atenção &bull; ${zone.neighborhood}
          </div>
          <div style="font-weight:600;margin-bottom:4px;font-size:11px;">
            ${zone.name}
          </div>
          <div style="color:#404040;margin:4px 0;font-size:11px;">
            ${zone.title}
          </div>
          <div style="margin-top:6px;padding:6px 8px;background:#f5f5f5;border-left:3px solid #171717;border-radius:4px;font-size:11px;color:#262626;">
            <strong>Recomendação:</strong> ${zone.defenseCivilTip}
          </div>
        </div>
      `);
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
      const customIcon = L.divIcon({
        html: `
          <div style="background:#0f172a;width:24px;height:24px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;cursor:pointer;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
        `,
        className: 'incident-marker-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(inc.coordinates, { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;font-size:12px;color:#171717;">
          <strong>${inc.title}</strong>
          <p style="margin:4px 0;color:#404040;font-size:11px;">${inc.description}</p>
          <div style="font-size:10px;color:#737373;">
            ${inc.neighborhood} &bull; ${inc.confirmationsCount} confirmações
          </div>
        </div>
      `);

      marker.addTo(layerGroup);
    });
  }, [incidents]);

  // Update Car Navigation Puck with Real Directional Bearing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bearing = nextPosition ? calculateBearing(currentPosition, nextPosition) : 0;

    const carIcon = L.divIcon({
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;transform:rotate(${bearing}deg);transition:transform 0.6s ease-out;">
          <div style="position:absolute;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:30px solid rgba(37,99,235,0.35);top:-11px;pointer-events:none;"></div>
          <div style="width:26px;height:26px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;z-index:2;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff">
              <polygon points="12,2 20,21 12,17 4,21"/>
            </svg>
          </div>
        </div>
      `,
      className: 'car-navigation-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(currentPosition, { icon: carIcon, zIndexOffset: 500 }).addTo(map);
    } else {
      carMarkerRef.current.setIcon(carIcon);
      carMarkerRef.current.setLatLng(currentPosition);
    }

    if (isNavigating) {
      map.panTo(currentPosition, { animate: true, duration: 0.9 });
    }
  }, [currentPosition, nextPosition, isNavigating]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (isNavigating) {
      map.flyTo(currentPosition, 16, { duration: 0.8 });
    } else if (selectedRoute.path.length > 0) {
      try {
        map.flyToBounds(L.latLngBounds(selectedRoute.path), { padding: [55, 55], duration: 0.8 });
      } catch {}
    }
  };

  return (
    <div className={`relative w-full h-full bg-neutral-900 overflow-hidden select-none ${className}`}>
      <div
        ref={mapContainerRef}
        className="w-full h-full select-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Right-side Map Controls (isolated from map drag events) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`absolute ${topControlOffsetClass} right-3 z-[400] flex flex-col items-end gap-2 pointer-events-auto select-none`}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
            className="px-2.5 py-1.5 rounded-xl bg-black/85 hover:bg-black text-white text-[11px] font-semibold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
            title="Alternar entre Satélite e Mapa de Ruas"
          >
            <Layers className="w-3.5 h-3.5 text-neutral-300" />
            <span>{mapType === 'satellite' ? 'Satélite' : 'Ruas'}</span>
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="w-8 h-8 rounded-xl bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all active:scale-95"
              title={isFullscreen ? 'Sair da tela cheia' : 'Expandir mapa em tela cheia'}
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Expandir mapa em tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <div className="flex flex-col rounded-xl overflow-hidden bg-black/85 backdrop-blur-md border border-white/20 shadow-lg">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 transition-colors border-b border-white/10"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-full bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-all active:scale-90"
          title="Centralizar mapa no trajeto"
          aria-label="Centralizar mapa no trajeto"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
