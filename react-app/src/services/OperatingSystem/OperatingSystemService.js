import api, { initSession } from '../../config/api';

const OperatingSystemService = {
  /**
   * Récupérer tous les systèmes d'exploitation
   */
  getAllOperatingSystems: async () => {
    try {
      await initSession();
      const response = await api.get('/OperatingSystem');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des systèmes d\'exploitation', error);
      throw error;
    }
  },

  /**
   * Récupérer un système d'exploitation par son ID
   */
  getOperatingSystemById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/OperatingSystem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du système d'exploitation avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau système d'exploitation
   */
  createOperatingSystem: async (osData) => {
    try {
      await initSession();
      const response = await api.post('/OperatingSystem', { input: osData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du système d\'exploitation', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un système d'exploitation existant
   */
  updateOperatingSystem: async (id, osData) => {
    try {
      await initSession();
      const response = await api.put(`/OperatingSystem/${id}`, { input: osData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du système d'exploitation avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un système d'exploitation
   */
  deleteOperatingSystem: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/OperatingSystem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du système d'exploitation avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default OperatingSystemService;
