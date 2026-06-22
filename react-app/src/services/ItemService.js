// Service connectant l'application React à l'API GLPI
import api, { initSession } from '../config/api';

const ItemService = {

  // Récupérer tous les éléments (READ - Exemple pour les Tickets)
  getAll: async () => {
    try {
      await initSession();
      
      // L'URL de base et les headers (dont le Session-Token) sont gérés par notre instance 'api'
      const response = await api.get('/Ticket?expand_dropdowns=true');
      
      // Axios met directement la réponse JSON dans response.data
      return response.data.map(ticket => ({
        id: ticket.id,
        nom: ticket.name, // Le titre du ticket
        categorie: ticket.itilcategories_id || 'Aucune' 
      }));
    } catch (error) {
      console.error("Erreur getAll:", error);
      return [];
    }
  },

  // Créer un nouvel élément (CREATE - Exemple pour un Ticket)
  create: async (item) => {
    try {
      await initSession();
      const response = await api.post('/Ticket', {
        input: {
          name: item.nom,
          content: "Ticket créé depuis l'application React",
        }
      });
      
      return { ...item, id: response.data.id }; 
    } catch (error) {
      console.error("Erreur create:", error);
      throw error;
    }
  },

  // Mettre à jour un élément (UPDATE)
  update: async (id, updatedItem) => {
    try {
      await initSession();
      await api.put(`/Ticket/${id}`, {
        input: {
          id: id,
          name: updatedItem.nom
        }
      });
      
      return updatedItem;
    } catch (error) {
      console.error("Erreur update:", error);
      throw error;
    }
  },

  // Supprimer un élément (DELETE)
  delete: async (id) => {
    try {
      await initSession();
      await api.delete(`/Ticket/${id}`);
      return id;
    } catch (error) {
      console.error("Erreur delete:", error);
      throw error;
    }
  }
};

export default ItemService;