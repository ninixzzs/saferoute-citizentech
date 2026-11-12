export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico';

export type TravelMode = 'carro' | 'moto' | 'a_pe';

export type IncidentCategory =
  | 'furto_celular'
  | 'assalto'
  | 'arrastao'
  | 'alagamento'
  | 'iluminacao_precaria'
  | 'area_deserta'
  | 'outro';

export interface DangerZone {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  riskLevel: RiskLevel;
  coordinates: [number, number]; // [lat, lng]
  radiusMeters: number;
  primaryRisk: IncidentCategory;
  title: string;
  description: string;
  defenseCivilTip: string;
  safeAlternativeAdvice: string;
  recentIncidentsCount: number;
  source: 'Defesa Civil SP' | 'SSP-SP' | 'CitizenTech Rede';
}

export interface IncidentReport {
  id: string;
  title: string;
  category: IncidentCategory;
  description: string;
  neighborhood: string;
  address: string;
  coordinates: [number, number];
  riskLevel: RiskLevel;
  timestamp: string;
  status: 'ativo' | 'em_verificacao' | 'resolvido';
  confirmationsCount: number;
  reportedBy: string;
  isUserCreated?: boolean;
}

export interface RouteStep {
  instruction: string;
  street: string;
  distanceMeters: number;
  modifier?: string;
}

export interface NavigationRoute {
  id: string;
  name: string;
  type: 'rapida' | 'segura' | 'alternativa';
  distanceKm: number;
  durationMin: number;
  baseDurationMin?: number;
  safetyScore: number; // 0 - 100
  path: [number, number][];
  dangerZoneIds: string[];
  description: string;
  highlights: string[];
  streetNames?: string[];
  steps?: RouteStep[];
}

export interface NavigationState {
  isNavigating: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  userPosition: [number, number];
  activeRoute: NavigationRoute | null;
  activeAlert: DangerZone | null;
  speedKmH: number;
  voiceAlertsEnabled: boolean;
}
