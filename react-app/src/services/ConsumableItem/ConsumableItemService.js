import api, { initSession } from '../../config/api';

const ConsumableItemService = {
  getAllConsumableItems: async () => {
    try {
      await initSession();
      const response = await api.get('/ConsumableItem');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des consommables', error);
      throw error;
    }
  },

  getConsumableItemById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/ConsumableItem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du consommable avec l'ID ${id}`, error);
      throw error;
    }
  },

  createConsumableItem: async (data) => {
    try {
      await initSession();
      const response = await api.post('/ConsumableItem', { input: data });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du consommable', error);
      throw error;
    }
  },

  deleteConsumableItem: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/ConsumableItem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du consommable avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default ConsumableItemService;
