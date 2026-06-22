import api, { initSession } from '../../config/api';

const PassiveDCEquipmentService = {
  getAllPassiveDCEquipments: async () => {
    try {
      await initSession();
      const response = await api.get('/PassiveDCEquipment');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du matériel passif', error);
      throw error;
    }
  },

  getPassiveDCEquipmentById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/PassiveDCEquipment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du matériel passif avec l'ID ${id}`, error);
      throw error;
    }
  },

  createPassiveDCEquipment: async (data) => {
    try {
      await initSession();
      const response = await api.post('/PassiveDCEquipment', { input: data });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du matériel passif', error);
      throw error;
    }
  },

  deletePassiveDCEquipment: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/PassiveDCEquipment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du matériel passif avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default PassiveDCEquipmentService;
