import { useEffect, useMemo, useState } from 'react';
import { Edit3, RefreshCw, X } from 'lucide-react';
import { toast } from 'react-toastify';
import TicketCostService from '../../services/TicketCost/TicketCostService';
import '../../styles/CostOperations.css';

const MODES = {
  1: 'Dernier coût',
  2: 'Premier coût',
  3: 'Moyenne des coûts',
  4: 'Somme des coûts',
};

const formatAmount = (value) => Number(value || 0).toLocaleString('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const formatDate = (value) => {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(normalized));
};

const CostOperations = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ superCost: '', percentage: '', mode: 1 });

  const loadOperations = async () => {
    try {
      setLoading(true);
      setOperations(await TicketCostService.getCostOperations());
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible de charger les coûts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    loadOperations();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const totals = useMemo(() => {
    const superCosts = new Map();
    const reopenCosts = new Map();

    operations.forEach(operation => {
      if (operation.super_operation_key) {
        superCosts.set(operation.super_operation_key, Number(operation.super_cost || 0));
      }
      if (operation.reopen_operation_key) {
        reopenCosts.set(operation.reopen_operation_key, Number(operation.reopen_cost || 0));
      }
    });

    return {
      superCost: [...superCosts.values()].reduce((sum, value) => sum + value, 0),
      reopenCost: [...reopenCosts.values()].reduce((sum, value) => sum + value, 0),
    };
  }, [operations]);

  const openEditModal = (operation) => {
    setEditing(operation);
    setForm({
      superCost: String(operation.super_cost ?? ''),
      percentage: String(operation.percentage ?? ''),
      mode: Number(operation.mode || 1),
    });
  };

  const closeModal = () => {
    if (!saving) setEditing(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editing) return;

    try {
      setSaving(true);
      const superCostChanged = editing.super_operation_key
        && Number(form.superCost) !== Number(editing.super_cost);
      const reopenChanged = editing.reopen_operation_key
        && (
          Number(form.percentage) !== Number(editing.percentage)
          || Number(form.mode) !== Number(editing.mode)
        );

      if (superCostChanged) {
        await TicketCostService.updateCostOperation(editing.super_operation_key, {
          value: Number(form.superCost),
          ticket_id: editing.ticket_id,
          type_cout: 'super_cost',
        });
      }

      if (reopenChanged) {
        await TicketCostService.updateCostOperation(editing.reopen_operation_key, {
          percentage: Number(form.percentage),
          mode: Number(form.mode),
          ticket_id: editing.ticket_id,
          type_cout: 'reopen_cost',
        });
      }

      toast.success('Historique mis à jour et réouvertures recalculées.');
      setEditing(null);
      await loadOperations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'La modification a échoué.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container cost-operations-page">
      <div className="cost-operations-header">
        <div>
          <h1>Historique et réouvertures</h1>
          <p>Chaque ligne associe un supercost à la réouverture suivante du même ticket.</p>
        </div>
        <button className="cost-refresh-button" type="button" onClick={loadOperations} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
          Actualiser
        </button>
      </div>

      <div className="cost-summary-grid">
        <div className="cost-summary-card super">
          <span>Total supercosts</span>
          <strong>{formatAmount(totals.superCost)}</strong>
        </div>
        <div className="cost-summary-card reopen">
          <span>Total réouvertures</span>
          <strong>{formatAmount(totals.reopenCost)}</strong>
        </div>
        <div className="cost-summary-card">
          <span>Nombre de lignes</span>
          <strong>{operations.length}</strong>
        </div>
      </div>

      <div className="cost-operations-card">
        {loading ? (
          <div className="cost-operations-state">Chargement de l'historique…</div>
        ) : operations.length === 0 ? (
          <div className="cost-operations-state">Aucun historique enregistré.</div>
        ) : (
          <div className="cost-operations-table-wrap">
            <table className="cost-operations-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ticket ID</th>
                  <th>Coût original</th>
                  <th>% Réouverture</th>
                  <th>Coût réouverture</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operations.map(operation => (
                  <tr key={operation.history_key}>
                    <td>{formatDate(operation.created_at)}</td>
                    <td><strong>#{operation.ticket_id}</strong></td>
                    <td className="operation-amount">
                      {operation.super_cost === null ? '—' : formatAmount(operation.super_cost)}
                    </td>
                    <td>{operation.reopen_operation_key ? formatAmount(operation.percentage) : '—'}</td>
                    <td className="operation-amount">
                      {operation.reopen_operation_key ? formatAmount(operation.reopen_cost) : '—'}
                    </td>
                    <td>
                      {operation.reopen_operation_key
                        ? `Mode ${operation.mode} (${MODES[operation.mode] || 'Mode inconnu'})`
                        : '—'}
                    </td>
                    <td className="operation-actions">
                      <button type="button" onClick={() => openEditModal(operation)}>
                        <Edit3 size={15} />
                        Mettre à jour & recalculer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="cost-modal-overlay" onMouseDown={closeModal}>
          <div className="cost-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="cost-modal-header">
              <div>
                <h2>Mettre à jour et recalculer</h2>
                <p>Ticket #{editing.ticket_id} · {formatDate(editing.created_at)}</p>
              </div>
              <button type="button" className="cost-modal-close" onClick={closeModal} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cost-modal-body">
                {editing.super_operation_key && (
                  <>
                    <label htmlFor="operation-value">Coût original</label>
                    <input
                      id="operation-value"
                      type="number"
                      min="0"
                      step="0.001"
                      required
                      value={form.superCost}
                      onChange={event => setForm(current => ({ ...current, superCost: event.target.value }))}
                    />
                  </>
                )}

                {editing.reopen_operation_key && (
                  <>
                    <label htmlFor="operation-percentage">% Réouverture</label>
                    <input
                      id="operation-percentage"
                      type="number"
                      min="0"
                      step="0.001"
                      required
                      value={form.percentage}
                      onChange={event => setForm(current => ({ ...current, percentage: event.target.value }))}
                    />

                    <label htmlFor="operation-mode">Mode</label>
                    <select
                      id="operation-mode"
                      value={form.mode}
                      onChange={event => setForm(current => ({ ...current, mode: Number(event.target.value) }))}
                    >
                      {Object.entries(MODES).map(([value, label]) => (
                        <option key={value} value={value}>Mode {value} ({label})</option>
                      ))}
                    </select>
                  </>
                )}

                <div className="cost-modal-notice">
                  Les réouvertures concernées seront recalculées dans leur ordre chronologique et toutes les lignes de chaque batch seront synchronisées.
                </div>
              </div>

              <div className="cost-modal-footer">
                <button type="button" className="secondary" onClick={closeModal} disabled={saving}>
                  Annuler
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? 'Recalcul en cours…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostOperations;
