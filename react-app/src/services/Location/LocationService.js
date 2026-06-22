import api, { initSession } from '../../config/api';

const LocationService = {
  /**
   * Récupérer tous les lieux
   */
  getAllLocations: async () => {
    try {
      await initSession();
      const response = await api.get('/Location');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des lieux', error);
      throw error;
    }
  },

  /**
   * Récupérer un lieu par son ID
   */
  getLocationById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Location/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du lieu avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau lieu
   */
  createLocation: async (locationData) => {
    try {
      await initSession();
      const response = await api.post('/Location', { input: locationData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du lieu', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un lieu existant
   */
  updateLocation: async (id, locationData) => {
    try {
      await initSession();
      const response = await api.put(`/Location/${id}`, { input: locationData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du lieu avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Supprimer un lieu
   */
  deleteLocation: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Location/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du lieu avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default LocationService;
