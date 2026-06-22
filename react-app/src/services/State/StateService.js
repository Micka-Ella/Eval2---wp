import api, { initSession } from '../../config/api';

const StateService = {
  /**
   * Récupérer tous les statuts de matériel
   */
  getAllStates: async () => {
    try {
      await initSession();
      const response = await api.get('/State');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts', error);
      throw error;
    }
  },

  /**
   * Récupérer un statut par son ID
   */
  getStateById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/State/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau statut
   */
  createState: async (stateData) => {
    try {
      await initSession();
      // L'API GLPI s'attend souvent à recevoir un objet de type 'input' pour la création
      const response = await api.post('/State', { input: stateData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du statut', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un statut existant
   */
  updateState: async (id, stateData) => {
    try {
      await initSession();
      const response = await api.put(`/State/${id}`, { input: stateData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un statut
   */
  deleteState: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/State/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du statut avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default StateService;
