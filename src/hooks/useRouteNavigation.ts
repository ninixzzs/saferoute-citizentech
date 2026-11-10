import { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationRoute, DangerZone } from '../types';
import { PRESET_ROUTES } from '../data/mockData';
import {
  geocodeAddress,
  calculateRoutesBetweenPoints,
  LocationSuggestion,
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
} from '../services/routingService';

export function useRouteNavigation() {
  const [routes, setRoutes] = useState<NavigationRoute[]>(PRESET_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<NavigationRoute>(PRESET_ROUTES[0]);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(selectedRoute.path[0]);
  const [speedKmH, setSpeedKmH] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  // Origin & Destination state
  const [originLocation, setOriginLocation] = useState<LocationSuggestion>(DEFAULT_ORIGIN);
  const [destinationLocation, setDestinationLocation] = useState<LocationSuggestion>(DEFAULT_DESTINATION);

  // Simulation pacing: '1x' (realistic normal speed) or '2x'
  const [simSpeed, setSimSpeed] = useState<'1x' | '2x'>('1x');

  const timerRef = useRef<number | null>(null);

  // Switch to a chosen route
  const selectRoute = useCallback((route: NavigationRoute) => {
    setSelectedRoute(route);
    setCurrentStepIndex(0);
    setCurrentPosition(route.path[0]);
    setIsNavigating(false);
    setIsPaused(false);
    setSpeedKmH(0);
  }, []);

  // Instant switch to safe route (e.g. when Defesa Civil warning prompts reroute)
  const switchImmediatelyToSafeRoute = useCallback(() => {
    const safeRoute = routes.find((r) => r.type === 'segura') || routes[1] || routes[0];
    setSelectedRoute(safeRoute);
    setCurrentStepIndex(0);
    setCurrentPosition(safeRoute.path[0]);
    setIsNavigating(true);
    setIsPaused(false);
    setSpeedKmH(42);
  }, [routes]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setIsPaused(false);
    setSpeedKmH(40);
  }, []);

  const pauseNavigation = useCallback(() => {
    setIsPaused(true);
    setSpeedKmH(0);
  }, []);

  const resumeNavigation = useCallback(() => {
    setIsPaused(false);
    setSpeedKmH(40);
  }, []);

  const resetNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setCurrentPosition(selectedRoute.path[0]);
    setSpeedKmH(0);
  }, [selectedRoute]);

  // Calculate routes between Origin and Destination
  const calculateJourney = useCallback(
    async (originText: string, destinationText: string, dangerZones: DangerZone[]) => {
      if (!destinationText.trim()) return null;
      setIsCalculatingRoute(true);
      try {
        const originLoc = await geocodeAddress(originText || 'Avenida Paulista', originLocation);
        const destLoc = await geocodeAddress(destinationText, destinationLocation);

        const newRoutes = await calculateRoutesBetweenPoints(originLoc, destLoc, dangerZones);

        setOriginLocation(originLoc);
        setDestinationLocation(destLoc);
        setRoutes(newRoutes);

        // Select the recommended safe route by default
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

  // Invert origin and destination
  const swapOriginAndDestination = useCallback(
    async (dangerZones: DangerZone[]) => {
      const newOrigin = destinationLocation;
      const newDest = originLocation;
      return calculateJourney(newOrigin.name, newDest.name, dangerZones);
    },
    [originLocation, destinationLocation, calculateJourney]
  );

  // Restore preset default routes
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

  // Realistic normal speed simulation loop
  useEffect(() => {
    if (!isNavigating || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Realistic city driving pacing: 4200ms per step in 1x, 2200ms in 2x
    const stepInterval = simSpeed === '1x' ? 4200 : 2200;

    timerRef.current = window.setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < selectedRoute.path.length) {
          setCurrentPosition(selectedRoute.path[nextIndex]);
          // Vary speed realistically within normal city limits (36 to 48 km/h)
          setSpeedKmH(Math.floor(36 + Math.random() * 12));
          return nextIndex;
        } else {
          // Reached destination
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

  return {
    routes,
    selectedRoute,
    selectRoute,
    switchImmediatelyToSafeRoute,
    calculateJourney,
    swapOriginAndDestination,
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
    speedKmH,
    progressPercentage,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
  };
}
