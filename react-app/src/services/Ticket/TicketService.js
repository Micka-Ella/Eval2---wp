import api, { initSession } from '../../config/api';
import ItemTicketService from '../ItemTicket/ItemTicketService';

const GLPI_DATE_FIELDS = new Set([
  'date',
  'date_creation',
  'date_mod',
  'solvedate',
  'closedate',
  'begin_date',
  'end_date',
]);

const padDatePart = (value) => String(value).padStart(2, '0');

export const formatDateForGlpi = (value) => {
  if (value === null || value === undefined || value === '') return value;

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) return text;

  const date = value instanceof Date ? value : new Date(text);
  if (Number.isNaN(date.getTime())) return value;

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-') + ' ' + [
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join(':');
};

const normalizeTicketDates = (ticketData) => Object.fromEntries(
  Object.entries(ticketData).map(([key, value]) => [
    key,
    GLPI_DATE_FIELDS.has(key) ? formatDateForGlpi(value) : value,
  ])
);

// Helper to extract count from Content-Range header
const extractCountFromResponse = (response) => {
  let total = 0;
  const contentRange = response.headers['content-range'] || response.headers['Content-Range'];
  if (contentRange) {
    const parts = contentRange.split('/');
    if (parts.length > 1) {
      total = parseInt(parts[1], 10);
    }
  } else if (Array.isArray(response.data)) {
    total = response.data.length;
  }
  return total;
};

const TicketService = {
  getTickets: async (params = {}) => {
    try {
      await initSession();
      const defaultParams = {
        range: '0-99', // Fetch more tickets to filter client-side
      };

      const searchParams = new URLSearchParams();

      // Add range (for pagination)
      if (params.start !== undefined && params.limit !== undefined) {
        searchParams.append('range', `${params.start}-${params.start + params.limit - 1}`);
      } else {
        searchParams.append('range', defaultParams.range);
      }

      // Add status filter (if present, it might work without causing 400)
      if (params.status) {
        searchParams.append('searchText[status]', params.status);
      }

      const queryString = searchParams.toString();
      const url = `/Ticket${queryString ? `?${queryString}` : ''}`;
      console.log('Calling API:', url);
      const response = await api.get(url);

      // Get total items from Content-Range header
      const totalItems = extractCountFromResponse(response);

      return {
        tickets: response.data,
        totalItems,
      };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return { tickets: [], totalItems: 0 };
    }
  },

  getTicket: async (id) => {
    try {
      await initSession();
      const response = await api.get(`/Ticket/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ticket ${id}:`, error);
      throw error;
    }
  },

  getTicketUsers: async () => {
    try {
      await initSession();
      const response = await api.get('/Ticket_User', {
        params: {
          range: '0-9999'
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching Ticket_User relations:', error);
      return [];
    }
  },

  assignUserToTicket: async (ticketId, userId) => {
    try {
      await initSession();
      const response = await api.post('/Ticket_User', {
        input: {
          tickets_id: Number(ticketId),
          users_id: Number(userId),
          type: 2 // ASSIGN
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning user to ticket:', error);
      throw error;
    }
  },

  removeUserFromTicket: async (relationId) => {
    try {
      await initSession();
      const response = await api.delete(`/Ticket_User/${relationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Ticket_User relation ${relationId}:`, error);
      throw error;
    }
  },

  // Création d'un ticket (table glpi_tickets)
  createTicket: async (ticketData) => {
    try {
      await initSession();
      // ticketData peut contenir : name (Titre), content (Description), date, type, status, priority, etc.
      const response = await api.post('/Ticket', { input: normalizeTicketDates(ticketData) });
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Mise à jour d'un ticket (PUT /Ticket/:id)
  updateTicket: async (id, ticketData) => {
    try {
      await initSession();
      const response = await api.put(`/Ticket/${id}`, { input: normalizeTicketDates(ticketData) });
      return response.data;
    } catch (error) {
      console.error(`Error updating ticket ${id}:`, error);
      throw error;
    }
  },

  // Méthode combinée : Crée un ticket puis le lie directement à un PC
  createTicketForComputer: async (ticketData, computerId) => {
    try {
      // 1. Création du ticket
      const ticketResponse = await TicketService.createTicket(ticketData);
      const newTicketId = ticketResponse.id;

      // 2. Si le ticket est créé avec succès et qu'on a un PC, on les lie
      if (newTicketId && computerId) {
        await ItemTicketService.linkItemToTicket(newTicketId, computerId, 'Computer');
      }

      return ticketResponse;
    } catch (error) {
      console.error('Error in createTicketForComputer:', error);
      throw error;
    }
  },

  getTicketsByStatus: async (statusId) => {
    try {
      await initSession();
      const searchParams = new URLSearchParams();
      searchParams.append('range', '0-99');
      searchParams.append('searchText[status]', statusId);
      
      const response = await api.get(`/Ticket?${searchParams.toString()}`);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching tickets for status ${statusId}:`, error);
      return [];
    }
  },

  countTicketsByStatus: (ticketsList, statusId) => {
    if (!Array.isArray(ticketsList)) return 0;
    return ticketsList.filter(t => Number(t.status) === statusId).length;
  }
};

export default TicketService;
