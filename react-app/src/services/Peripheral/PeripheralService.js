import api, { initSession } from '../../config/api';

const PeripheralService = {
  getAllPeripherals: async () => {
    try {
      await initSession();
      const response = await api.get('/Peripheral');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des périphériques', error);
      throw error;
    }
  },

  getPeripheralById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Peripheral/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du périphérique avec l'ID ${id}`, error);
      throw error;
    }
  },

  createPeripheral: async (peripheralData) => {
    try {
      await initSession();
      const response = await api.post('/Peripheral', { input: peripheralData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du périphérique', error);
      throw error;
    }
  },

  updatePeripheral: async (id, peripheralData) => {
    try {
      await initSession();
      const response = await api.put(`/Peripheral/${id}`, { input: peripheralData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du périphérique avec l'ID ${id}`, error);
      throw error;
    }
  },

  deletePeripheral: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Peripheral/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du périphérique avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default PeripheralService;