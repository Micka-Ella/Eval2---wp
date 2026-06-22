// src/hooks/useResetResources.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { RESET_RESOURCES, getAllNames, getDefaultSelected, DEPENDENCIES_UI } from '../config/resetResources';
import ResetService from '../services/ResetService';
import LocalResetService from '../services/LocalResetService';

/**
 * Résout récursivement les dépendances pour l'auto-sélection.
 */
const resolveDeps = (name, visited = new Set()) => {
  if (visited.has(name)) return visited;
  visited.add(name);
  const deps = DEPENDENCIES_UI[name] || [];
  for (const dep of deps) resolveDeps(dep, visited);
  return visited;
};

const useResetResources = () => {
  const [selected, setSelected] = useState(getDefaultSelected);
  const [progress, setProgress] = useState(new Map());
  const [globalStatus, setGlobalStatus] = useState('idle');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const updateProgress = useCallback((name, update) => {
    if (!isMounted.current) return;
    setProgress(prev => {
      const next = new Map(prev);
      next.set(name, { ...(prev.get(name) || {}), ...update });
      return next;
    });
  }, []);

  const toggleResource = useCallback((name) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        const deps = resolveDeps(name);
        for (const dep of deps) next.add(dep);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setSelected(getAllNames()), []);
  const deselectAll = useCallback(() => setSelected(new Set()), []);

  const startReset = useCallback(async () => {
    if (selected.size === 0) return;

    // Trier les ressources pour exécuter les enfants/dépendances avant les parents
    const toReset = RESET_RESOURCES.filter(r => selected.has(r.name));
    const initialProgress = new Map(toReset.map(r => [r.name, { status: 'idle', deleted: 0, total: 0, errors: [] }]));
    setProgress(initialProgress);
    setGlobalStatus('running');

    let hasError = false;
    for (const resource of toReset) {
      if (!isMounted.current) break;
      updateProgress(resource.name, { status: 'running' });
      
      const result = await ResetService.resetResource(
        resource.name,
        resource.endpoint,
        resource.skipIds ?? [],
        (deleted, total) => updateProgress(resource.name, { deleted, total, status: 'running' })
      );
      
      if (isMounted.current) {
        updateProgress(resource.name, {
          status: result.status,
          deleted: result.deleted,
          total: result.total,
          errors: result.errors
        });
        if (result.status === 'error') {
          hasError = true;
        } else if (result.status === 'done' || result.status === 'empty') {
          try {
            await LocalResetService.resetGlpiAutoIncrement([resource.name]);
          } catch (err) {
            console.error(`Impossible de réinitialiser l'auto-increment pour ${resource.name}:`, err);
          }
        }
      }
    }
    if (isMounted.current) setGlobalStatus(hasError ? 'error' : 'done');
  }, [selected, updateProgress]);

  const resetState = useCallback(() => {
    setSelected(getDefaultSelected());
    setProgress(new Map());
    setGlobalStatus('idle');
  }, []);

  const selectedCount = selected.size;
  const getDependenciesForParent = (parentName) => {
    return DEPENDENCIES_UI[parentName] || [];
  };

  return {
    selected,
    progress,
    globalStatus,
    toggleResource,
    selectAll,
    deselectAll,
    startReset,
    resetState,
    selectedCount,
    getDependenciesForParent,
  };
};

export default useResetResources;
