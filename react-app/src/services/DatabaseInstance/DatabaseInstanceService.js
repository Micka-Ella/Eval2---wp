import api, { initSession } from '../../config/api';

const DatabaseInstanceService = {
  getAllDatabaseInstances: async () => {
    try {
      await initSession();
      const response = await api.get('/DatabaseInstance');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des bases de données', error);
      throw error;
    }
  },

  getDatabaseInstanceById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/DatabaseInstance/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la base de données avec l'ID ${id}`, error);
      throw error;
    }
  },

  createDatabaseInstance: async (data) => {
    try {
      await initSession();
      const response = await api.post('/DatabaseInstance', { input: data });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la base de données', error);
      throw error;
    }
  },

  deleteDatabaseInstance: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/DatabaseInstance/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la base de données avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default DatabaseInstanceService;
