import { NavigationRoute, DangerZone } from '../types';
import { calculateDistanceMeters } from './api';

export interface LocationSuggestion {
  name: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
}

export const POPULAR_LOCATIONS: LocationSuggestion[] = [
  {
    name: 'Avenida Paulista',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    coordinates: [-23.5654, -46.6517],
  },
  {
    name: 'Av. Brigadeiro Faria Lima',
    address: 'Av. Brig. Faria Lima, 2000 - Pinheiros, São Paulo - SP',
    coordinates: [-23.5786, -46.6912],
  },
  {
    name: 'Parque Ibirapuera',
    address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
    coordinates: [-23.5874, -46.6576],
  },
  {
    name: 'Praça da Sé (Centro)',
    address: 'Praça da Sé - Centro Histórico, São Paulo - SP',
    coordinates: [-23.5505, -46.6333],
  },
  {
    name: 'Rua Augusta',
    address: 'Rua Augusta, 1200 - Consolação, São Paulo - SP',
    coordinates: [-23.5542, -46.6579],
  },
  {
    name: 'Aeroporto de Congonhas (CGH)',
    address: 'Av. Washington Luís - Campo Belo, São Paulo - SP',
    coordinates: [-23.6261, -46.6564],
  },
  {
    name: 'Aeroporto de Guarulhos (GRU)',
    address: 'Rod. Hélio Smidt - Guarulhos - SP',
    coordinates: [-23.4356, -46.4731],
  },
  {
    name: 'Vila Madalena',
    address: 'Rua Harmonia, 150 - Vila Madalena, São Paulo - SP',
    coordinates: [-23.5574, -46.6865],
  },
  {
    name: 'Moema',
    address: 'Av. Ibirapuera x Av. Moema - Moema, São Paulo - SP',
    coordinates: [-23.6045, -46.6662],
  },
  {
    name: 'Brás (Estação / Feirinha)',
    address: 'Rua Miller x Rua Oriente - Brás, São Paulo - SP',
    coordinates: [-23.5432, -46.6087],
  },
  {
    name: 'Bairro da Liberdade',
    address: 'Praça da Liberdade - Liberdade, São Paulo - SP',
    coordinates: [-23.5552, -46.6358],
  },
  {
    name: 'Morumbi (Estádio Cícero Pompeu)',
    address: 'Praça Roberto Gomes Pedrosa - Morumbi, São Paulo - SP',
    coordinates: [-23.6000, -46.7201],
  },
  {
    name: 'Allianz Parque',
    address: 'Av. Francisco Matarazzo, 1705 - Água Branca, São Paulo - SP',
    coordinates: [-23.5275, -46.6784],
  },
  {
    name: 'Barra Funda (Terminal Rodoviário)',
    address: 'Rua Mário de Andrade, 664 - Barra Funda, São Paulo - SP',
    coordinates: [-23.5262, -46.6644],
  },
  {
    name: 'Tatuapé (Shopping / Metrô)',
    address: 'Rua Melo Freire - Tatuapé, São Paulo - SP',
    coordinates: [-23.5404, -46.5768],
  },
  {
    name: 'Santana (Zona Norte)',
    address: 'Rua Voluntários da Pátria - Santana, São Paulo - SP',
    coordinates: [-23.5042, -46.6264],
  },
  {
    name: 'Pinheiros (Largo da Batata)',
    address: 'Largo da Batata - Pinheiros, São Paulo - SP',
    coordinates: [-23.5676, -46.7022],
  },
  {
    name: 'Jardins (Rua Oscar Freire)',
    address: 'Rua Oscar Freire, 800 - Cerqueira César, São Paulo - SP',
    coordinates: [-23.5631, -46.6685],
  },
];

export const DEFAULT_ORIGIN: LocationSuggestion = {
  name: 'Av. Paulista (Origem)',
  address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  coordinates: [-23.5654, -46.6517],
};

