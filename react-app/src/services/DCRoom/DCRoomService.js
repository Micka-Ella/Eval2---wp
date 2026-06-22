import api, { initSession } from '../../config/api';

const DCRoomService = {
  getAllDCRooms: async () => {
    try {
      await initSession();
      const response = await api.get('/DCRoom');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des salles serveur', error);
      throw error;
    }
  },

  getDCRoomById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/DCRoom/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la salle serveur avec l'ID ${id}`, error);
      throw error;
    }
  },

  createDCRoom: async (data) => {
    try {
      await initSession();
      const response = await api.post('/DCRoom', { input: data });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la salle serveur', error);
      throw error;
    }
  },

  deleteDCRoom: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/DCRoom/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la salle serveur avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default DCRoomService;
