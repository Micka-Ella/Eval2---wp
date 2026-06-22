import api, { initSession } from '../../config/api';

const NetworkEquipmentService = {
  getAllNetworkEquipment: async () => {
    return await NetworkEquipmentService.getAllNetworkEquipments();
  },
  getAllNetworkEquipments: async () => {
    try {
      await initSession();
      const response = await api.get('/NetworkEquipment');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du matériel réseau', error);
      throw error;
    }
  },

  getNetworkEquipmentById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/NetworkEquipment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du matériel réseau avec l'ID ${id}`, error);
      throw error;
    }
  },

  createNetworkEquipment: async (networkData) => {
    try {
      await initSession();
      const response = await api.post('/NetworkEquipment', { input: networkData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du matériel réseau', error);
      throw error;
    }
  },

  updateNetworkEquipment: async (id, networkData) => {
    try {
      await initSession();
      const response = await api.put(`/NetworkEquipment/${id}`, { input: networkData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du matériel réseau avec l'ID ${id}`, error);
      throw error;
    }
  },

  deleteNetworkEquipment: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/NetworkEquipment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du matériel réseau avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default NetworkEquipmentService;
