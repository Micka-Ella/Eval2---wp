import api, { initSession } from '../config/api';
import { getAllItemTypes } from '../config/itemTypes';

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

const ParcService = {
  // Récupérer uniquement les statistiques globales réelles via l'API GLPI
  getStats: async () => {
    const assets = getAllItemTypes();

    const stats = {
      computers: { total: 0 },
      software: { total: 0 },
      printers: { total: 0 },
      pdus: { total: 0 },
      racks: { total: 0 },
      phones: { total: 0 },
      chassis: { total: 0 },
      network: { total: 0 },
      licenses: { total: 0 },
      monitors: { total: 0 },
      peripherals: { total: 0 },
      passiveEquipment: { total: 0 },
      cartridges: { total: 0 },
      consumables: { total: 0 },
      cables: { total: 0 },
      databaseInstances: { total: 0 },
      dcRooms: { total: 0 },
      tickets: { total: 0, byType: { incident: 0, demande: 0 } }
    };

    try {
      await initSession();

      // Effectuer les appels API en parallèle pour de meilleures performances
      const promises = assets.map(async (asset) => {
        try {
          // range=0-0 pour ne récupérer qu'un élément et avoir le count total dans le header Content-Range
          const response = await api.get(`${asset.endpoint}?range=0-0`);
          
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
          
          return { key: asset.key, total, success: true };
        } catch (e) {
          console.warn(`Erreur lors de la récupération de ${asset.label}:`, e);
          return { key: asset.key, total: 0, success: false };
        }
      });

      // Ajouter la récupération des tickets par statut
      promises.push(
        (async () => {
          try {
            // Récupérer le nombre total de tickets
            const ticketResponse = await api.get('/Ticket?range=0-0');
            let totalTickets = 0;
            const contentRange = ticketResponse.headers['content-range'] || ticketResponse.headers['Content-Range'];
            
            if (contentRange) {
              const parts = contentRange.split('/');
              if (parts.length > 1) {
                totalTickets = parseInt(parts[1], 10);
              }
            } else if (Array.isArray(ticketResponse.data)) {
              totalTickets = ticketResponse.data.length;
            }

            // Définir les cartes tickets GLPI (comme dans l'image)
            const ticketCards = [
              { id: 'ticket', name: 'Ticket', color: '#fcd34d', icon: 'alert' }, // jaune
              { id: 'overdue', name: 'Tickets en retard', color: '#fb923c', icon: 'clock' }, // orange
              { id: 'problem', name: 'Problème', color: '#fca5a5', icon: 'warning' }, // rouge
              { id: 'change', name: 'Changement', color: '#bbf7d0', icon: 'clipboard' }, // vert clair
              { id: 'incoming', name: 'Tickets entrants', color: '#86efac', icon: 'alert' }, // vert
              { id: 'assigned', name: 'Tickets assignés', color: '#bae6fd', icon: 'users' }, // bleu clair
              { id: 'solved', name: 'Tickets résolus', color: '#d1d5db', icon: 'check' }, // gris clair
              { id: 'recurrent', name: 'Tickets récurrents', color: '#f3f4f6', icon: 'clock' }, // gris très clair
              { id: 'waiting', name: 'Tickets en attente', color: '#fed7aa', icon: 'pause' }, // orange clair
              { id: 'planned', name: 'Tickets planifiés', color: '#60a5fa', icon: 'calendar' }, // bleu
              { id: 'closed', name: 'Tickets fermés', color: '#6b7280', icon: 'trash' } // gris foncé
            ];

            // Count tickets by type (Incident = type 1, Demande = type 2)
            let totalIncident = 0;
            let totalDemande = 0;
            try {
              const incidentResponse = await api.get('/Ticket?searchText[type]=1&range=0-0');
              totalIncident = extractCountFromResponse(incidentResponse);
              const demandeResponse = await api.get('/Ticket?searchText[type]=2&range=0-0');
              totalDemande = extractCountFromResponse(demandeResponse);
            } catch (e) {
              console.warn('Erreur lors de la récupération des tickets par type:', e);
            }

            // Pour chaque carte ticket, compter le nombre
            const cards = {};
            for (const card of ticketCards) {
              let count = 0;

              try {
                // Logique pour chaque type de carte
                if (card.id === 'ticket') {
                  count = totalTickets;
                } else if (card.id === 'incoming') {
                  // Nouveaux tickets (status 1)
                  const response = await api.get('/Ticket?searchText[status]=1&range=0-0');
                  count = extractCountFromResponse(response);
                } else if (card.id === 'assigned') {
                  // En cours (Attribué) (status 2)
                  const response = await api.get('/Ticket?searchText[status]=2&range=0-0');
                  count = extractCountFromResponse(response);
                } else if (card.id === 'planned') {
                  // Planifiés (status 3)
                  const response = await api.get('/Ticket?searchText[status]=3&range=0-0');
                  count = extractCountFromResponse(response);
                } else if (card.id === 'waiting') {
                  // En attente (status 4)
                  const response = await api.get('/Ticket?searchText[status]=4&range=0-0');
                  count = extractCountFromResponse(response);
                } else if (card.id === 'solved') {
                  // Résolus (status 5)
                  const response = await api.get('/Ticket?searchText[status]=5&range=0-0');
                  count = extractCountFromResponse(response);
                } else if (card.id === 'closed') {
                  // Fermés (status 6)
                  const response = await api.get('/Ticket?searchText[status]=6&range=0-0');
                  count = extractCountFromResponse(response);
                } else {
                  // Autres cartes (en retard, problème, changement, récurrents)
                  count = 0;
                }
              } catch (e) {
                console.warn(`Erreur lors de la récupération des tickets pour ${card.id}:`, e);
                count = 0;
              }

              cards[card.id] = { ...card, count };
            }

            return { key: 'tickets', data: { total: totalTickets, cards, byType: { incident: totalIncident, demande: totalDemande } }, success: true };
          } catch (e) {
            console.warn('Erreur lors de la récupération des tickets:', e);
            // Retourner les cartes par défaut avec 0
            const defaultCards = [
              { id: 'ticket', name: 'Ticket', color: '#fcd34d', icon: 'alert' },
              { id: 'overdue', name: 'Tickets en retard', color: '#fb923c', icon: 'clock' },
              { id: 'problem', name: 'Problème', color: '#fca5a5', icon: 'warning' },
              { id: 'change', name: 'Changement', color: '#bbf7d0', icon: 'clipboard' },
              { id: 'incoming', name: 'Tickets entrants', color: '#86efac', icon: 'alert' },
              { id: 'assigned', name: 'Tickets assignés', color: '#bae6fd', icon: 'users' },
              { id: 'solved', name: 'Tickets résolus', color: '#d1d5db', icon: 'check' },
              { id: 'recurrent', name: 'Tickets récurrents', color: '#f3f4f6', icon: 'clock' },
              { id: 'waiting', name: 'Tickets en attente', color: '#fed7aa', icon: 'pause' },
              { id: 'planned', name: 'Tickets planifiés', color: '#60a5fa', icon: 'calendar' },
              { id: 'closed', name: 'Tickets fermés', color: '#6b7280', icon: 'trash' }
            ];
            const cards = {};
            for (const c of defaultCards) {
              cards[c.id] = { ...c, count: 0 };
            }
            return { key: 'tickets', data: { total: 0, cards, byType: { incident: 0, demande: 0 } }, success: false };
          }
        })()
      );

      const results = await Promise.all(promises);
      
      results.forEach(res => {
        if (res.key === 'tickets') {
          stats.tickets = res.data;
        } else {
          stats[res.key].total = res.total;
        }
      });

      // Calculer le nombre total d'éléments (exclure les tickets)
      let totalItems = 0;
      Object.entries(stats).forEach(([key, stat]) => {
        if (key !== 'tickets' && key !== 'totalItems' && typeof stat === 'object' && 'total' in stat) {
          totalItems += stat.total;
        }
      });
      stats.totalItems = totalItems;

    } catch (error) {
      console.error("Impossible de récupérer les statistiques depuis l'API GLPI:", error);
      throw error;
    }

    return stats;
  }
};

export default ParcService;
