import api, { initSession } from '../../config/api';

const ComputerModelService = {
  /**
   * Récupérer tous les modèles d'équipements
   */
  getAllComputerModels: async () => {
    try {
      await initSession();
      const response = await api.get('/ComputerModel');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles', error);
      throw error;
    }
  },

  /**
   * Récupérer un modèle par son ID
   */
  getComputerModelById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/ComputerModel/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du modèle avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau modèle
   */
  createComputerModel: async (modelData) => {
    try {
      await initSession();
      const response = await api.post('/ComputerModel', { input: modelData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du modèle', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un modèle existant
   */
  updateComputerModel: async (id, modelData) => {
    try {
      await initSession();
      const response = await api.put(`/ComputerModel/${id}`, { input: modelData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du modèle avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un modèle
   */
  deleteComputerModel: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/ComputerModel/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du modèle avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default ComputerModelService;
