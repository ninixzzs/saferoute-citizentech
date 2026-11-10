import { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationRoute, DangerZone } from '../types';
import { PRESET_ROUTES } from '../data/mockData';
import {
  geocodeAddress,
  reverseGeocode,
  calculateRoutesBetweenPoints,
  LocationSuggestion,
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
} from '../services/routingService';
import { calculateDistanceMeters } from '../services/api';

export function useRouteNavigation() {
  const [routes, setRoutes] = useState<NavigationRoute[]>(PRESET_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<NavigationRoute>(PRESET_ROUTES[0]);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(selectedRoute.path[0]);
  const [speedKmH, setSpeedKmH] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  const [originLocation, setOriginLocation] = useState<LocationSuggestion>(DEFAULT_ORIGIN);
  const [destinationLocation, setDestinationLocation] = useState<LocationSuggestion>(DEFAULT_DESTINATION);
  const [simSpeed, setSimSpeed] = useState<'1x' | '2x'>('1x');

  const timerRef = useRef<number | null>(null);

  const selectRoute = useCallback((route: NavigationRoute) => {
    setSelectedRoute(route);
    setCurrentStepIndex(0);
    setCurrentPosition(route.path[0]);
    setIsNavigating(false);
    setIsPaused(false);
    setSpeedKmH(0);
  }, []);

  // Switch smoothly to safe route from nearest point on the new path
  const switchImmediatelyToSafeRoute = useCallback(() => {
    const safeRoute = routes.find((r) => r.type === 'segura') || routes[1] || routes[0];
    let closestIdx = 0;
    let minDist = Infinity;

    safeRoute.path.forEach((pt, idx) => {
      const d = calculateDistanceMeters(currentPosition[0], currentPosition[1], pt[0], pt[1]);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });

    setSelectedRoute(safeRoute);
    setCurrentStepIndex(closestIdx);
    setCurrentPosition(safeRoute.path[closestIdx]);
    setIsNavigating(true);
    setIsPaused(false);
    setSpeedKmH(40);
  }, [routes, currentPosition]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setIsPaused(false);
    setSpeedKmH(38);
  }, []);

  const pauseNavigation = useCallback(() => {
    setIsPaused(true);
    setSpeedKmH(0);
  }, []);

  const resumeNavigation = useCallback(() => {
    setIsPaused(false);
    setSpeedKmH(38);
  }, []);

  const resetNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setCurrentPosition(selectedRoute.path[0]);
    setSpeedKmH(0);
  }, [selectedRoute]);

  const calculateJourney = useCallback(
    async (originText: string, destinationText: string, dangerZones: DangerZone[]) => {
      if (!destinationText.trim()) return null;
      setIsCalculatingRoute(true);
      try {
        const originLoc = await geocodeAddress(originText || DEFAULT_ORIGIN.name, originLocation);
        const destLoc = await geocodeAddress(destinationText, destinationLocation);

        const newRoutes = await calculateRoutesBetweenPoints(originLoc, destLoc, dangerZones);

        setOriginLocation(originLoc);
        setDestinationLocation(destLoc);
        setRoutes(newRoutes);

        const safeRoute = newRoutes.find((r) => r.type === 'segura') || newRoutes[0];
        setSelectedRoute(safeRoute);
        setCurrentStepIndex(0);
        setCurrentPosition(safeRoute.path[0]);
        setIsNavigating(false);
        setIsPaused(false);
        setSpeedKmH(0);

        return { origin: originLoc, destination: destLoc, routes: newRoutes };
      } catch (err) {
        console.error('Erro ao calcular jornada:', err);
        return null;
      } finally {
        setIsCalculatingRoute(false);
      }
    },
    [originLocation, destinationLocation]
  );

  const swapOriginAndDestination = useCallback(
    async (dangerZones: DangerZone[]) => {
      setIsCalculatingRoute(true);
      try {
        const newOrigin = destinationLocation;
        const newDest = originLocation;
        const newRoutes = await calculateRoutesBetweenPoints(newOrigin, newDest, dangerZones);
        setOriginLocation(newOrigin);
        setDestinationLocation(newDest);
        setRoutes(newRoutes);

        const safeRoute = newRoutes.find((r) => r.type === 'segura') || newRoutes[0];
        setSelectedRoute(safeRoute);
        setCurrentStepIndex(0);
        setCurrentPosition(safeRoute.path[0]);
        setIsNavigating(false);
        setIsPaused(false);
        setSpeedKmH(0);
      } finally {
        setIsCalculatingRoute(false);
      }
    },
    [originLocation, destinationLocation]
  );

  // Set Origin or Destination directly from a map click
  const setPointFromMap = useCallback(
    async (role: 'origin' | 'destination', coords: [number, number], dangerZones: DangerZone[]) => {
      setIsCalculatingRoute(true);
      try {
        const picked = await reverseGeocode(coords[0], coords[1]);
        const newOrigin = role === 'origin' ? picked : originLocation;
        const newDest = role === 'destination' ? picked : destinationLocation;

        const newRoutes = await calculateRoutesBetweenPoints(newOrigin, newDest, dangerZones);
        setOriginLocation(newOrigin);
        setDestinationLocation(newDest);
        setRoutes(newRoutes);

        const safeRoute = newRoutes.find((r) => r.type === 'segura') || newRoutes[0];
        setSelectedRoute(safeRoute);
        setCurrentStepIndex(0);
        setCurrentPosition(safeRoute.path[0]);
        setIsNavigating(false);
        setIsPaused(false);
        setSpeedKmH(0);
      } finally {
        setIsCalculatingRoute(false);
      }
    },
    [originLocation, destinationLocation]
  );

  const resetToPresetRoutes = useCallback(() => {
    setRoutes(PRESET_ROUTES);
    setOriginLocation(DEFAULT_ORIGIN);
    setDestinationLocation(DEFAULT_DESTINATION);
    setSelectedRoute(PRESET_ROUTES[0]);
    setCurrentStepIndex(0);
    setCurrentPosition(PRESET_ROUTES[0].path[0]);
    setIsNavigating(false);
    setIsPaused(false);
    setSpeedKmH(0);
  }, []);

  // Calm city driving loop
  useEffect(() => {
    if (!isNavigating || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const stepInterval = simSpeed === '1x' ? 4200 : 2200;

    timerRef.current = window.setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < selectedRoute.path.length) {
          setCurrentPosition(selectedRoute.path[nextIndex]);
          setSpeedKmH(Math.floor(36 + Math.random() * 10));
          return nextIndex;
        } else {
          setIsNavigating(false);
          setSpeedKmH(0);
          return prevIndex;
        }
      });
    }, stepInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isNavigating, isPaused, selectedRoute, simSpeed]);

  const progressPercentage = Math.round(
    (currentStepIndex / Math.max(1, selectedRoute.path.length - 1)) * 100
  );

  const nextIdx = Math.min(selectedRoute.path.length - 1, currentStepIndex + 1);
  const nextPosition = selectedRoute.path[nextIdx] || currentPosition;

  return {
    routes,
    selectedRoute,
    selectRoute,
    switchImmediatelyToSafeRoute,
    calculateJourney,
    swapOriginAndDestination,
    setPointFromMap,
    resetToPresetRoutes,
    originLocation,
    destinationLocation,
    isCalculatingRoute,
    isNavigating,
    isPaused,
    simSpeed,
    setSimSpeed,
    currentStepIndex,
    currentPosition,
    nextPosition,
    speedKmH,
    progressPercentage,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
  };
}
