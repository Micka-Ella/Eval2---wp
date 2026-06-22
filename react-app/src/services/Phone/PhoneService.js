import api, { initSession } from '../../config/api';

const PhoneService = {
  getAllPhones: async () => {
    try {
      await initSession();
      const response = await api.get('/Phone');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des téléphones', error);
      throw error;
    }
  },

  getPhoneById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Phone/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du téléphone avec l'ID ${id}`, error);
      throw error;
    }
  },

  createPhone: async (phoneData) => {
    try {
      await initSession();
      const response = await api.post('/Phone', { input: phoneData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du téléphone', error);
      throw error;
    }
  },

  updatePhone: async (id, phoneData) => {
    try {
      await initSession();
      const response = await api.put(`/Phone/${id}`, { input: phoneData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du téléphone avec l'ID ${id}`, error);
      throw error;
    }
  },

  deletePhone: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Phone/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du téléphone avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default PhoneService;
