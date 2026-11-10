import React, { useEffect, useRef, useState } from 'react';
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
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on São Paulo Centro / Consolação
    const map = L.map(mapContainerRef.current, {
      center: currentPosition,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // High-contrast OpenStreetMap tiles where all street names, avenues and labels are clear
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    incidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Force tile rendering and layout calculation
    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    invalidate();
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);

    let ro: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => invalidate());
      ro.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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
    // Google Maps Navigation blue or safe dark-slate
    const color = isSafe ? '#15803d' : '#2563eb';

    const polyline = L.polyline(selectedRoute.path, {
      color: color,
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routePolylineRef.current = polyline;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    setTimeout(() => map.invalidateSize(), 150);
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
        fillOpacity: 0.18,
        radius: zone.radiusMeters,
        weight: 1.5,
        dashArray: '4, 4',
      });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #171717; min-width: 200px;">
          <div style="font-weight: 700; color: #dc2626; margin-bottom: 2px;">
            Alerta de Risco &bull; ${zone.neighborhood}
          </div>
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${zone.name}
          </div>
          <p style="color: #525252; margin: 4px 0; font-size: 11px;">
            ${zone.title}
          </p>
          <div style="margin-top: 6px; padding: 6px 8px; background: #f5f5f5; border-left: 3px solid #171717; border-radius: 4px; font-size: 11px;">
            <strong>Instrução:</strong> ${zone.defenseCivilTip}
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
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
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

  // Update Car Navigation Marker (Minimalist Google Maps puck)
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
          background: rgba(37, 99, 235, 0.15);
        "></div>
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
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
    <div className={`relative w-full h-full min-h-[360px] bg-[#e5e5e5] ${className}`}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
