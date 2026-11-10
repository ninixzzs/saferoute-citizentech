import { useState, useEffect, useCallback } from 'react';
import { IncidentReport, DangerZone, IncidentCategory, RiskLevel } from '../types';
import { incidentApi, defenseCivilApi } from '../services/api';

export function useSafetyAlerts() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | 'todos'>('todos');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'todos'>('todos');

  const mergeIncidentZones = useCallback(
    (baseZones: DangerZone[], incidentList: IncidentReport[]): DangerZone[] => {
      const elevated = incidentList
        .filter((inc) => inc.status !== 'resolvido' && (inc.riskLevel === 'alto' || inc.riskLevel === 'critico'))
        .map<DangerZone>((inc) => ({
          id: `zone-${inc.id}`,
          name: `${inc.neighborhood} — ${inc.title}`,
          neighborhood: inc.neighborhood,
          city: 'São Paulo',
          riskLevel: inc.riskLevel,
          coordinates: inc.coordinates,
          radiusMeters: 450,
          primaryRisk: inc.category,
          title: inc.title,
          description: inc.description,
          defenseCivilTip:
            'Área recém-reportada com risco elevado. Mantenha vidros fechados, portas travadas e evite expor o celular em semáforos.',
          safeAlternativeAdvice: 'Utilize vias principais monitoradas e mantenha atenção redobrada.',
          recentIncidentsCount: Math.max(1, inc.confirmationsCount),
          source: 'CitizenTech Rede',
        }));

      const seenIds = new Set(elevated.map((e) => e.id));
      const baseFiltered = baseZones.filter((z) => !seenIds.has(z.id));
      return [...elevated, ...baseFiltered];
    },
    []
  );

  // Load initial data (supports silent background sync)
  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const [incidentList, zonesList] = await Promise.all([
          incidentApi.getAll(),
          defenseCivilApi.getOfficialZones(),
        ]);
        setIncidents(incidentList);
        setDangerZones(mergeIncidentZones(zonesList, incidentList));
        setLastUpdatedAt(new Date());
      } catch (err: any) {
        setError(err?.message || 'Falha ao carregar dados de segurança.');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [mergeIncidentZones]
  );

  useEffect(() => {
    loadData();
    const timer = window.setInterval(() => {
      loadData(true);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  // CRUD operations
  const addIncident = async (
    data: Omit<IncidentReport, 'id' | 'timestamp' | 'confirmationsCount' | 'status'>
  ) => {
    try {
      const created = await incidentApi.create(data);
      setIncidents((prev) => [created, ...prev]);

      // Elevate high/critical user reports into active monitored DangerZones so route alerts fire automatically
      if (created.riskLevel === 'alto' || created.riskLevel === 'critico') {
        const dynamicZone: DangerZone = {
          id: `zone-${created.id}`,
          name: `${created.neighborhood} — ${created.title}`,
          neighborhood: created.neighborhood,
          city: 'São Paulo',
          riskLevel: created.riskLevel,
          coordinates: created.coordinates,
          radiusMeters: 450,
          primaryRisk: created.category,
          title: created.title,
          description: created.description,
          defenseCivilTip:
            'Área recém-reportada com risco elevado. Mantenha vidros fechados, portas travadas e evite expor o celular em semáforos.',
          safeAlternativeAdvice: 'Utilize vias principais monitoradas e mantenha atenção redobrada.',
          recentIncidentsCount: 1,
          source: 'CitizenTech Rede',
        };
        setDangerZones((prev) => [dynamicZone, ...prev]);
      }

      return created;
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar incidente.');
      throw err;
    }
  };

  const updateIncident = async (id: string, patch: Partial<IncidentReport>) => {
    try {
      const updated = await incidentApi.update(id, patch);
      setIncidents((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar incidente.');
      throw err;
    }
  };

  const deleteIncident = async (id: string) => {
    try {
      await incidentApi.delete(id);
      setIncidents((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir incidente.');
      throw err;
    }
  };

  const confirmIncident = async (id: string) => {
    try {
      const updated = await incidentApi.confirm(id);
      setIncidents((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Erro ao confirmar incidente.');
      throw err;
    }
  };

  const resetData = async () => {
    setLoading(true);
    try {
      const defaults = await incidentApi.resetToDefault();
      setIncidents(defaults);
    } finally {
      setLoading(false);
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'todos' || item.category === selectedCategory;

    const matchesRisk =
      selectedRisk === 'todos' || item.riskLevel === selectedRisk;

    return matchesSearch && matchesCategory && matchesRisk;
  });

  return {
    incidents: filteredIncidents,
    allIncidents: incidents,
    dangerZones,
    loading,
    error,
    lastUpdatedAt,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedRisk,
    setSelectedRisk,
    addIncident,
    updateIncident,
    deleteIncident,
    confirmIncident,
    resetData,
    refresh: () => loadData(false),
  };
}
