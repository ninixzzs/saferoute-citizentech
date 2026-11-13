import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { calculateDistanceMeters } from '../services/api';
import { Crosshair, Plus, Minus, Maximize2, Minimize2, Map as MapIcon, Satellite } from 'lucide-react';

interface NavigationMapProps {
  currentPosition: [number, number];
  nextPosition?: [number, number];
  selectedRoute: NavigationRoute;
  allRoutes?: NavigationRoute[];
  onSelectRoute?: (route: NavigationRoute) => void;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  hasArrived?: boolean;
  activeAlertZone?: DangerZone | null;
  speedKmH?: number;
  onZoneClick?: (zone: DangerZone) => void;
  focusPoint?: { coords: [number, number]; ts: number; title?: string; neighborhood?: string } | null;
  topControlOffsetClass?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
  onSetPointFromMap?: (role: 'origin' | 'destination', coords: [number, number]) => void;
}

// Built-in São Paulo avenue & street simulation vectors (used automatically if tile network fails)
const SP_SIMULATED_ROADS: { name: string; coords: [number, number][]; major?: boolean }[] = [
  {
    name: 'Av. Paulista',
    major: true,
    coords: [
      [-23.5566, -46.6621],
      [-23.5614, -46.6559],
      [-23.5654, -46.6517],
      [-23.5707, -46.6453],
    ],
  },
  {
    name: 'Rua da Consolação',
    major: true,
    coords: [
      [-23.5466, -46.6494],
      [-23.5542, -46.6579],
      [-23.5587, -46.6601],
    ],
  },
  {
    name: 'Av. 23 de Maio',
    major: true,
    coords: [
      [-23.5515, -46.6395],
      [-23.5680, -46.6430],
      [-23.5865, -46.6442],
    ],
  },
  {
    name: 'Av. Brig. Faria Lima',
    major: true,
    coords: [
      [-23.5676, -46.7022],
      [-23.5786, -46.6912],
      [-23.5912, -46.6845],
    ],
  },
  {
    name: 'Av. São João',
    major: false,
    coords: [
      [-23.5325, -46.6565],
      [-23.5404, -46.6458],
      [-23.5450, -46.6382],
    ],
  },
  {
    name: 'Av. Rio Branco',
    major: false,
    coords: [
      [-23.5280, -46.6435],
      [-23.5381, -46.6385],
      [-23.5438, -46.6365],
    ],
  },
  {
    name: 'Av. Radial Leste',
    major: true,
    coords: [
      [-23.5505, -46.6280],
      [-23.5432, -46.6087],
      [-23.5404, -46.5768],
    ],
  },
  {
    name: 'Av. Ipiranga',
    major: false,
    coords: [
      [-23.5465, -46.6470],
      [-23.5428, -46.6410],
      [-23.5385, -46.6360],
    ],
  },
  {
    name: 'Rua Augusta',
    major: false,
    coords: [
      [-23.5495, -46.6512],
      [-23.5542, -46.6579],
      [-23.5635, -46.6650],
    ],
  },
  {
    name: 'Av. Rebouças',
    major: true,
    coords: [
      [-23.5565, -46.6625],
      [-23.5638, -46.6745],
      [-23.5715, -46.6865],
    ],
  },
];

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
  hasArrived = false,
  activeAlertZone = null,
  speedKmH = 0,
  onZoneClick,
  focusPoint = null,
  topControlOffsetClass = 'top-16',
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
  onSetPointFromMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowRef = useRef<L.Polyline | null>(null);
  const altRoutesLayerRef = useRef<L.LayerGroup | null>(null);
  const dangerTrafficLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const simStreetsLayerRef = useRef<L.LayerGroup | null>(null);
  const incidentMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const zoneCirclesRef = useRef<Map<string, L.Circle>>(new Map());

  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);

  const isNavigatingRef = useRef<boolean>(isNavigating);
  isNavigatingRef.current = isNavigating;

  const prevRouteIdRef = useRef<string | null>(null);
  const focusingUntilRef = useRef<number>(0);

  const onSelectRouteRef = useRef(onSelectRoute);
  onSelectRouteRef.current = onSelectRoute;

  const onSetPointFromMapRef = useRef(onSetPointFromMap);
  onSetPointFromMapRef.current = onSetPointFromMap;

  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Build built-in SP simulated street grid & street name badges (0 external key dependency)
  const renderSimulatedStreets = (map: L.Map) => {
    if (!simStreetsLayerRef.current) return;
    simStreetsLayerRef.current.clearLayers();

    SP_SIMULATED_ROADS.forEach((road) => {
      L.polyline(road.coords, {
        color: '#d4d4d4',
        weight: road.major ? 9 : 6,
        opacity: 0.9,
        lineCap: 'round',
      }).addTo(simStreetsLayerRef.current!);

      L.polyline(road.coords, {
        color: '#ffffff',
        weight: road.major ? 6 : 4,
        opacity: 0.95,
        lineCap: 'round',
      }).addTo(simStreetsLayerRef.current!);

      const mid = road.coords[Math.floor(road.coords.length / 2)];
      const labelIcon = L.divIcon({
        html: `<div style="background:rgba(255,255,255,0.95);color:#171717;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;border:1px solid #d4d4d4;box-shadow:0 1px 4px rgba(0,0,0,0.12);white-space:nowrap;pointer-events:none;">${road.name}</div>`,
        className: 'sp-sim-street-label',
        iconSize: [120, 20],
        iconAnchor: [60, 10],
      });
      L.marker(mid, { icon: labelIcon, interactive: false }).addTo(simStreetsLayerRef.current!);
    });

    if (mapContainerRef.current) {
      map.getContainer().style.backgroundColor = '#f5f5f5';
    }
  };

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

    simStreetsLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    altRoutesLayerRef.current = L.layerGroup().addTo(map);
    dangerTrafficLayerRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    // Interactive map click to select Origin or Destination directly
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isNavigatingRef.current) return;
      const clickedCoords: [number, number] = [
        Number(e.latlng.lat.toFixed(5)),
        Number(e.latlng.lng.toFixed(5)),
      ];

      const popupDiv = document.createElement('div');
      popupDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      popupDiv.style.fontSize = '12px';
      popupDiv.style.padding = '4px 2px';
      popupDiv.style.color = '#171717';
      popupDiv.innerHTML = `
        <div style="font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:5px;">
          <span>📍 Ponto no Mapa</span>
        </div>
        <p style="margin:0 0 8px;font-size:10px;color:#737373;font-family:monospace;">${clickedCoords[0]}, ${clickedCoords[1]}</p>
        <div style="display:flex;gap:6px;">
          <button id="map-btn-orig" style="flex:1;padding:6px 10px;background:#171717;color:#ffffff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
            Definir Partida
          </button>
          <button id="map-btn-dest" style="flex:1;padding:6px 10px;background:#171717;color:#ffffff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
            Definir Destino
          </button>
        </div>
      `;

      L.popup({ closeButton: true, offset: [0, -10] })
        .setLatLng(e.latlng)
        .setContent(popupDiv)
        .openOn(map);

      setTimeout(() => {
        popupDiv.querySelector('#map-btn-orig')?.addEventListener('click', () => {
          map.closePopup();
          if (onSetPointFromMapRef.current) {
            onSetPointFromMapRef.current('origin', clickedCoords);
          }
        });
        popupDiv.querySelector('#map-btn-dest')?.addEventListener('click', () => {
          map.closePopup();
          if (onSetPointFromMapRef.current) {
            onSetPointFromMapRef.current('destination', clickedCoords);
          }
        });
      }, 50);
    });

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

  // Handle Map Type Switch (Modo Rua sem API Key vs Satélite)
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
    if (simStreetsLayerRef.current) {
      simStreetsLayerRef.current.clearLayers();
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
      // Esri World Street Map: ZERO API key, clean streets + street names + parks + avenues
      let errorCount = 0;
      const streetLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );

      streetLayer.on('tileerror', () => {
        errorCount += 1;
        if (errorCount >= 3) {
          renderSimulatedStreets(map);
        }
      });

      streetLayer.addTo(map);
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
            color: mapType === 'street' ? '#64748b' : '#cbd5e1',
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
    const mainColor = isSafe
      ? mapType === 'street'
        ? '#111827'
        : '#ffffff'
      : '#525252';
    const casingColor = mapType === 'street' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(0, 0, 0, 0.65)';

    const casingLine = L.polyline(selectedRoute.path, {
      color: casingColor,
      weight: 9.5,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeGlowRef.current = casingLine;

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
        <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
          <div style="width:16px;height:16px;border-radius:50%;background:#ffffff;border:3.5px solid #171717;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      className: 'origin-pin-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
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
        <div style="position:relative;width:32px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
          <div style="width:26px;height:26px;background:#111827;border:2.5px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
            <div style="width:8px;height:8px;background:white;border-radius:50%;transform:rotate(45deg);"></div>
          </div>
          <div style="width:8px;height:3px;background:rgba(0,0,0,0.4);border-radius:50%;filter:blur(1px);margin-top:2px;"></div>
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

    // Only auto-fit map view when a new route is actively chosen or calculated.
    // NEVER snap back or zoom away when arriving at the destination!
    const isNewRoute = prevRouteIdRef.current !== selectedRoute.id;
    prevRouteIdRef.current = selectedRoute.id;

    if (isNewRoute && !isNavigatingRef.current) {
      try {
        const bounds = L.latLngBounds(selectedRoute.path);
        map.flyToBounds(bounds, { padding: [55, 55], duration: 1.0 });
      } catch {}
    }
  }, [selectedRoute, allRoutes, mapType]);

  // 3. Red Hazard Traffic Congestion Route Segments ("Pedaço do trajeto vermelho como trânsito")
  useEffect(() => {
    const layer = dangerTrafficLayerRef.current;
    if (!layer || !selectedRoute || !selectedRoute.path || selectedRoute.path.length < 2) return;

    layer.clearLayers();

    const path = selectedRoute.path;

    dangerZones.forEach((zone) => {
      // Find all points along the route path that pass near/through this danger zone
      const matchingIndices: number[] = [];
      const thresholdMeters = zone.radiusMeters + 260;

      path.forEach((pt, idx) => {
        const d = calculateDistanceMeters(pt[0], pt[1], zone.coordinates[0], zone.coordinates[1]);
        if (d <= thresholdMeters) {
          matchingIndices.push(idx);
        }
      });

      if (matchingIndices.length === 0) return;

      // Group consecutive matching points into contiguous segments
      const segments: [number, number][][] = [];
      let currentSeg: [number, number][] = [];

      for (let i = 0; i < matchingIndices.length; i++) {
        const idx = matchingIndices[i];
        if (currentSeg.length === 0) {
          if (idx > 0) currentSeg.push(path[idx - 1]);
          currentSeg.push(path[idx]);
        } else {
          const prevIdx = matchingIndices[i - 1];
          if (idx === prevIdx + 1) {
            currentSeg.push(path[idx]);
          } else {
            if (prevIdx < path.length - 1) currentSeg.push(path[prevIdx + 1]);
            if (currentSeg.length >= 2) segments.push(currentSeg);
            currentSeg = [];
            if (idx > 0) currentSeg.push(path[idx - 1]);
            currentSeg.push(path[idx]);
          }
        }
      }

      if (currentSeg.length > 0) {
        const lastIdx = matchingIndices[matchingIndices.length - 1];
        if (lastIdx < path.length - 1) currentSeg.push(path[lastIdx + 1]);
        if (currentSeg.length >= 2) segments.push(currentSeg);
      }

      const isApproaching = (activeAlertZone && activeAlertZone.id === zone.id) || selectedRoute.type === 'rapida';
      const isHazardousRoute = selectedRoute.type === 'rapida' || selectedRoute.dangerZoneIds?.includes(zone.id);

      if (!isApproaching && !isHazardousRoute) return;

      segments.forEach((segCoords) => {
        // Deep red casing border (traffic jam casing)
        L.polyline(segCoords, {
          color: isApproaching ? '#7f1d1d' : '#991b1b',
          weight: isApproaching ? 10 : 8,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layer);

        // Traffic Congestion Red line (#ef4444)
        L.polyline(segCoords, {
          color: isApproaching ? '#ef4444' : '#dc2626',
          weight: isApproaching ? 6.5 : 5,
          opacity: 1.0,
          lineCap: 'round',
          lineJoin: 'round',
          className: isApproaching ? 'traffic-red-pulse-segment' : '',
        }).addTo(layer);

        // Traffic Alert Badge at midpoint of the congested segment
        if (isApproaching && segCoords.length >= 2) {
          const midIdx = Math.floor(segCoords.length / 2);
          const midCoord = segCoords[midIdx];

          const trafficBadgeIcon = L.divIcon({
            html: `
              <div style="background:#b91c1c;color:#ffffff;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:4px;box-shadow:0 3px 10px rgba(220,38,38,0.55);border:1.5px solid #ffffff;white-space:nowrap;transform:translate(-50%,-50%);pointer-events:none;">
                <span style="font-size:11px;">🚗⚠️</span>
                <span>Trânsito Lento &bull; ${zone.neighborhood}</span>
              </div>
            `,
            className: 'traffic-hazard-badge',
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          L.marker(midCoord, { icon: trafficBadgeIcon, interactive: false }).addTo(layer);
        }
      });
    });
  }, [selectedRoute.id, dangerZones, activeAlertZone?.id, isNavigating]);

  // When arriving at destination, smoothly keep focus on destination and show arrival badge
  useEffect(() => {
    if (!hasArrived) return;
    const map = mapInstanceRef.current;
    if (!map || !selectedRoute.path.length) return;

    const destCoords = selectedRoute.path[selectedRoute.path.length - 1];
    if (destCoords) {
      map.panTo(destCoords, { animate: true, duration: 0.8 });
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;font-size:12px;color:#171717;padding:3px;min-width:180px;">
              <div style="display:flex;align-items:center;gap:4px;font-weight:800;color:#16a34a;margin-bottom:2px;">
                <span>✓</span>
                <span>Chegada Concluída!</span>
              </div>
              <div style="font-weight:700;margin-bottom:2px;">Destino alcançado com sucesso</div>
              <p style="margin:2px 0 0;font-size:11px;color:#52525b;">${selectedRoute.name} finalizada sem desvios pendentes.</p>
            </div>
          `)
          .openPopup();
      }
    }
  }, [hasArrived, selectedRoute]);

  // Focus specific coordinate and open popup when user clicks an incident or alert
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusPoint) return;

    // Suppress navigation auto-pan for 4.5s so user can examine the focused zone
    focusingUntilRef.current = Date.now() + 4500;

    // Invalidate size immediately to guarantee tiles render and prevent black screen
    map.invalidateSize();

    map.flyTo(focusPoint.coords, 17, { duration: 0.8 });

    const openTimer = setTimeout(() => {
      map.invalidateSize();

      // Check incident markers
      let targetMarker: L.Marker | null = null;
      let minDist = Infinity;

      incidentMarkersRef.current.forEach((marker, key) => {
        const [lat, lng] = key.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const d = Math.hypot(lat - focusPoint.coords[0], lng - focusPoint.coords[1]);
          if (d < minDist) {
            minDist = d;
            targetMarker = marker;
          }
        }
      });

      const matchedMarker = targetMarker as L.Marker | null;
      if (matchedMarker && minDist < 0.005) {
        matchedMarker.openPopup();
        return;
      }

      // Check danger zones
      let targetCircle: L.Circle | null = null;
      let minZoneDist = Infinity;
      zoneCirclesRef.current.forEach((circle, key) => {
        const [lat, lng] = key.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const d = Math.hypot(lat - focusPoint.coords[0], lng - focusPoint.coords[1]);
          if (d < minZoneDist) {
            minZoneDist = d;
            targetCircle = circle;
          }
        }
      });

      const matchedCircle = targetCircle as L.Circle | null;
      if (matchedCircle && minZoneDist < 0.008) {
        matchedCircle.openPopup();
        return;
      }

      // Fallback: create a temporary highlight popup right on focusPoint
      if (focusPoint.title || focusPoint.neighborhood) {
        L.popup()
          .setLatLng(focusPoint.coords)
          .setContent(`
            <div style="font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#171717;min-width:180px;">
              <div style="font-weight:700;color:#171717;margin-bottom:2px;">
                ${focusPoint.neighborhood || 'Local em Destaque'}
              </div>
              <div style="font-size:11px;color:#404040;">
                ${focusPoint.title || 'Ocorrência selecionada'}
              </div>
            </div>
          `)
          .openOn(map);
      }
    }, 450);

    return () => clearTimeout(openTimer);
  }, [focusPoint]);

  // Update Danger Zones
  useEffect(() => {
    const layerGroup = zonesLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    zoneCirclesRef.current.clear();

    dangerZones.forEach((zone) => {
      const circle = L.circle(zone.coordinates, {
        color: '#262626',
        fillColor: '#404040',
        fillOpacity: mapType === 'street' ? 0.14 : 0.22,
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

      zoneCirclesRef.current.set(zone.id, circle);
      zoneCirclesRef.current.set(`${zone.coordinates[0].toFixed(5)},${zone.coordinates[1].toFixed(5)}`, circle);
      circle.addTo(layerGroup);
    });
  }, [dangerZones, onZoneClick, mapType]);

  // Update Incident Markers
  useEffect(() => {
    const layerGroup = incidentsLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    incidentMarkersRef.current.clear();

    incidents.forEach((inc) => {
      const customIcon = L.divIcon({
        html: `
          <div style="background:#111827;width:24px;height:24px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;color:white;cursor:pointer;">
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

      incidentMarkersRef.current.set(inc.id, marker);
      incidentMarkersRef.current.set(`${inc.coordinates[0].toFixed(5)},${inc.coordinates[1].toFixed(5)}`, marker);
      marker.addTo(layerGroup);
    });
  }, [incidents]);

  // Monochrome Life360-Inspired Live Locator Bubble (clean icon, zero text clutter)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bearing = nextPosition ? calculateBearing(currentPosition, nextPosition) : 0;
    const isStreet = mapType === 'street';
    const ringColor = isStreet ? '#171717' : '#ffffff';
    const innerBg = isStreet ? '#171717' : '#171717';
    const haloBg = isStreet ? 'rgba(23, 23, 23, 0.25)' : 'rgba(255, 255, 255, 0.35)';

    const carIcon = L.divIcon({
      html: `
        <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <div class="life360-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:${haloBg};"></div>
          <div style="position:absolute;inset:0;transform:rotate(${bearing}deg);transition:transform 0.6s ease-out;display:flex;align-items:flex-start;justify-content:center;">
            <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid ${ringColor};margin-top:-7px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));"></div>
          </div>
          <div style="width:30px;height:30px;border-radius:50%;background:#ffffff;border:3px solid ${ringColor};box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:2;">
            <div style="width:18px;height:18px;border-radius:50%;background:${innerBg};display:flex;align-items:center;justify-content:center;color:white;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff" style="transform:rotate(${bearing}deg);transition:transform 0.6s ease-out;">
                <polygon points="12,2 20,21 12,17 4,21"/>
              </svg>
            </div>
          </div>
        </div>
      `,
      className: 'life360-locator-marker',
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    if (!carMarkerRef.current) {
      carMarkerRef.current = L.marker(currentPosition, { icon: carIcon, zIndexOffset: 500 }).addTo(map);
    } else {
      carMarkerRef.current.setIcon(carIcon);
      carMarkerRef.current.setLatLng(currentPosition);
    }

    if (isNavigating && Date.now() > focusingUntilRef.current) {
      map.panTo(currentPosition, { animate: true, duration: 0.9 });
    }
  }, [currentPosition, nextPosition, isNavigating, speedKmH, mapType]);

  const handleRecenter = () => {
    focusingUntilRef.current = 0;
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
    <div className={`relative w-full h-full bg-[#eef2f6] dark:bg-neutral-900 overflow-hidden select-none ${className}`}>
      <div
        ref={mapContainerRef}
        className="w-full h-full select-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Right-side Map Controls */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`absolute ${topControlOffsetClass} right-3 z-[400] flex flex-col items-end gap-2 pointer-events-auto select-none`}
      >
        <div className="flex items-center gap-1.5">
          {/* Monochrome Mode Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-white/95 dark:bg-neutral-950/90 backdrop-blur-md border border-neutral-200 dark:border-white/15 shadow-lg">
            <button
              type="button"
              onClick={() => setMapType('street')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                mapType === 'street'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
              title="Modo Rua"
            >
              <MapIcon className="w-3 h-3" />
              <span>Rua</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                mapType === 'satellite'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
              title="Visualização por Satélite"
            >
              <Satellite className="w-3 h-3" />
              <span>Satélite</span>
            </button>
          </div>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="w-8 h-8 rounded-xl bg-white/95 dark:bg-neutral-950/90 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-900 dark:text-white backdrop-blur-md border border-neutral-200 dark:border-white/15 shadow-lg flex items-center justify-center transition-all active:scale-95"
              title={isFullscreen ? 'Sair da tela cheia' : 'Expandir mapa em tela cheia'}
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Expandir mapa em tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <div className="flex flex-col rounded-xl overflow-hidden bg-white/95 dark:bg-neutral-950/90 backdrop-blur-md border border-neutral-200 dark:border-white/15 shadow-lg">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors border-b border-neutral-200 dark:border-white/10"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-full bg-white/95 dark:bg-neutral-950/90 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-900 dark:text-white backdrop-blur-md border border-neutral-200 dark:border-white/15 shadow-lg flex items-center justify-center transition-all active:scale-90"
          title="Centralizar mapa no trajeto"
          aria-label="Centralizar mapa no trajeto"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
