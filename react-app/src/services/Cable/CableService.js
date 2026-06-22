import api, { initSession } from '../../config/api';

const CableService = {
  getAllCables: async () => {
    try {
      await initSession();
      const response = await api.get('/Cable');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des câbles', error);
      throw error;
    }
  },

  getCableById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Cable/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du câble avec l'ID ${id}`, error);
      throw error;
    }
  },

  createCable: async (data) => {
    try {
      await initSession();
      const response = await api.post('/Cable', { input: data });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du câble', error);
      throw error;
    }
  },

  deleteCable: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Cable/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du câble avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default CableService;
