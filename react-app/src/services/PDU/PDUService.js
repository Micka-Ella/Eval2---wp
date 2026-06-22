import api, { initSession } from '../../config/api';

const PDUService = {
  getAllPDUs: async () => {
    try {
      await initSession();
      const response = await api.get('/Pdu');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des PDUs', error);
      throw error;
    }
  },

  getPDUById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Pdu/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du PDU avec l'ID ${id}`, error);
      throw error;
    }
  },

  createPDU: async (pduData) => {
    try {
      await initSession();
      const response = await api.post('/Pdu', { input: pduData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du PDU', error);
      throw error;
    }
  },

  updatePDU: async (id, pduData) => {
    try {
      await initSession();
      const response = await api.put(`/Pdu/${id}`, { input: pduData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du PDU avec l'ID ${id}`, error);
      throw error;
    }
  },

  deletePDU: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Pdu/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du PDU avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default PDUService;
