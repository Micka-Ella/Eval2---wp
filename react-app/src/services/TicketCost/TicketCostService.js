import api, { initSession } from '../../config/api';
import axios from 'axios';

const TICKETCOST_API_URL = 'http://localhost:3001/api/ticket-cost';

const TicketCostService = {
  /**
   * Ajouter un coût à un ticket (table glpi_ticketcosts)
   * 
   * @param {number|string} ticketId - L'ID du ticket
   * @param {Object} costData - Les données du coût
   *   - cost_fixed (Fixed_Cost) : Coût fixe
   *   - cost_time (Time_Cost) : Coût lié au temps
   *   - actiontime (Duration_second) : Durée en secondes
   *   - name : Nom/Description du coût
   */
  addCostToTicket: async (ticketId, costData) => {
    try {
      await initSession();
      const response = await api.post('/TicketCost', {
        input: {
          tickets_id: ticketId,
          ...costData
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding cost to ticket:', error);
      throw error;
    }
  },

  /**
   * Récupérer tous les coûts de tous les tickets
   */
  getAllCosts: async () => {
    try {
      await initSession();
      const response = await api.get('/TicketCost', {
        params: {
          range: '0-9999'
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all ticket costs:', error);
      return [];
    }
  },

  /**
   * Récupérer les coûts associés à un ticket
   * Note : searchText fait un match partiel (ticket 1 matche aussi 10, 11, 12...)
   * donc on récupère tout et on filtre côté client par tickets_id exact.
   */
  getTicketCosts: async (ticketId) => {
    try {
      await initSession();
      const response = await api.get('/TicketCost', {
        params: {
          range: '0-9999'
        }
      });
      const allCosts = response.data || [];
      // Filtrer côté client par tickets_id exact
      return allCosts.filter(cost => Number(cost.tickets_id) === Number(ticketId));
    } catch (error) {
      console.error(`Error fetching costs for ticket ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer un coût associé à un ticket
   * 
   * @param {number|string} costId - L'ID du coût à supprimer
   */
  deleteTicketCost: async (costId) => {
    try {
      await initSession();
      const response = await api.delete(`/TicketCost/${costId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ticket cost ${costId}:`, error);
      throw error;
    }
  },

  // --- SUPER COST & REOPEN COST (Express backend) ---
  saveSuperCost: async (ticket_id, super_cost, id_item = null, id_category = null, group_id = null) => {
    try {
      const response = await axios.post(TICKETCOST_API_URL, { ticket_id, super_cost, id_item, id_category, group_id });
      return response.data;
    } catch (error) {
      console.error('Error saving super cost:', error);
      throw error;
    }
  },

  getAllSuperCosts: async () => {
    try {
      const response = await axios.get(TICKETCOST_API_URL);
      return response.data;
    } catch (error) {
      console.error('Error getting all super costs:', error);
      throw error;
    }
  },

  getSuperCost: async (ticket_id) => {
    try {
      const response = await axios.get(`${TICKETCOST_API_URL}/${ticket_id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting super cost:', error);
      throw error;
    }
  },

  deleteSuperCost: async (ticket_id) => {
    const response = await axios.delete(`${TICKETCOST_API_URL}/${ticket_id}`);
    return response.data;
  },

  saveReopenCost: async (ticket_id, percentage, id_item = null, id_category = null, group_id = null) => {
    const response = await axios.post(`${TICKETCOST_API_URL}/reopen`, { ticket_id, percentage, id_item, id_category, group_id });
    return response.data;
  },

  getAllReopenCosts: async () => {
    const response = await axios.get(`${TICKETCOST_API_URL}/reopen/all`);
    return response.data;
  },

  calculateBaseCost: async (ticket_id, mode) => {
    try {
      const response = await axios.get(`${TICKETCOST_API_URL}/calculate-base/${ticket_id}/${mode}`);
      return response.data;
    } catch (error) {
      console.error('Error calculating base cost:', error);
      throw error;
    }
  },

  saveCustomReopenCost: async (
    ticket_id,
    calculated_cost,
    id_item = null,
    id_category = null,
    group_id = null,
    percentage = null,
    mode = null,
    base_cost = null
  ) => {
    try {
      const response = await axios.post(`${TICKETCOST_API_URL}/reopen-custom`, {
        ticket_id,
        calculated_cost,
        id_item,
        id_category,
        group_id,
        percentage,
        mode,
        base_cost
      });
      return response.data;
    } catch (error) {
      console.error('Error saving custom reopen cost:', error);
      throw error;
    }
  },

  getCostOperations: async () => {
    const response = await axios.get(`${TICKETCOST_API_URL}/operations/all`);
    return response.data || [];
  },

  updateCostOperation: async (operationKey, payload) => {
    const response = await axios.put(
      `${TICKETCOST_API_URL}/operations/${encodeURIComponent(operationKey)}`,
      payload
    );
    return response.data;
  }
};

export default TicketCostService;
