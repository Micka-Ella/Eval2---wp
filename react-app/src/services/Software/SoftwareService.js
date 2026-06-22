import api, { initSession } from '../../config/api';

const SoftwareService = {
  getAllSoftware: async () => {
    try {
      await initSession();
      const response = await api.get('/Software');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des logiciels', error);
      throw error;
    }
  },

  getSoftwareById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Software/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du logiciel avec l'ID ${id}`, error);
      throw error;
    }
  },

  createSoftware: async (softwareData) => {
    try {
      await initSession();
      const response = await api.post('/Software', { input: softwareData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du logiciel', error);
      throw error;
    }
  },

  updateSoftware: async (id, softwareData) => {
    try {
      await initSession();
      const response = await api.put(`/Software/${id}`, { input: softwareData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du logiciel avec l'ID ${id}`, error);
      throw error;
    }
  },

  deleteSoftware: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Software/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du logiciel avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default SoftwareService;
