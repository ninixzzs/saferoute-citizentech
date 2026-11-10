import { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationRoute, DangerZone } from '../types';
import { PRESET_ROUTES } from '../data/mockData';
import { geocodeAddress, calculateRoutesToDestination, LocationSuggestion } from '../services/routingService';

export function useRouteNavigation() {
  const [routes, setRoutes] = useState<NavigationRoute[]>(PRESET_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<NavigationRoute>(PRESET_ROUTES[0]); // default fast
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(selectedRoute.path[0]);
  const [speedKmH, setSpeedKmH] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [currentDestination, setCurrentDestination] = useState<LocationSuggestion | null>(null);

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
    setSpeedKmH(45);
  }, [routes]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setIsPaused(false);
    setSpeedKmH(42);
  }, []);

  const pauseNavigation = useCallback(() => {
    setIsPaused(true);
    setSpeedKmH(0);
  }, []);

  const resumeNavigation = useCallback(() => {
    setIsPaused(false);
    setSpeedKmH(42);
  }, []);

  const resetNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setCurrentPosition(selectedRoute.path[0]);
    setSpeedKmH(0);
  }, [selectedRoute]);

  // Calculate new route dynamically for any user address
  const calculateRouteForAddress = useCallback(
    async (destinationAddress: string, dangerZones: DangerZone[]) => {
      if (!destinationAddress.trim()) return null;
      setIsCalculatingRoute(true);
      try {
        const location = await geocodeAddress(destinationAddress);
        // Start from current position or Paulista / Consolação default
        const origin: [number, number] = [-23.5587, -46.6601];
        const newRoutes = await calculateRoutesToDestination(
          origin,
          location.coordinates,
          location.name,
          dangerZones
        );

        setRoutes(newRoutes);
        setCurrentDestination(location);

        // Select the recommended safe route by default
        const safeRoute = newRoutes.find((r) => r.type === 'segura') || newRoutes[0];
        setSelectedRoute(safeRoute);
        setCurrentStepIndex(0);
        setCurrentPosition(safeRoute.path[0]);
        setIsNavigating(false);
        setIsPaused(false);
        setSpeedKmH(0);

        return location;
      } catch (err) {
        console.error('Erro ao calcular rota:', err);
        return null;
      } finally {
        setIsCalculatingRoute(false);
      }
    },
    []
  );

  // Restore preset default routes
  const resetToPresetRoutes = useCallback(() => {
    setRoutes(PRESET_ROUTES);
    setCurrentDestination(null);
    setSelectedRoute(PRESET_ROUTES[0]);
    setCurrentStepIndex(0);
    setCurrentPosition(PRESET_ROUTES[0].path[0]);
    setIsNavigating(false);
    setIsPaused(false);
    setSpeedKmH(0);
  }, []);

  // Simulation timer loop
  useEffect(() => {
    if (!isNavigating || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 2200; // Step every 2.2s

    timerRef.current = window.setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < selectedRoute.path.length) {
          setCurrentPosition(selectedRoute.path[nextIndex]);
          // Vary speed realistically (between 38 and 54 km/h)
          setSpeedKmH(Math.floor(38 + Math.random() * 16));
          return nextIndex;
        } else {
          // Reached destination
          setIsNavigating(false);
          setSpeedKmH(0);
          return prevIndex;
        }
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isNavigating, isPaused, selectedRoute]);

  const progressPercentage = Math.round(
    (currentStepIndex / Math.max(1, selectedRoute.path.length - 1)) * 100
  );

  return {
    routes,
    selectedRoute,
    selectRoute,
    switchImmediatelyToSafeRoute,
    calculateRouteForAddress,
    resetToPresetRoutes,
    currentDestination,
    isCalculatingRoute,
    isNavigating,
    isPaused,
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
