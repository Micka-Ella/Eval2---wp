import api, { initSession } from '../../config/api';

const CartridgeItemService = {
  getAllCartridgeItems: async () => {
    try {
      await initSession();
      const response = await api.get('/CartridgeItem');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cartouches', error);
      throw error;
    }
  },

  getCartridgeItemById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/CartridgeItem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la cartouche avec l'ID ${id}`, error);
      throw error;
    }
  },

  createCartridgeItem: async (data) => {
    try {
      await initSession();
      const response = await api.post('/CartridgeItem', { input: data });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la cartouche', error);
      throw error;
    }
  },

  deleteCartridgeItem: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/CartridgeItem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la cartouche avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default CartridgeItemService;
