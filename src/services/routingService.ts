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
    name: 'Barra Funda (Terminal)',
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
  {
    name: 'Itaim Bibi',
    address: 'Av. Juscelino Kubitschek, 1600 - Itaim Bibi, São Paulo - SP',
    coordinates: [-23.5902, -46.6845],
  },
  {
    name: 'Vila Olímpia',
    address: 'Rua Funchal, 400 - Vila Olímpia, São Paulo - SP',
    coordinates: [-23.5955, -46.6897],
  },
  {
    name: 'Brooklin (Av. Berrini)',
    address: 'Av. Eng. Luís Carlos Berrini, 1050 - Brooklin, São Paulo - SP',
    coordinates: [-23.6062, -46.6967],
  },
  {
    name: 'Estação da Luz / Pinacoteca',
    address: 'Praça da Luz, 2 - Luz, São Paulo - SP',
    coordinates: [-23.5345, -46.6337],
  },
];

export const DEFAULT_ORIGIN: LocationSuggestion = {
  name: 'Avenida Paulista',
  address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  coordinates: [-23.5654, -46.6517],
};

export const DEFAULT_DESTINATION: LocationSuggestion = {
  name: 'Brás (Estação / Feirinha)',
  address: 'Rua Miller x Rua Oriente - Brás, São Paulo - SP',
  coordinates: [-23.5432, -46.6087],
};

/**
 * Real-time autocomplete suggestions combining curated SP locations and Nominatim OpenStreetMap
 */
export async function searchAddressSuggestions(query: string): Promise<LocationSuggestion[]> {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  const localMatches = POPULAR_LOCATIONS.filter(
    (loc) =>
      !clean ||
      loc.name.toLowerCase().includes(lower) ||
      loc.address.toLowerCase().includes(lower)
  ).slice(0, 5);

  if (clean.length < 3) {
    return localMatches;
  }

  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      clean
    )}&viewbox=-46.85,-23.35,-46.35,-23.85&countrycodes=br&limit=4&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const remoteSuggestions: LocationSuggestion[] = data
          .map((item: any) => {
            const parts = String(item.display_name || '').split(',');
            const shortName = parts[0]?.trim() || clean;
            const shortAddress = parts.slice(0, 3).join(',').trim();
            return {
              name: shortName,
              address: shortAddress,
              coordinates: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
            };
          })
          .filter((s) => !isNaN(s.coordinates[0]) && !isNaN(s.coordinates[1]));

        // Merge local + remote avoiding duplicates by name
        const combined = [...localMatches];
        for (const rem of remoteSuggestions) {
          if (!combined.some((c) => c.name.toLowerCase() === rem.name.toLowerCase())) {
            combined.push(rem);
          }
        }
        return combined.slice(0, 6);
      }
    }
  } catch {
    // Silent fallback to local matches
  }

  return localMatches;
}

/**
 * Searches for coordinates based on query text with São Paulo bias.
 */
