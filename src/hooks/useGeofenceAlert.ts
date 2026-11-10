import { useState, useEffect } from 'react';
import { DangerZone } from '../types';
import { calculateDistanceMeters } from '../services/api';

interface UseGeofenceAlertProps {
  currentPosition: [number, number];
  dangerZones: DangerZone[];
  isNavigating: boolean;
  onEnterCriticalZone?: (zone: DangerZone) => void;
}

export function useGeofenceAlert({
  currentPosition,
  dangerZones,
  isNavigating,
  onEnterCriticalZone,
}: UseGeofenceAlertProps) {
  const [activeAlertZone, setActiveAlertZone] = useState<DangerZone | null>(null);
  const [dismissedZoneIds, setDismissedZoneIds] = useState<Set<string>>(new Set());
  const [nearestZone, setNearestZone] = useState<{ zone: DangerZone; distance: number } | null>(null);

  useEffect(() => {
    if (!isNavigating || dangerZones.length === 0) {
      setActiveAlertZone(null);
      setNearestZone(null);
      return;
    }

    let closest: { zone: DangerZone; distance: number } | null = null;
    let triggeredZone: DangerZone | null = null;

    for (const zone of dangerZones) {
      const dist = calculateDistanceMeters(
        currentPosition[0],
        currentPosition[1],
        zone.coordinates[0],
        zone.coordinates[1]
      );

      if (!closest || dist < closest.distance) {
        closest = { zone, distance: Math.round(dist) };
      }

      // If user is inside danger zone radius and hasn't dismissed it yet
      if (dist <= zone.radiusMeters && !dismissedZoneIds.has(zone.id)) {
        triggeredZone = zone;
      }
    }

    setNearestZone(closest);

    if (triggeredZone && (!activeAlertZone || activeAlertZone.id !== triggeredZone.id)) {
      setActiveAlertZone(triggeredZone);
      if (onEnterCriticalZone) {
        onEnterCriticalZone(triggeredZone);
      }
    } else if (!triggeredZone && activeAlertZone) {
      // Exited zone
      const stillInside = dangerZones.some((z) => {
        const d = calculateDistanceMeters(
          currentPosition[0],
          currentPosition[1],
          z.coordinates[0],
          z.coordinates[1]
        );
        return d <= z.radiusMeters;
      });
      if (!stillInside) {
        setActiveAlertZone(null);
      }
    }
  }, [currentPosition, dangerZones, isNavigating, dismissedZoneIds, activeAlertZone, onEnterCriticalZone]);

  const dismissAlert = (zoneId: string) => {
    setDismissedZoneIds((prev) => new Set(prev).add(zoneId));
    if (activeAlertZone?.id === zoneId) {
      setActiveAlertZone(null);
    }
  };

  const resetDismissed = () => {
    setDismissedZoneIds(new Set());
  };

  return {
    activeAlertZone,
    nearestZone,
    dismissAlert,
    resetDismissed,
  };
}
