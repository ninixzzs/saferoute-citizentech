import { useState, useEffect, useCallback } from 'react';
import { IncidentReport, DangerZone, IncidentCategory, RiskLevel } from '../types';
import { incidentApi, defenseCivilApi } from '../services/api';

export function useSafetyAlerts() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | 'todos'>('todos');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'todos'>('todos');

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incidentList, zonesList] = await Promise.all([
        incidentApi.getAll(),
        defenseCivilApi.getOfficialZones(),
      ]);
      setIncidents(incidentList);
      setDangerZones(zonesList);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar dados de segurança.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // CRUD operations
  const addIncident = async (
    data: Omit<IncidentReport, 'id' | 'timestamp' | 'confirmationsCount' | 'status'>
  ) => {
    try {
      const created = await incidentApi.create(data);
      setIncidents((prev) => [created, ...prev]);
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
    refresh: loadData,
  };
}
