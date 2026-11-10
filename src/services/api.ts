import { IncidentReport, DangerZone } from '../types';
import { INITIAL_INCIDENT_REPORTS, INITIAL_DANGER_ZONES } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'saferoute_incident_reports_v1';
const EXTERNAL_API_URL = 'https://jsonplaceholder.typicode.com/posts';

// Helper to calculate distance in meters between two lat/lng points using Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const incidentApi = {
  // READ: List all incident reports
  async getAll(): Promise<IncidentReport[]> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // If not yet in localStorage, initialize with default SP incidents
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INCIDENT_REPORTS));
      return INITIAL_INCIDENT_REPORTS;
    } catch (err) {
      console.warn('Fallback to initial reports due to storage error:', err);
      return INITIAL_INCIDENT_REPORTS;
    }
  },

  // CREATE: Post a new citizen safety report to external API + local storage
  async create(reportData: Omit<IncidentReport, 'id' | 'timestamp' | 'confirmationsCount' | 'status'>): Promise<IncidentReport> {
    const newReport: IncidentReport = {
      ...reportData,
      id: `inc-${Date.now()}`,
      timestamp: 'Agora mesmo',
      status: 'ativo',
      confirmationsCount: 1,
      isUserCreated: true,
    };

    // Try posting to real external REST API (JSONPlaceholder simulates public backend)
    try {
      await fetch(EXTERNAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newReport.title,
          body: `${newReport.category} | ${newReport.description} | ${newReport.address}`,
          userId: 1,
        }),
      });
    } catch (apiError) {
      console.warn('External API call failed, persisting locally:', apiError);
    }

    // Persist in local storage
    const current = await this.getAll();
    const updated = [newReport, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return newReport;
  },

  // UPDATE: Edit incident status or details
  async update(id: string, patch: Partial<IncidentReport>): Promise<IncidentReport> {
    // Try external API PUT/PATCH simulation
    try {
      await fetch(`${EXTERNAL_API_URL}/1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch (e) {
      console.warn('External API PATCH failed:', e);
    }

    const current = await this.getAll();
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Incidente com ID ${id} não encontrado.`);
    }

    const updatedItem = { ...current[index], ...patch };
    current[index] = updatedItem;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    return updatedItem;
  },

  // DELETE: Remove or resolve an alert report
  async delete(id: string): Promise<boolean> {
    try {
      await fetch(`${EXTERNAL_API_URL}/1`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('External API DELETE error:', e);
    }

    const current = await this.getAll();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // UPVOTE / CONFIRM: Citizen confirmation of danger
  async confirm(id: string): Promise<IncidentReport> {
    const current = await this.getAll();
    const target = current.find((item) => item.id === id);
    if (!target) throw new Error('Incidente não encontrado');

    const updated = await this.update(id, {
      confirmationsCount: target.confirmationsCount + 1,
    });
    return updated;
  },

  // Reset to initial mock database
  async resetToDefault(): Promise<IncidentReport[]> {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INCIDENT_REPORTS));
    return INITIAL_INCIDENT_REPORTS;
  }
};

export const defenseCivilApi = {
  async getOfficialZones(): Promise<DangerZone[]> {
    return INITIAL_DANGER_ZONES;
  }
};
