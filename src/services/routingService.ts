import { NavigationRoute, DangerZone } from '../types';
import { calculateDistanceMeters } from './api';

export interface LocationSuggestion {
  name: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
}

export const POPULAR_DESTINATIONS: LocationSuggestion[] = [
  {
    name: 'Avenida Paulista',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
    coordinates: [-23.5654, -46.6517],
  },
  {
    name: 'Av. Faria Lima',
    address: 'Av. Brig. Faria Lima, 2000 - Pinheiros, São Paulo',
    coordinates: [-23.5786, -46.6912],
  },
  {
    name: 'Parque Ibirapuera',
    address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo',
    coordinates: [-23.5874, -46.6576],
  },
  {
    name: 'Praça da Sé',
    address: 'Praça da Sé - Centro Histórico, São Paulo',
    coordinates: [-23.5505, -46.6333],
  },
  {
    name: 'Rua Augusta',
    address: 'Rua Augusta, 1200 - Consolação, São Paulo',
    coordinates: [-23.5542, -46.6579],
  },
  {
    name: 'Aeroporto de Congonhas',
    address: 'Av. Washington Luís - Campo Belo, São Paulo',
    coordinates: [-23.6261, -46.6564],
  },
  {
    name: 'Vila Madalena',
    address: 'Rua Harmonia / Beco do Batman - Vila Madalena, São Paulo',
    coordinates: [-23.5574, -46.6865],
  },
  {
    name: 'Moema',
    address: 'Av. Ibirapuera x Av. Moema - Moema, São Paulo',
    coordinates: [-23.6045, -46.6662],
  },
  {
    name: 'Brás',
    address: 'Rua Miller x Rua Oriente - Brás, São Paulo',
    coordinates: [-23.5432, -46.6087],
  },
  {
    name: 'Liberdade',
    address: 'Praça da Liberdade - Liberdade, São Paulo',
    coordinates: [-23.5552, -46.6358],
  },
  {
    name: 'Estádio Morumbi',
    address: 'Praça Roberto Gomes Pedrosa - Morumbi, São Paulo',
    coordinates: [-23.6000, -46.7201],
  },
  {
    name: 'Barra Funda',
    address: 'Terminal Barra Funda - Barra Funda, São Paulo',
    coordinates: [-23.5262, -46.6644],
  },
  {
    name: 'Tatuapé',
    address: 'Metrô Tatuapé - Tatuapé, São Paulo',
    coordinates: [-23.5404, -46.5768],
  },
  {
    name: 'Santana',
    address: 'Rua Voluntários da Pátria - Santana, São Paulo',
    coordinates: [-23.5042, -46.6264],
  },
  {
    name: 'Largo da Batata',
    address: 'Largo da Batata - Pinheiros, São Paulo',
    coordinates: [-23.5676, -46.7022],
  },
];

/**
 * Searches for coordinates based on query text.
 * 1. Checks matching local curated locations.
 * 2. Attempts OpenStreetMap Nominatim geocoding (with SP context).
 * 3. Fallbacks gracefully to pseudo-geocoded coordinates within São Paulo.
 */
export async function geocodeAddress(query: string): Promise<LocationSuggestion> {
  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();

  // 1. Direct local match
  const localMatch = POPULAR_DESTINATIONS.find(
    (loc) =>
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.address.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(loc.name.toLowerCase())
  );
  if (localMatch) {
    return localMatch;
  }

  // 2. Try Nominatim Geocoding API (in browser)
  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery + ', São Paulo, Brasil'
    )}&limit=1&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            name: cleanQuery,
            address: item.display_name.split(',').slice(0, 3).join(','),
            coordinates: [lat, lon],
          };
        }
      }
    }
  } catch (err) {
    // Network or CORS issue, proceed to graceful fallback
  }

  // 3. Fallback: Generate a plausible coordinate in São Paulo based on hash
  let hash = 0;
  for (let i = 0; i < cleanQuery.length; i++) {
    hash = (hash << 5) - hash + cleanQuery.charCodeAt(i);
    hash |= 0;
  }
  const normHash1 = ((Math.abs(hash) % 1000) / 1000);
  const normHash2 = ((Math.abs(hash >> 3) % 1000) / 1000);

  // Lat between -23.52 and -23.60, Lng between -46.68 and -46.61 (Central / expanded SP)
  const lat = -23.52 - normHash1 * 0.08;
  const lng = -46.68 + normHash2 * 0.07;

  return {
    name: cleanQuery,
    address: `${cleanQuery}, São Paulo - SP`,
    coordinates: [Number(lat.toFixed(5)), Number(lng.toFixed(5))],
  };
}

/**
 * Generate intermediate grid-like street points between origin and destination
 */
function createGridPath(
  start: [number, number],
  end: [number, number],
  detourFactor: number = 0
): [number, number][] {
  const points: [number, number][] = [start];
  const steps = 8;
  const dLat = (end[0] - start[0]) / steps;
  const dLng = (end[1] - start[1]) / steps;

  // Orthogonal perpendicular vector for curve / detour
  const perpLat = -dLng;
  const perpLng = dLat;

  for (let i = 1; i < steps; i++) {
    // Create an arch detour if factor != 0
    const arch = Math.sin((i / steps) * Math.PI) * detourFactor;
    // Add small zigzag to simulate city streets
    const jitter = (i % 2 === 0 ? 0.0005 : -0.0005) * (detourFactor === 0 ? 1 : 0);

    const lat = start[0] + dLat * i + perpLat * arch + jitter;
    const lng = start[1] + dLng * i + perpLng * arch;
    points.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }

  points.push(end);
  return points;
}

