import api, { initSession } from '../../config/api';

const ComputerService = {
  /**
   * Récupérer tous les ordinateurs
   */
  getAllComputers: async () => {
    try {
      await initSession();
      // Expand related objects to get their names
      const response = await api.get('/Computer', {
        params: {
          expand: 'State,Manufacturer,ComputerType,ComputerModel,OperatingSystem,Location',
          withindexes: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des ordinateurs', error);
      throw error;
    }
  },

  /**
   * Récupérer un ordinateur par son ID
   */
  getComputerById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Computer/${id}`, {
        params: {
          expand: 'State,Manufacturer,ComputerType,ComputerModel,OperatingSystem,Location',
          withindexes: true
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'ordinateur avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouvel ordinateur
   * @param {Object} computerData - Les données de l'ordinateur.
   * Exemple de structure attendue :
   * {
   *   name: "PC-ADM-001",
   *   otherserial: "ITU-2026-0001", // Inventory_Number
   *   states_id: 1, // ID du statut
   *   locations_id: 2, // ID de la localisation
   *   manufacturers_id: 3, // ID du fabricant
   *   computermodels_id: 4, // ID du modèle
   *   users_id: 5 // ID de l'utilisateur
   * }
   */
  createComputer: async (computerData) => {
    try {
      await initSession();
      const response = await api.post('/Computer', { input: computerData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'ordinateur', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un ordinateur existant
   */
  updateComputer: async (id, computerData) => {
    try {
      await initSession();
      const response = await api.put(`/Computer/${id}`, { input: computerData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'ordinateur avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un ordinateur
   */
  deleteComputer: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Computer/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'ordinateur avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default ComputerService;
