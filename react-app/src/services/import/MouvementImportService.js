import TicketService from '../Ticket/TicketService';
import ItemTicketService from '../ItemTicket/ItemTicketService';
import TicketCostService from '../TicketCost/TicketCostService';

const normalizeInteger = (value) => {
  const parsed = parseInt(String(value || '').trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const MouvementImportService = {
  processReopen: async (ticketId, row) => {
    const percentage = parseFloat(String(row.reopenPercentage || '').replace(',', '.'));
    const mode = normalizeInteger(row.reopenMode) || 1;

    if (Number.isNaN(percentage)) {
      throw new Error('Le pourcentage de réouverture est invalide.');
    }

    const linkedItems = await ItemTicketService.getItemsForTicket(ticketId).catch(() => []);

    let baseCost;
    try {
      const response = await TicketCostService.calculateBaseCost(ticketId, mode);
      baseCost = response.base_cost || 0;
    } catch (error) {
      throw new Error(`Impossible de calculer le coût de base : ${error.message}`, { cause: error });
    }

    const calculatedCost = baseCost * (percentage / 100);
    const groupId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (linkedItems && linkedItems.length > 0) {
      const dividedCost = calculatedCost / linkedItems.length;
      for (const item of linkedItems) {
        await TicketCostService.saveCustomReopenCost(
          ticketId, dividedCost, item.items_id, item.itemtype, groupId, percentage, mode, baseCost
        );
      }
    } else {
      await TicketCostService.saveCustomReopenCost(
        ticketId, calculatedCost, null, null, groupId, percentage, mode, baseCost
      );
    }

    await TicketService.updateTicket(ticketId, { status: 2 });

    return {
      message: `Réouverture appliquée avec un coût de ${calculatedCost.toFixed(2)} (base ${baseCost.toFixed(2)}).`,
      amount: calculatedCost,
    };
  },

  processClose: async (ticketId, row) => {
    const closeValue = row.closeValue === '' ? null : parseFloat(String(row.closeValue).replace(',', '.'));
    const linkedItems = await ItemTicketService.getItemsForTicket(ticketId).catch(() => []);
    const groupId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const currentTicket = await TicketService.getTicket(ticketId).catch(() => null);
    const currentContent = currentTicket?.content || '';
    const formattedDate = new Date().toLocaleDateString('fr-FR');
    const closingNote = `\n\n[Terminaison par import mouvement - Date : ${formattedDate}]`;

    await TicketService.updateTicket(ticketId, {
      status: 6,
      solvedate: new Date().toISOString(),
      closedate: new Date().toISOString(),
      content: currentContent + closingNote,
    });

    if (closeValue !== null && !Number.isNaN(closeValue) && closeValue >= 0) {
      if (linkedItems && linkedItems.length > 0) {
        const dividedCost = closeValue / linkedItems.length;
        for (const item of linkedItems) {
          await TicketCostService.saveSuperCost(ticketId, dividedCost, item.items_id, item.itemtype, groupId);
        }
      } else {
        await TicketCostService.saveSuperCost(ticketId, closeValue, null, null, groupId);
      }
    }

    return {
      message: 'Ticket clôturé avec succès.',
      amount: closeValue,
    };
  },

  processCancel: async (ticketId) => {
    try {
      await TicketCostService.deleteSuperCost(ticketId);
    } catch (error) {
      console.warn('Impossible de supprimer le dernier super cost', error);
    }

    const currentTicket = await TicketService.getTicket(ticketId).catch(() => null);
    const currentContent = currentTicket?.content || '';
    const formattedDate = new Date().toLocaleDateString('fr-FR');
    const cancelNote = `\n\n[Annulation par import mouvement - Date : ${formattedDate}]`;

    await TicketService.updateTicket(ticketId, {
      status: 1,
      content: currentContent + cancelNote,
    });

    return {
      message: 'Annulation appliquée, ticket remis au statut Nouveau.',
    };
  },

  processMovement: async (ticketId, payload) => {
    if (payload.movement === 'reopen') {
      return await MouvementImportService.processReopen(ticketId, payload);
    } else if (payload.movement === 'close') {
      return await MouvementImportService.processClose(ticketId, payload);
    } else if (payload.movement === 'cancel') {
      return await MouvementImportService.processCancel(ticketId);
    } else {
      throw new Error(`Mouvement inconnu : ${payload.movement}`);
    }
  }
};

export default MouvementImportService;