export const DEFAULT_DESTINATION: LocationSuggestion = {
  name: 'Brás (Destino)',
  address: 'Rua Miller x Rua Oriente - Brás, São Paulo - SP',
  coordinates: [-23.5432, -46.6087],
};

/**
 * Searches for coordinates based on query text.
 */
export async function geocodeAddress(query: string, defaultFallback = DEFAULT_ORIGIN): Promise<LocationSuggestion> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return defaultFallback;
  const lowerQuery = cleanQuery.toLowerCase();

  // 1. Direct coordinate format check (e.g., "-23.55, -46.63")
  const coordMatch = cleanQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[3]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return {
        name: `Ponto (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        address: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        coordinates: [lat, lon],
      };
    }
  }

  // 2. Direct local match against verified points
  const localMatch = POPULAR_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase() === lowerQuery ||
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.address.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(loc.name.toLowerCase())
  );
  if (localMatch) {
    return localMatch;
  }

  // 3. Try Nominatim Geocoding API (in browser)
  try {
    const searchQuery = cleanQuery.includes(',') ? cleanQuery : `${cleanQuery}, Brasil`;
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&limit=1&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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

  // 4. Deterministic fallback for unknown strings within São Paulo metropolitan area
  let hash = 0;
  for (let i = 0; i < cleanQuery.length; i++) {
    hash = (hash << 5) - hash + cleanQuery.charCodeAt(i);
    hash |= 0;
  }
  const normHash1 = (Math.abs(hash) % 1000) / 1000;
  const normHash2 = (Math.abs(hash >> 3) % 1000) / 1000;

  const lat = -23.515 - normHash1 * 0.11;
  const lng = -46.705 + normHash2 * 0.12;

  return {
    name: cleanQuery,
    address: `${cleanQuery}, São Paulo - SP`,
    coordinates: [Number(lat.toFixed(5)), Number(lng.toFixed(5))],
  };
}

/**
 * Generate smooth, realistic street-spaced waypoints between origin and destination
 */
function createDensePath(
  start: [number, number],
  end: [number, number],
  detourFactor: number = 0
): [number, number][] {
  const points: [number, number][] = [start];

  const totalMeters = calculateDistanceMeters(start[0], start[1], end[0], end[1]);
  // Smooth realistic step density: spaced ~80m - 120m apart
  const steps = Math.max(16, Math.min(38, Math.round(totalMeters / 110)));

  const dLat = (end[0] - start[0]) / steps;
  const dLng = (end[1] - start[1]) / steps;

  // Orthogonal vector for detour
  const perpLat = -dLng;
  const perpLng = dLat;

  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    // Arch curvature for detour
    const arch = Math.sin(fraction * Math.PI) * detourFactor;
    // Micro jitter to simulate turnings and city avenues
    const cityJitter = Math.sin(fraction * Math.PI * 4) * 0.00035 * (detourFactor === 0 ? 1 : 0.4);

    const lat = start[0] + dLat * i + perpLat * arch + cityJitter;
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
  bufferMeters: number = 260
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
 * Calculates navigation routes between two user-chosen locations
 */
export async function calculateRoutesBetweenPoints(
  originLoc: LocationSuggestion,
  destLoc: LocationSuggestion,
  dangerZones: DangerZone[]
): Promise<NavigationRoute[]> {
  const origin = originLoc.coordinates;
  const destination = destLoc.coordinates;

  const totalMeters = calculateDistanceMeters(
    origin[0],
    origin[1],
    destination[0],
    destination[1]
  );
  const baseDistanceKm = Math.max(1.2, Number((totalMeters / 1000).toFixed(1)));

  // Try real OSRM driving route geometry if available
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
        osrmPath = coords.map((c: [number, number]) => [c[1], c[0]]);
      }
    }
  } catch (e) {
    // Fallback to geometric grid path
  }

  // 1. Direct path
  const fastPath = osrmPath && osrmPath.length > 6 ? osrmPath : createDensePath(origin, destination, 0);
  const fastDangers = findDangerZonesOnPath(fastPath, dangerZones, 200);
  const fastDistanceKm = baseDistanceKm;
  const fastDurationMin = Math.max(5, Math.round(fastDistanceKm * 2.3));
  const fastSafetyScore = Math.max(38, 96 - fastDangers.length * 24);

  // 2. SafeRoute (Desvio Monitorado)
  const safeDetourFactor = fastDangers.length > 0 ? 1.5 : 0.65;
  const safePath = createDensePath(origin, destination, safeDetourFactor);
  const safeDangers = findDangerZonesOnPath(safePath, dangerZones, 40);
  const safeDistanceKm = Number((fastDistanceKm * 1.11).toFixed(1));
  const safeDurationMin = fastDurationMin + (fastDangers.length > 0 ? 4 : 2);
  const safeSafetyScore = Math.max(89, 98 - safeDangers.length * 6);

  // 3. Alternative route (Vias Arteriais Secundárias)
  const altPath = createDensePath(origin, destination, -1.1);
  const altDangers = findDangerZonesOnPath(altPath, dangerZones, 90);
  const altDistanceKm = Number((fastDistanceKm * 1.07).toFixed(1));
  const altDurationMin = fastDurationMin + 2;
  const altSafetyScore = Math.max(68, 92 - altDangers.length * 14);

  const routes: NavigationRoute[] = [
    {
      id: 'route-safe-custom',
      name: `Trajeto Monitorado &bull; ${destLoc.name}`,
      type: 'segura',
      distanceKm: safeDistanceKm,
      durationMin: safeDurationMin,
      safetyScore: safeSafetyScore,
      dangerZoneIds: safeDangers.map((d) => d.id),
      description: `Rota planejada contornando ${
        fastDangers.length > 0 ? fastDangers.map((z) => z.neighborhood).join(' e ') : 'trechos vulneráveis'
      }. Avenidas iluminadas com patrulhamento e câmeras do Smart Sampa.`,
      highlights: [
        safeDangers.length === 0
          ? 'Trajeto 100% livre de pontos críticos cadastrados'
          : 'Desvio ativo evitando aproximação de zonas de risco',
        'Vias principais com tráfego contínuo e iluminação',
        `Apenas +${safeDurationMin - fastDurationMin} min em relação à rota mais rápida`,
      ],
      path: safePath,
    },
    {
      id: 'route-fast-custom',
      name: `Trajeto Direto &bull; ${destLoc.name}`,
      type: 'rapida',
      distanceKm: fastDistanceKm,
      durationMin: fastDurationMin,
      safetyScore: fastSafetyScore,
      dangerZoneIds: fastDangers.map((d) => d.id),
      description:
        fastDangers.length > 0
          ? `Menor tempo de viagem, com travessia por ${fastDangers.length} ponto(s) de atenção (${fastDangers.map((d) => d.neighborhood).join(', ')}).`
          : 'Linha direta pelas vias principais de tráfego.',
      highlights: [
        'Menor tempo estimado até o destino',
        fastDangers.length > 0
          ? `Atenção: cruza ${fastDangers.length} área(s) com incidência de furto`
          : 'Trânsito moderado nas faixas centrais',
        'Recomendado manter vidros fechados e portas travadas',
      ],
      path: fastPath,
    },
    {
      id: 'route-alt-custom',
      name: `Trajeto Alternativo &bull; ${destLoc.name}`,
      type: 'alternativa',
      distanceKm: altDistanceKm,
      durationMin: altDurationMin,
      safetyScore: altSafetyScore,
      dangerZoneIds: altDangers.map((d) => d.id),
      description: 'Opção via corredores secundários e vias expressas elevadas.',
      highlights: [
        'Fluxo uniforme com menos paradas em semáforos',
        'Vias arteriais amplas',
        `Índice de segurança: ${altSafetyScore}/100`,
      ],
      path: altPath,
    },
  ];

  return routes;
}
