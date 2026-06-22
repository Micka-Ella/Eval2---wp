import api, { initSession } from '../../config/api';

const TicketTaskService = {
  /**
   * Ajouter une tâche spécifique à un ticket (table glpi_tickettasks)
   * 
   * @param {number|string} ticketId - L'ID du ticket
   * @param {Object} taskData - Les données de la tâche
   *   - content : Description des actions menées
   *   - actiontime : Durée de l'intervention en secondes
   *   - state : Statut de la tâche (ex: 1 = A faire, 2 = Fait)
   *   - users_id_tech : ID du technicien (optionnel)
   */
  addTaskToTicket: async (ticketId, taskData) => {
    try {
      await initSession();
      const response = await api.post('/TicketTask', {
        input: {
          tickets_id: ticketId,
          ...taskData
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding task to ticket:', error);
      throw error;
    }
  },

  /**
   * Récupérer les tâches associées à un ticket
   */
  getTicketTasks: async (ticketId) => {
    try {
      await initSession();
      const response = await api.get('/TicketTask', {
        params: {
          'searchText[tickets_id]': ticketId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching tasks for ticket ${ticketId}:`, error);
      throw error;
    }
  }
};

export default TicketTaskService;
