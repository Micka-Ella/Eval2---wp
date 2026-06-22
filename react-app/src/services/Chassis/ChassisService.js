import api, { initSession } from '../../config/api';

const ChassisService = {
  getAllChassis: async () => {
    try {
      await initSession();
      const response = await api.get('/Enclosure');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des châssis', error);
      throw error;
    }
  },

  getChassisById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Enclosure/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du châssis avec l'ID ${id}`, error);
      throw error;
    }
  },

  createChassis: async (chassisData) => {
    try {
      await initSession();
      const response = await api.post('/Enclosure', { input: chassisData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du châssis', error);
      throw error;
    }
  },

  updateChassis: async (id, chassisData) => {
    try {
      await initSession();
      const response = await api.put(`/Enclosure/${id}`, { input: chassisData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du châssis avec l'ID ${id}`, error);
      throw error;
    }
  },

  deleteChassis: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Enclosure/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du châssis avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default ChassisService;
