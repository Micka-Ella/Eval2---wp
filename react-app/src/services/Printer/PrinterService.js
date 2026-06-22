import api, { initSession } from '../../config/api';

const PrinterService = {
  getAllPrinters: async () => {
    try {
      await initSession();
      const response = await api.get('/Printer');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des imprimantes', error);
      throw error;
    }
  },

  getPrinterById: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Printer/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'imprimante avec l'ID ${id}`, error);
      throw error;
    }
  },

  createPrinter: async (printerData) => {
    try {
      await initSession();
      const response = await api.post('/Printer', { input: printerData });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'imprimante', error);
      throw error;
    }
  },

  updatePrinter: async (id, printerData) => {
    try {
      await initSession();
      const response = await api.put(`/Printer/${id}`, { input: printerData });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'imprimante avec l'ID ${id}`, error);
      throw error;
    }
  },

  deletePrinter: async (id) => {
    try {
      await initSession();
      const response = await api.delete(`/Printer/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'imprimante avec l'ID ${id}`, error);
      throw error;
    }
  }
};

export default PrinterService;
