import api, { initSession } from '../../config/api';

const MonitorService = {
  getAllMonitors: async () => {
    try {
      await initSession();
      const response = await api.get('/Monitor');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des moniteurs', error);
      throw error;
    }
  },

  getMonitorById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Monitor/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du moniteur avec l'ID ${id}`, error);
      throw error;
    }
  },

  createMonitor: async (monitorData) => {
    try {
      await initSession();
      const response = await api.post('/Monitor', { input: monitorData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du moniteur', error);
      throw error;
    }
  },

  updateMonitor: async (id, monitorData) => {
    try {
      await initSession();
      const response = await api.put(`/Monitor/${id}`, { input: monitorData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du moniteur avec l'ID ${id}`, error);
      throw error;
    }
  },

  deleteMonitor: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Monitor/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du moniteur avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default MonitorService;
