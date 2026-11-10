import { IncidentReport, DangerZone } from '../types';
import { INITIAL_INCIDENT_REPORTS, INITIAL_DANGER_ZONES } from '../data/mockData';
import { getSupabaseClient, getStoredSupabaseConfig } from './supabase';
import { localDb } from './db';

const LOCAL_STORAGE_KEY = 'saferoute_incident_reports_v2';

function mergeMissingCuratedIncidents(items: IncidentReport[]): IncidentReport[] {
  const existingIds = new Set(items.map((i) => i.id));
  const missing = INITIAL_INCIDENT_REPORTS.filter((def) => !existingIds.has(def.id));
  return missing.length > 0 ? [...missing, ...items] : items;
}

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
  // READ: List all incident reports (Supabase -> IndexedDB -> LocalStorage fallback)
  async getAll(): Promise<IncidentReport[]> {
    const { isConfigured } = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: IncidentReport[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            description: item.description,
            neighborhood: item.neighborhood,
            address: item.address,
            coordinates: [item.latitude, item.longitude],
            riskLevel: item.risk_level,
            timestamp: new Date(item.created_at || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: item.status,
            confirmationsCount: item.confirmations_count || 1,
            reportedBy: item.reported_by || 'Cidadão',
            isUserCreated: true,
          }));

          // Sync into IndexedDB & LocalStorage
          for (const item of mapped) {
            await localDb.saveIncident(item);
          }
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to IndexedDB:', err);
      }
    }

    // Persistent IndexedDB lookup
    try {
      const dbResults = await localDb.getAllIncidents();
      if (dbResults && dbResults.length > 0) {
        const merged = mergeMissingCuratedIncidents(dbResults);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('IndexedDB read fallback:', e);
    }

    // LocalStorage fallback
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return mergeMissingCuratedIncidents(JSON.parse(stored));
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INCIDENT_REPORTS));
      return INITIAL_INCIDENT_REPORTS;
    } catch {
      return INITIAL_INCIDENT_REPORTS;
    }
  },

  // CREATE: Post report to Supabase + IndexedDB + LocalStorage
  async create(
    reportData: Omit<IncidentReport, 'id' | 'timestamp' | 'confirmationsCount' | 'status'>
  ): Promise<IncidentReport> {
    const newId = `inc-${Date.now()}`;
    const newReport: IncidentReport = {
      ...reportData,
      id: newId,
      timestamp: 'Agora mesmo',
      status: 'ativo',
      confirmationsCount: 1,
      isUserCreated: true,
    };

    const { isConfigured } = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (isConfigured) {
      try {
        await supabase.from('incidents').insert({
          id: newId,
          title: newReport.title,
          category: newReport.category,
          description: newReport.description,
          neighborhood: newReport.neighborhood,
          address: newReport.address,
          latitude: newReport.coordinates[0],
          longitude: newReport.coordinates[1],
          risk_level: newReport.riskLevel,
          status: newReport.status,
          confirmations_count: 1,
          reported_by: newReport.reportedBy,
        });
      } catch (err) {
        console.warn('Supabase insert error:', err);
      }
    }

    // Persist in IndexedDB
    try {
      await localDb.saveIncident(newReport);
    } catch (err) {
      console.warn('IndexedDB save error:', err);
    }

    // Backup in LocalStorage
    const current = await this.getAll();
    const updated = [newReport, ...current.filter((i) => i.id !== newId)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return newReport;
  },

  // UPDATE: Status or confirmations
  async update(id: string, patch: Partial<IncidentReport>): Promise<IncidentReport> {
    const { isConfigured } = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (isConfigured) {
      try {
        const payload: any = {};
        if (patch.status) payload.status = patch.status;
        if (patch.confirmationsCount !== undefined) {
          payload.confirmations_count = patch.confirmationsCount;
        }
        await supabase.from('incidents').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Supabase update error:', err);
      }
    }

    const current = await this.getAll();
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Incidente não encontrado');

    const updatedItem = { ...current[index], ...patch };
    try {
      await localDb.saveIncident(updatedItem);
    } catch (e) {
      console.warn('IndexedDB update error:', e);
    }

    current[index] = updatedItem;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    return updatedItem;
  },

  // DELETE
  async delete(id: string): Promise<boolean> {
    const { isConfigured } = getStoredSupabaseConfig();
    const supabase = getSupabaseClient();

    if (isConfigured) {
      try {
        await supabase.from('incidents').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    try {
      await localDb.deleteIncident(id);
    } catch (e) {
      console.warn('IndexedDB delete error:', e);
    }

    const current = await this.getAll();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // CONFIRM
  async confirm(id: string): Promise<IncidentReport> {
    const current = await this.getAll();
    const target = current.find((item) => item.id === id);
    if (!target) throw new Error('Incidente não encontrado');

    return this.update(id, {
      confirmationsCount: target.confirmationsCount + 1,
    });
  },

  async resetToDefault(): Promise<IncidentReport[]> {
    try {
      await localDb.populateDefaults();
    } catch (e) {
      console.warn('IndexedDB reset error:', e);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INCIDENT_REPORTS));
    return INITIAL_INCIDENT_REPORTS;
  },
};

export const defenseCivilApi = {
  async getOfficialZones(): Promise<DangerZone[]> {
    return INITIAL_DANGER_ZONES;
  },
};
