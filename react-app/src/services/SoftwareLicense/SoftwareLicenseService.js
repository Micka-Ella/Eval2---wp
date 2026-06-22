import api, { initSession } from '../../config/api';

const SoftwareLicenseService = {
  getAllSoftwareLicenses: async () => {
    try {
      await initSession();
      const response = await api.get('/SoftwareLicense');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des licences', error);
      throw error;
    }
  },

  getSoftwareLicenseById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/SoftwareLicense/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la licence avec l'ID ${id}`, error);
      throw error;
    }
  },

  createSoftwareLicense: async (licenseData) => {
    try {
      await initSession();
      const response = await api.post('/SoftwareLicense', { input: licenseData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la licence', error);
      throw error;
    }
  },

  updateSoftwareLicense: async (id, licenseData) => {
    try {
      await initSession();
      const response = await api.put(`/SoftwareLicense/${id}`, { input: licenseData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la licence avec l'ID ${id}`, error);
      throw error;
    }
  },

  deleteSoftwareLicense: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/SoftwareLicense/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la licence avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default SoftwareLicenseService;
