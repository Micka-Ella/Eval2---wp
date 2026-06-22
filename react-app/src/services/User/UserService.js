import api, { initSession } from '../../config/api';

const UserService = {
  /**
   * Récupérer tous les utilisateurs
   */
  getAllUsers: async () => {
    try {
      await initSession();
      const response = await api.get('/User');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs', error);
      throw error;
    }
  },

  /**
   * Récupérer un utilisateur par son ID
   */
  getUserById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/User/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Créer un nouvel utilisateur
   */
  createUser: async (userData) => {
    try {
      await initSession();
      const response = await api.post('/User', { input: userData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un utilisateur existant
   */
  updateUser: async (id, userData) => {
    try {
      await initSession();
      const response = await api.put(`/User/${id}`, { input: userData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur avec l'ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Récupérer les liaisons profils-utilisateurs
   */
  getProfileUsers: async () => {
    try {
      await initSession();
      const response = await api.get('/Profile_User', {
        params: { range: '0-9999' }
      });
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des liaisons profils-utilisateurs', error);
      return [];
    }
  },

  /**
   * Supprimer un utilisateur
   */
  deleteUser: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/User/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default UserService;
