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
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on São Paulo Centro
    const map = L.map(mapContainerRef.current, {
      center: currentPosition,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // High resolution, crystal-clear Google Maps style streets & avenue names
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Immediate and delayed invalidations to ensure tiles render immediately
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

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
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
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
    // Google Maps Navigation signature blue or safe green
    const color = isSafe ? '#1b873f' : '#1a73e8';

    const polyline = L.polyline(selectedRoute.path, {
      color: color,
      weight: 7,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routePolylineRef.current = polyline;

    // Update Destination Pin Marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (selectedRoute.path.length > 0) {
      const destCoords = selectedRoute.path[selectedRoute.path.length - 1];
      const destHtml = `
        <div style="position: relative; width: 32px; height: 38px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="
            width: 28px;
            height: 28px;
            background: #ea4335;
            border: 2.5px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.45);
          ">
            <div style="width: 9px; height: 9px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
          <div style="width: 8px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px); margin-top: 2px;"></div>
        </div>
      `;

      const destIcon = L.divIcon({
        html: destHtml,
        className: 'dest-navigation-marker',
        iconSize: [32, 38],
        iconAnchor: [16, 36],
      });

      const marker = L.marker(destCoords, { icon: destIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #171717; padding: 2px;">
          <strong style="color: #ea4335;">Destino</strong>
          <p style="margin: 3px 0 0; font-size: 11px;">${selectedRoute.name}</p>
        </div>
      `);
      destinationMarkerRef.current = marker;
    }

    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    setTimeout(() => map.invalidateSize(), 100);
  }, [selectedRoute]);

  // Update Danger Zones
  useEffect(() => {
    const layerGroup = zonesLayerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    dangerZones.forEach((zone) => {
      const circle = L.circle(zone.coordinates, {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.15,
        radius: zone.radiusMeters,
        weight: 1.5,
        dashArray: '4, 4',
      });

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #171717; min-width: 200px;">
          <div style="font-weight: 700; color: #dc2626; margin-bottom: 2px;">
            Alerta &bull; ${zone.neighborhood}
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${zone.name}
          </div>
          <div style="color: #404040; margin: 4px 0; font-size: 11px;">
            ${zone.title}
          </div>
          <div style="margin-top: 6px; padding: 6px 8px; background: #f5f5f5; border-left: 3px solid #171717; border-radius: 4px; font-size: 11px;">
            <strong>Dica:</strong> ${zone.defenseCivilTip}
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
          background: #171717;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        ">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'incident-marker-pin',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker(inc.coordinates, { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #171717;">
          <strong>${inc.title}</strong>
          <p style="margin: 4px 0; color: #525252; font-size: 11px;">${inc.description}</p>
          <div style="font-size: 10px; color: #737373;">
            ${inc.neighborhood} &bull; ${inc.confirmationsCount} confirmações
          </div>
        </div>
      `);

      marker.addTo(layerGroup);
    });
  }, [incidents]);

  // Update Car Navigation Marker (Google Maps authentic blue navigation puck)
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
          border-bottom: 34px solid rgba(26, 115, 232, 0.25);
          top: -14px;
          pointer-events: none;
        "></div>
        <!-- Blue navigation puck -->
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #1a73e8;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
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

    if (isNavigating) {
      map.panTo(currentPosition, { animate: true, duration: 1 });
    }
  }, [currentPosition, isNavigating]);

  return (
    <div className={`relative w-full h-full bg-[#f0f2f5] overflow-hidden ${className}`}>
      <div
        ref={mapContainerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
};
