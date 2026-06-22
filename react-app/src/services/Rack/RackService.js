import api, { initSession } from '../../config/api';

const RackService = {
  getAllRacks: async () => {
    try {
      await initSession();
      const response = await api.get('/Rack');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des baies', error);
      throw error;
    }
  },

  getRackById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Rack/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la baie avec l'ID ${id}`, error);
      throw error;
    }
  },

  createRack: async (rackData) => {
    try {
      await initSession();
      const response = await api.post('/Rack', { input: rackData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la baie', error);
      throw error;
    }
  },

  updateRack: async (id, rackData) => {
    try {
      await initSession();
      const response = await api.put(`/Rack/${id}`, { input: rackData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la baie avec l'ID ${id}`, error);
      throw error;
    }
  },

  deleteRack: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Rack/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la baie avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default RackService;
