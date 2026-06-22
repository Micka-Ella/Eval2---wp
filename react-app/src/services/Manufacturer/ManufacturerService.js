import api, { initSession } from '../../config/api';

const ManufacturerService = {
  /**
   * Récupérer tous les fabricants
   */
  getAllManufacturers: async () => {
    try {
      await initSession();
      const response = await api.get('/Manufacturer');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fabricants', error);
      throw error;
    }
  },

  /**
   * Récupérer un fabricant par son ID
   */
  getManufacturerById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Manufacturer/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du fabricant avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau fabricant
   */
  createManufacturer: async (manufacturerData) => {
    try {
      await initSession();
      const response = await api.post('/Manufacturer', { input: manufacturerData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du fabricant', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un fabricant existant
   */
  updateManufacturer: async (id, manufacturerData) => {
    try {
      await initSession();
      const response = await api.put(`/Manufacturer/${id}`, { input: manufacturerData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du fabricant avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un fabricant
   */
  deleteManufacturer: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Manufacturer/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du fabricant avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default ManufacturerService;
