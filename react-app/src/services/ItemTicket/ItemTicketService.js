import api, { initSession } from '../../config/api';

const ItemTicketService = {
  // Création du lien entre le ticket et un équipement (table glpi_items_tickets)
  linkItemToTicket: async (ticketId, itemId, itemType = 'Computer') => {
    console.log('linkItemToTicket called with:', { ticketId, itemId, itemType });
    try {
      await initSession();
      const dataToSend = {
        input: {
          tickets_id: ticketId,
          items_id: itemId,
          itemtype: itemType
        }
      };
      console.log('Sending to API:', dataToSend);
      const response = await api.post('/Item_Ticket', dataToSend);
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error linking item to ticket:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      throw error;
    }
  },

  // Récupérer tous les liens Item_Ticket
  getAllItemTickets: async () => {
    try {
      await initSession();
      const response = await api.get(`/Item_Ticket`, {
        params: {
          expand: ['item', 'item.State', 'item.Location'],
          range: '0-9999'
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all Item_Ticket links:', error);
      return [];
    }
  },

  // Récupérer tous les items liés à un ticket
  getItemsForTicket: async (ticketId) => {
    try {
      await initSession();
      const response = await api.get(`/Item_Ticket`, {
        params: {
          expand: ['item', 'item.State', 'item.Location'], // Expand more related data
          range: '0-9999' // Get all entries
        }
      });
      // Manually filter the results for the specific ticket ID
      const filteredItems = response.data.filter(item => 
        Number(item.tickets_id) === Number(ticketId)
      );
      console.log('getItemsForTicket found:', filteredItems.length, 'items for ticket', ticketId);
      return filteredItems;
    } catch (error) {
      console.error('Error fetching items for ticket:', error);
      return [];
    }
  },

  // Supprimer le lien (désassocier un équipement du ticket)
  unlinkItemFromTicket: async (linkId) => {
    console.log('unlinkItemFromTicket called with:', linkId);
    try {
      await initSession();
      const response = await api.delete(`/Item_Ticket/${linkId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Item_Ticket link ${linkId}:`, error);
      throw error;
    }
  }
};

export default ItemTicketService;