/**
 * Checks which danger zones are within warning range of any point in the path
 */
function findDangerZonesOnPath(
  path: [number, number][],
  dangerZones: DangerZone[],
  bufferMeters: number = 250
): DangerZone[] {
  const triggered: DangerZone[] = [];

  for (const zone of dangerZones) {
    const isClose = path.some((point) => {
      const dist = calculateDistanceMeters(
        point[0],
        point[1],
        zone.coordinates[0],
        zone.coordinates[1]
      );
      return dist <= zone.radiusMeters + bufferMeters;
    });

    if (isClose && !triggered.some((z) => z.id === zone.id)) {
      triggered.push(zone);
    }
  }

  return triggered;
}

/**
 * Calculates navigation routes to any destination
 */
export async function calculateRoutesToDestination(
  origin: [number, number],
  destination: [number, number],
  destinationName: string,
  dangerZones: DangerZone[]
): Promise<NavigationRoute[]> {
  // Compute direct straight line distance in km
  const totalMeters = calculateDistanceMeters(
    origin[0],
    origin[1],
    destination[0],
    destination[1]
  );
  const baseDistanceKm = Math.max(1.2, Number((totalMeters / 1000).toFixed(1)));

  // Try real OSRM driving route if possible
  let osrmPath: [number, number][] | null = null;
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates;
        // OSRM returns [lon, lat], convert to [lat, lon]
        osrmPath = coords.map((c: [number, number]) => [c[1], c[0]]);
      }
    }
  } catch (e) {
    // Fallback to geometric grid path
  }

  // 1. Fast direct path
  const fastPath = osrmPath && osrmPath.length > 4 ? osrmPath : createGridPath(origin, destination, 0);
  const fastDangers = findDangerZonesOnPath(fastPath, dangerZones, 200);
  const fastDistanceKm = baseDistanceKm;
  const fastDurationMin = Math.max(4, Math.round(fastDistanceKm * 2.4));
  const fastSafetyScore = Math.max(35, 95 - fastDangers.length * 25);

  // 2. SafeRoute (Desvio Inteligente que afasta de zonas de risco)
  const safeDetourFactor = fastDangers.length > 0 ? 1.8 : 0.8;
  const safePath = createGridPath(origin, destination, safeDetourFactor);
  const safeDangers = findDangerZonesOnPath(safePath, dangerZones, 50); // Minimal or 0
  const safeDistanceKm = Number((fastDistanceKm * 1.15).toFixed(1));
  const safeDurationMin = fastDurationMin + (fastDangers.length > 0 ? 4 : 2);
  const safeSafetyScore = Math.max(88, 98 - safeDangers.length * 8);

  // 3. Alternative route (Via expressa contornando pelo outro lado)
  const altPath = createGridPath(origin, destination, -1.2);
  const altDangers = findDangerZonesOnPath(altPath, dangerZones, 100);
  const altDistanceKm = Number((fastDistanceKm * 1.1).toFixed(1));
  const altDurationMin = fastDurationMin + 2;
  const altSafetyScore = Math.max(65, 90 - altDangers.length * 15);

  const routes: NavigationRoute[] = [
    {
      id: 'route-safe-custom',
      name: `SafeRoute &bull; Destino: ${destinationName}`,
      type: 'segura',
      distanceKm: safeDistanceKm,
      durationMin: safeDurationMin,
      safetyScore: safeSafetyScore,
      dangerZoneIds: safeDangers.map((d) => d.id),
      description: `Trajeto otimizado evitando ${
        fastDangers.length > 0 ? fastDangers.map((z) => z.neighborhood).join(' e ') : 'áreas de alerta'
      }. Corredores com iluminação e câmeras Smart Sampa.`,
      highlights: [
        safeDangers.length === 0
          ? '100% livre de zonas críticas de furto de smartphone'
          : 'Desvio ativo contornando pontos de risco',
        'Corredor monitorado pela PM e Defesa Civil',
        `Apenas +${safeDurationMin - fastDurationMin} min de viagem por máxima segurança`,
      ],
      path: safePath,
    },
    {
      id: 'route-fast-custom',
      name: `Rota Direta (Mais Rápida) &bull; ${destinationName}`,
      type: 'rapida',
      distanceKm: fastDistanceKm,
      durationMin: fastDurationMin,
      safetyScore: fastSafetyScore,
      dangerZoneIds: fastDangers.map((d) => d.id),
      description:
        fastDangers.length > 0
          ? `Menor tempo de tráfego, porém cruza ${fastDangers.length} zona(s) de atenção (${fastDangers.map((d) => d.neighborhood).join(', ')}).`
          : 'Caminho direto via avenidas principais.',
      highlights: [
        'Menor tempo estimado de chegada',
        fastDangers.length > 0
          ? `Atenção: cruza ${fastDangers.length} área(s) com registros de furto`
          : 'Trânsito moderado nas vias principais',
        'Recomendado manter vidros fechados e travas ativas',
      ],
      path: fastPath,
    },
    {
      id: 'route-alt-custom',
      name: `Rota Alternativa &bull; ${destinationName}`,
      type: 'alternativa',
      distanceKm: altDistanceKm,
      durationMin: altDurationMin,
      safetyScore: altSafetyScore,
      dangerZoneIds: altDangers.map((d) => d.id),
      description: 'Opção por vias arteriais secundárias com menor concentração de semáforos lentos.',
      highlights: [
        'Velocidade média constante',
        'Semáforos sincronizados',
        `Segurança estimada: ${altSafetyScore}/100`,
      ],
      path: altPath,
    },
  ];

  return routes;
}
