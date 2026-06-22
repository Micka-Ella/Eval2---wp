import { useEffect, useMemo, useState } from 'react';
import { Edit3, RefreshCw, RotateCcw, X } from 'lucide-react';
import { toast } from 'react-toastify';
import TicketCostService from '../../services/TicketCost/TicketCostService';
import '../../styles/CostOperations.css';

const MODES = {
  1: 'Dernier',
  2: 'Premier',
  3: 'Moyenne',
  4: 'Somme',
};

const formatAmount = (value) => Number(value || 0).toLocaleString('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const formatDate = (value) => {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(normalized));
};

const CostOperations = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ value: '', percentage: '', mode: 1 });

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

  const totals = useMemo(() => operations.reduce((result, operation) => {
    if (operation.is_deleted) return result;
    if (operation.type_cout === 'super_cost') result.superCost += Number(operation.total_cost || 0);
    if (operation.type_cout === 'reopen_cost') result.reopenCost += Number(operation.total_cost || 0);
    return result;
  }, { superCost: 0, reopenCost: 0 }), [operations]);

  const openEditModal = (operation) => {
    setEditing(operation);
    setForm({
      value: String(operation.total_cost ?? ''),
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
      const payload = editing.type_cout === 'super_cost'
        ? {
            value: Number(form.value),
            ticket_id: editing.ticket_id,
            type_cout: 'super_cost',
          }
        : {
            percentage: Number(form.percentage),
            mode: Number(form.mode),
            ticket_id: editing.ticket_id,
            type_cout: 'reopen_cost',
          };

      await TicketCostService.updateCostOperation(editing.operation_key, payload);
      toast.success('Opération modifiée et réouvertures recalculées.');
      setEditing(null);
      await loadOperations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'La modification a échoué.');
    } finally {
      setSaving(false);
    }
  };

  const restoreOperation = async (operation) => {
    try {
      setSaving(true);
      await TicketCostService.setOperationCancellation(operation.operation_key, {
        ticket_id: operation.ticket_id,
        type_cout: operation.type_cout,
        is_cancelled: false,
      });
      toast.success('Opération rétablie et réouvertures recalculées.');
      await loadOperations();
    } catch (error) {
      toast.error(error.response?.data?.error || "Impossible de rétablir l'opération.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container cost-operations-page">
      <div className="cost-operations-header">
        <div>
          <h1>Historique et réouvertures</h1>
          <p>Chaque mouvement est affiché sur une ligne distincte, groupé par batch.</p>
        </div>
        <button className="cost-refresh-button" type="button" onClick={loadOperations} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
          Actualiser
        </button>
      </div>

      <div className="cost-summary-grid">
        <div className="cost-summary-card super">
          <span>Total supercosts actifs</span>
          <strong>{formatAmount(totals.superCost)}</strong>
        </div>
        <div className="cost-summary-card reopen">
          <span>Total réouvertures actives</span>
          <strong>{formatAmount(totals.reopenCost)}</strong>
        </div>
        <div className="cost-summary-card">
          <span>Nombre de mouvements</span>
          <strong>{operations.length}</strong>
        </div>
      </div>

      <div className="cost-operations-card">
        {loading ? (
          <div className="cost-operations-state">Chargement de l'historique…</div>
        ) : operations.length === 0 ? (
          <div className="cost-operations-state">Aucun mouvement enregistré.</div>
        ) : (
          <div className="cost-operations-table-wrap">
            <table className="cost-operations-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ticket</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Base</th>
                  <th>Mode</th>
                  <th>Éléments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {operations.map(operation => (
                  <tr
                    key={`${operation.type_cout}-${operation.ticket_id}-${operation.operation_key}`}
                    className={operation.is_deleted ? 'operation-row-cancelled' : ''}
                  >
                    <td>{formatDate(operation.created_at)}</td>
                    <td><span className="operation-ticket">#{operation.ticket_id}</span></td>
                    <td>
                      <span className={`operation-type ${operation.type_cout}`}>
                        {operation.type_cout === 'super_cost' ? 'Supercoût' : 'Réouverture'}
                      </span>
                    </td>
                    <td className="operation-amount">{formatAmount(operation.total_cost)}</td>
                    <td>
                      {operation.type_cout === 'reopen_cost'
                        ? formatAmount(operation.base_cost)
                        : '—'}
                    </td>
                    <td>
                      {operation.type_cout === 'reopen_cost'
                        ? MODES[operation.mode] || 'Mode inconnu'
                        : '—'}
                    </td>
                    <td>{operation.batch_size}</td>
                    <td className="operation-actions">
                      {operation.is_deleted ? (
                        <button
                          type="button"
                          className="restore"
                          onClick={() => restoreOperation(operation)}
                          disabled={saving}
                        >
                          <RotateCcw size={15} />
                          Rétablir
                        </button>
                      ) : (
                        <button type="button" onClick={() => openEditModal(operation)}>
                          <Edit3 size={15} />
                          Modifier
                        </button>
                      )}
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
                <h2>
                  Modifier {editing.type_cout === 'super_cost' ? 'le supercoût' : 'la réouverture'}
                </h2>
                <p>Ticket #{editing.ticket_id} · {formatDate(editing.created_at)}</p>
              </div>
              <button type="button" className="cost-modal-close" onClick={closeModal} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cost-modal-body">
                {editing.type_cout === 'super_cost' ? (
                  <>
                    <label htmlFor="operation-value">Montant total du supercoût</label>
                    <input
                      id="operation-value"
                      type="number"
                      min="0"
                      step="0.001"
                      required
                      value={form.value}
                      onChange={event => setForm(current => ({ ...current, value: event.target.value }))}
                    />
                  </>
                ) : (
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
                  Les réouvertures suivantes seront recalculées et le plafond du ticket sera réappliqué.
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