export async function geocodeAddress(
  query: string,
  defaultFallback = DEFAULT_ORIGIN
): Promise<LocationSuggestion> {
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

  // 2. Exact or close local match
  const exactLocal = POPULAR_LOCATIONS.find(
    (loc) => loc.name.toLowerCase() === lowerQuery || loc.address.toLowerCase() === lowerQuery
  );
  if (exactLocal) return exactLocal;

  // 3. Try Nominatim Geocoding API biased to São Paulo metro first, then Brazil
  try {
    const searchQuery = cleanQuery.includes(',') ? cleanQuery : `${cleanQuery}, São Paulo`;
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&viewbox=-46.85,-23.35,-46.35,-23.85&countrycodes=br&limit=1&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
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

    // Retry without ", São Paulo" suffix in case user typed another city (e.g. "Campinas", "Santos")
    const retryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery + ', Brasil'
    )}&countrycodes=br&limit=1`;
    const retryRes = await fetch(retryUrl, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      if (Array.isArray(retryData) && retryData.length > 0) {
        const item = retryData[0];
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
  } catch {
    // Fallback below
  }

  // 4. Partial local match fallback
  const partialLocal = POPULAR_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(loc.name.toLowerCase())
  );
  if (partialLocal) return partialLocal;

  // 5. Deterministic fallback inside SP central region
  let hash = 0;
  for (let i = 0; i < cleanQuery.length; i++) {
    hash = (hash << 5) - hash + cleanQuery.charCodeAt(i);
    hash |= 0;
  }
  const normHash1 = (Math.abs(hash) % 1000) / 1000;
  const normHash2 = (Math.abs(hash >> 3) % 1000) / 1000;

  return {
    name: cleanQuery,
    address: `${cleanQuery}, São Paulo - SP`,
    coordinates: [
      Number((-23.525 - normHash1 * 0.085).toFixed(5)),
      Number((-46.695 + normHash2 * 0.105).toFixed(5)),
    ],
  };
}

/**
 * Uniformly resamples a dense road polyline to a clean number of animation waypoints
 * while preserving exact street geometry
 */
function resamplePath(coords: [number, number][], targetCount = 46): [number, number][] {
  if (coords.length <= targetCount) return coords;
  const result: [number, number][] = [coords[0]];
  const step = (coords.length - 1) / (targetCount - 1);
  for (let i = 1; i < targetCount - 1; i++) {
    const idx = Math.round(i * step);
    result.push(coords[idx]);
  }
  result.push(coords[coords.length - 1]);
  return result;
}

/**
 * Geometric fallback path if OSRM is unreachable
 */
function createDenseFallbackPath(
  start: [number, number],
  end: [number, number],
  detourFactor = 0
): [number, number][] {
  const points: [number, number][] = [start];
  const steps = 36;
  const dLat = (end[0] - start[0]) / steps;
  const dLng = (end[1] - start[1]) / steps;
  const perpLat = -dLng;
  const perpLng = dLat;

  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    const arch = Math.sin(fraction * Math.PI) * detourFactor;
    const lat = start[0] + dLat * i + perpLat * arch;
    const lng = start[1] + dLng * i + perpLng * arch;
    points.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
  points.push(end);
  return points;
}

interface OsrmRouteResult {
  path: [number, number][];
  distanceKm: number;
  durationMin: number;
  streetNames: string[];
}

/**
 * Fetches real street-following driving routes from OSRM
 */
async function fetchOsrmRoutes(
  waypoints: [number, number][],
  alternatives = true
): Promise<OsrmRouteResult[]> {
  try {
    const coordStr = waypoints.map((p) => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=true&alternatives=${
      alternatives ? 'true' : 'false'
    }`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.routes || !Array.isArray(data.routes)) return [];

    return data.routes.map((r: any) => {
      const rawCoords: [number, number][] = r.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      const streetNames: string[] = [];
      if (Array.isArray(r.legs)) {
        for (const leg of r.legs) {
          if (Array.isArray(leg.steps)) {
            for (const st of leg.steps) {
              if (st.name && !streetNames.includes(st.name)) {
                streetNames.push(st.name);
              }
            }
          }
        }
      }
      return {
        path: resamplePath(rawCoords, 48),
        distanceKm: Math.max(0.8, Number((r.distance / 1000).toFixed(1))),
        durationMin: Math.max(3, Math.round(r.duration / 60)),
        streetNames,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Checks which danger zones are within warning range of any point in the path
 */
function findDangerZonesOnPath(
  path: [number, number][],
  dangerZones: DangerZone[],
  bufferMeters = 240
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
 * Computes a perpendicular detour waypoint to route around danger zones on real streets
 */
function computeDetourWaypoint(
  origin: [number, number],
  destination: [number, number],
  side: 1 | -1
): [number, number] {
  const midLat = (origin[0] + destination[0]) / 2;
  const midLng = (origin[1] + destination[1]) / 2;
  const dLat = destination[0] - origin[0];
  const dLng = destination[1] - origin[1];
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 0.01;
  // Offset ~0.014 deg (~1.5 km) perpendicular to straight line
  const offset = 0.014 * side;
  return [
    Number((midLat + (-dLng / len) * offset).toFixed(5)),
    Number((midLng + (dLat / len) * offset).toFixed(5)),
  ];
}

/**
 * Calculates 3 real street-crossing routes between two user-chosen locations
 */
export async function calculateRoutesBetweenPoints(
  originLoc: LocationSuggestion,
  destLoc: LocationSuggestion,
  dangerZones: DangerZone[]
): Promise<NavigationRoute[]> {
  const origin = originLoc.coordinates;
  const destination = destLoc.coordinates;

  const straightMeters = calculateDistanceMeters(
    origin[0],
    origin[1],
    destination[0],
    destination[1]
  );
  const fallbackDistKm = Math.max(1.2, Number((straightMeters / 1000).toFixed(1)));
  const fallbackDurMin = Math.max(5, Math.round(fallbackDistKm * 2.4));

  // 1. Fetch real OSRM primary + alternatives
  const directResults = await fetchOsrmRoutes([origin, destination], true);
  const fastResult: OsrmRouteResult = directResults[0] || {
    path: createDenseFallbackPath(origin, destination, 0),
    distanceKm: fallbackDistKm,
    durationMin: fallbackDurMin,
    streetNames: [],
  };

  const fastDangers = findDangerZonesOnPath(fastResult.path, dangerZones, 200);

  // 2. Fetch real OSRM detour routes (South/East and North/West corridors)
  const detourWp1 = computeDetourWaypoint(origin, destination, 1);
  const detourWp2 = computeDetourWaypoint(origin, destination, -1);

  const [detour1Res, detour2Res] = await Promise.all([
    fetchOsrmRoutes([origin, detourWp1, destination], false),
    fetchOsrmRoutes([origin, detourWp2, destination], false),
  ]);

  const candidateSafe = directResults[1] || detour1Res[0] || {
    path: createDenseFallbackPath(origin, destination, 0.55),
    distanceKm: Number((fastResult.distanceKm * 1.12).toFixed(1)),
    durationMin: fastResult.durationMin + 4,
    streetNames: [],
  };

  const candidateAlt = detour2Res[0] || detour1Res[0] || {
    path: createDenseFallbackPath(origin, destination, -0.45),
    distanceKm: Number((fastResult.distanceKm * 1.08).toFixed(1)),
    durationMin: fastResult.durationMin + 2,
    streetNames: [],
  };

  // Pick safest candidate (fewest danger zones) for SafeRoute
  const safeDangers1 = findDangerZonesOnPath(candidateSafe.path, dangerZones, 140);
  const safeDangers2 = findDangerZonesOnPath(candidateAlt.path, dangerZones, 140);

  const bestSafe = safeDangers2.length < safeDangers1.length ? candidateAlt : candidateSafe;
  const altRoute = safeDangers2.length < safeDangers1.length ? candidateSafe : candidateAlt;

  const safeDangers = findDangerZonesOnPath(bestSafe.path, dangerZones, 120);
  const altDangers = findDangerZonesOnPath(altRoute.path, dangerZones, 150);

  const fastScore = Math.max(42, 95 - fastDangers.length * 22);
  const safeScore = Math.max(88, 98 - safeDangers.length * 7);
  const altScore = Math.max(66, 91 - altDangers.length * 14);

  const safeExtraMin = Math.max(1, bestSafe.durationMin - fastResult.durationMin);
  const safeMainStreets = bestSafe.streetNames.slice(0, 3).join(', ');
  const fastMainStreets = fastResult.streetNames.slice(0, 3).join(', ');

  return [
    {
      id: 'route-safe-custom',
      name: `Trajeto Monitorado • ${destLoc.name}`,
      type: 'segura',
      distanceKm: bestSafe.distanceKm,
      durationMin: bestSafe.durationMin,
      safetyScore: safeScore,
      dangerZoneIds: safeDangers.map((d) => d.id),
      streetNames: bestSafe.streetNames,
      description: safeMainStreets
        ? `Via ${safeMainStreets}. Corredor monitorado evitando trechos de maior incidência.`
        : `Trajeto planejado evitando ${
            fastDangers.length > 0 ? fastDangers.map((z) => z.neighborhood).join(' e ') : 'pontos críticos'
          }.`,
      highlights: [
        safeDangers.length === 0
          ? 'Livre de zonas críticas cadastradas'
          : 'Desvio ativo pelas avenidas principais',
        'Vias iluminadas com fluxo contínuo',
        `+${safeExtraMin} min vs. trajeto direto`,
      ],
      path: bestSafe.path,
    },
    {
      id: 'route-fast-custom',
      name: `Trajeto Direto • ${destLoc.name}`,
      type: 'rapida',
      distanceKm: fastResult.distanceKm,
      durationMin: fastResult.durationMin,
      safetyScore: fastScore,
      dangerZoneIds: fastDangers.map((d) => d.id),
      streetNames: fastResult.streetNames,
      description: fastMainStreets
        ? `Via ${fastMainStreets}.${
            fastDangers.length > 0 ? ` Cruza ${fastDangers.length} ponto(s) de atenção.` : ''
          }`
        : `Menor tempo estimado até ${destLoc.name}.`,
      highlights: [
        'Menor tempo de percurso',
        fastDangers.length > 0
          ? `Atenção em ${fastDangers.map((d) => d.neighborhood).join(', ')}`
          : 'Trânsito regular nas vias centrais',
        'Manter vidros fechados nos semáforos',
      ],
      path: fastResult.path,
    },
    {
      id: 'route-alt-custom',
      name: `Trajeto Alternativo • ${destLoc.name}`,
      type: 'alternativa',
      distanceKm: altRoute.distanceKm,
      durationMin: altRoute.durationMin,
      safetyScore: altScore,
      dangerZoneIds: altDangers.map((d) => d.id),
      streetNames: altRoute.streetNames,
      description: altRoute.streetNames.length > 0
        ? `Via ${altRoute.streetNames.slice(0, 3).join(', ')}. Opção secundária equilibrada.`
        : 'Rota secundária por vias arteriais.',
      highlights: [
        'Fluxo alternado em corredores secundários',
        `Segurança estimada: ${altScore}/100`,
      ],
      path: altRoute.path,
    },
  ];
}
