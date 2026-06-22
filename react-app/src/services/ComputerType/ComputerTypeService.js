import api, { initSession } from '../../config/api';

const ComputerTypeService = {
  /**
   * Récupérer tous les types d'ordinateurs
   */
  getAllComputerTypes: async () => {
    try {
      await initSession();
      const response = await api.get('/ComputerType');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types d\'ordinateurs', error);
      throw error;
    }
  },

  /**
   * Récupérer un type d'ordinateur par son ID
   */
  getComputerTypeById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/ComputerType/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du type d'ordinateur avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau type d'ordinateur
   */
  createComputerType: async (typeData) => {
    try {
      await initSession();
      const response = await api.post('/ComputerType', { input: typeData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du type d\'ordinateur', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un type d'ordinateur existant
   */
  updateComputerType: async (id, typeData) => {
    try {
      await initSession();
      const response = await api.put(`/ComputerType/${id}`, { input: typeData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du type d'ordinateur avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un type d'ordinateur
   */
  deleteComputerType: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/ComputerType/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du type d'ordinateur avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default ComputerTypeService;
