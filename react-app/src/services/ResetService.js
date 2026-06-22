// src/services/ResetService.js
import api, { initSession } from '../config/api';

const ResetService = {
  /**
   * Récupère tous les IDs d'une ressource GLPI.
   */
  getAllIds: async (endpoint, skipIds = []) => {
    try {
      // range=0-1000 pour récupérer la liste des éléments existants
      const response = await api.get(`${endpoint}?range=0-1000`);
      
      let items = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      }
      
      const ids = items
        .map(item => item.id)
        .filter(id => id !== undefined && id !== null && !skipIds.includes(id));

      return ids;
    } catch (err) {
      const status = err?.response?.status;
      // Si la ressource est vide ou n'existe pas, on retourne un tableau vide
      if (status === 400 || status === 404 || status === 204) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Supprime définitivement une entité GLPI (purger) par son ID.
   */
  deleteOne: async (endpoint, id) => {
    try {
      // force_purge=true supprime définitivement l'objet de la base de données (sans passer par la corbeille)
      await api.delete(`${endpoint}/${id}`, {
        params: {
          force_purge: true
        }
      });
      return { id, success: true };
    } catch (err) {
      const status = err?.response?.status;
      let errorMsg = `HTTP ${status ?? 'réseau'}`;
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (Array.isArray(err.response.data)) {
          errorMsg = err.response.data.join(', ');
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }
      return { id, success: false, error: errorMsg };
    }
  },

  /**
   * Supprime un lot d'entités en parallèle.
   */
  deleteAll: async (endpoint, ids) => {
    if (!ids || ids.length === 0) return { deleted: 0, errors: [] };
    const PARALLEL = 3; // requêtes simultanées légères pour le serveur local
    let deleted = 0;
    const errors = [];

    for (let i = 0; i < ids.length; i += PARALLEL) {
      const batch = ids.slice(i, i + PARALLEL);
      const results = await Promise.allSettled(
        batch.map(id => ResetService.deleteOne(endpoint, id))
      );
      
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success) {
          deleted++;
        } else if (r.status === 'fulfilled' && !r.value.success) {
          errors.push(r.value);
        }
      }
      
      if (i + PARALLEL < ids.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    return { deleted, errors };
  },

  /**
   * Réinitialise complètement une ressource GLPI donnée.
   */
  resetResource: async (resourceName, endpoint, skipIds = [], onProgress = null) => {
    try {
      await initSession();
      const ids = await ResetService.getAllIds(endpoint, skipIds);
      
      if (ids.length === 0) {
        return { resource: resourceName, total: 0, deleted: 0, errors: [], status: 'empty' };
      }

      if (onProgress) onProgress(0, ids.length);

      // Traitement par lots (Batch) de 10 éléments
      const BATCH_SIZE = 10;
      let totalDeleted = 0;
      let allErrors = [];

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const { deleted, errors } = await ResetService.deleteAll(endpoint, batch);
        totalDeleted += deleted;
        allErrors = [...allErrors, ...errors];
        
        if (onProgress) onProgress(totalDeleted, ids.length);
        if (i + BATCH_SIZE < ids.length) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      return {
        resource: resourceName,
        total: ids.length,
        deleted: totalDeleted,
        errors: allErrors,
        status: allErrors.length === 0 ? 'done' : 'partial'
      };

    } catch (err) {
      const status = err?.response?.status;
      return {
        resource: resourceName,
        total: 0,
        deleted: 0,
        errors: [{ error: `HTTP ${status ?? err.message}` }],
        status: status === 403 ? 'forbidden' : 'error'
      };
    }
  }
};

export default ResetService;
