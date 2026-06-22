import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Plus, Trash2, Terminal, Upload, Image as ImageIcon } from 'lucide-react';
import ImportValidationService from '../../../services/import/ImportValidationService';
import MouvementImportService from '../../../services/import/MouvementImportService';
import '../../../styles/Import.css';

const MOVEMENT_OPTIONS = [
  { value: 'reopen', label: 'Réouverture' },
  { value: 'close', label: 'Terminaison' },
  { value: 'cancel', label: 'Annulation' },
];

const REOPEN_MODES = [
  { value: '1', label: 'Mode 1 - Dernier super cost' },
  { value: '2', label: 'Mode 2 - Premier super cost' },
  { value: '3', label: 'Mode 3 - Moyenne des supercosts' },
  { value: '4', label: 'Mode 4 - Somme des supercosts' },
];

const createRow = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  ticketId: '',
  movement: 'reopen',
  reopenPercentage: '100',
  reopenMode: '1',
  closeValue: '',
});

const parseMovementLine = (line) => {
  const separator = line.includes(';') ? ';' : ',';
  return line.split(separator).map((part) => part.trim());
};

const RowInput = ({ label, children }) => (
  <label className="import-row-field">
    <span className="import-row-field__label">{label}</span>
    {children}
  </label>
);

const MouvementImportPage = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvRowCount, setCsvRowCount] = useState(0);
  const [rows, setRows] = useState([createRow()]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, errors: 0, details: [] });
  const [messages, setMessages] = useState([]);

  const addMessage = (msg, type = 'info') => {
    setMessages((prev) => [...prev, { msg, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const movementCount = useMemo(() => rows.length, [rows.length]);

  const buildMovementPayload = (row) => ({
    ticketId: String(row.ticketId || '').trim(),
    movement: String(row.movement || '').trim().toLowerCase(),
    reopenPercentage: String(row.reopenPercentage || '').trim(),
    reopenMode: String(row.reopenMode || '').trim(),
    closeValue: String(row.closeValue || '').trim(),
  });

  const validateMovementPayload = (payload, lineNumber) => {
    const normalizedMovement = ImportValidationService.normalizeMovement(payload.movement);
    const validationRow = [
      payload.ticketId,
      normalizedMovement,
      normalizedMovement === 'reopen' ? payload.reopenPercentage : payload.closeValue,
      payload.reopenMode,
    ];

    return ImportValidationService.validateMovementRow(validationRow, lineNumber);
  };

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId)));
  };

  const handleCsvChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setCsvFile(selectedFile);
    setCsvPreviewRows([]);
    setCsvRowCount(0);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = String(loadEvent.target.result || '');
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
      
      const previewData = [];
      for (const line of lines) {
        const parts = parseMovementLine(line);
        if ((parts[0] || '').toLowerCase().includes('ticket')) {
          continue; // skip header
        }
        if (parts.length >= 2) {
          previewData.push(parts);
        }
      }
      
      setCsvPreviewRows(previewData);
      setCsvRowCount(previewData.length);
      addMessage(`CSV chargé : ${selectedFile.name} (${previewData.length} lignes)`, 'info');
    };
    reader.readAsText(selectedFile);
  };

  const runCsvImport = async () => {
    if (!csvFile || isImporting) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const rawText = String(loadEvent.target.result || '');
      const lines = rawText.split(/\r?\n/).filter((line) => line.trim() !== '');
      if (lines.length === 0) {
        addMessage('Aucune ligne CSV exploitable trouvée.', 'warn');
        return;
      }

      setIsImporting(true);
      setProgress(0);
      setResults({ success: 0, errors: 0, details: [] });
      setMessages([]);
      addMessage(`Début de l'import mouvement CSV (${Math.max(lines.length - 1, 0)} ligne(s) à traiter).`, 'info');

      const newResults = { success: 0, errors: 0, details: [] };
      let processed = 0;

      try {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const lineNumber = i + 1;
          const parts = parseMovementLine(line);
          if ((parts[0] || '').toLowerCase().includes('ticket')) {
            addMessage(`Ligne ${lineNumber} ignorée (en-tête détecté).`, 'info');
            continue;
          }

          const payload = buildMovementPayload({
            ticketId: parts[0] || '',
            movement: parts[1] || '',
            reopenPercentage: parts[2] || '',
            reopenMode: parts[3] || '',
            closeValue: parts[2] || '',
          });

          payload.movement = ImportValidationService.normalizeMovement(payload.movement);

          const validation = validateMovementPayload(payload, lineNumber);
          if (!validation.valid) {
            newResults.errors += 1;
            newResults.details.push({
              status: 'error',
              row: lineNumber,
              name: payload.ticketId || 'Inconnu',
              message: validation.errors.join(' | '),
            });
            addMessage(validation.errors.join(' | '), 'error');
            processed += 1;
            setProgress(Math.round((processed / lines.length) * 100));
            setResults({ ...newResults });
            continue;
          }

          const ticketId = parseInt(String(payload.ticketId || '').trim(), 10);

          try {
            const result = await MouvementImportService.processMovement(ticketId, payload);
            newResults.success += 1;
            newResults.details.push({ status: 'success', row: lineNumber, name: `Ticket ${ticketId}`, message: result.message });
            addMessage(`Ticket ${ticketId} traité via CSV : ${payload.movement}.`, 'success');
          } catch (error) {
            newResults.errors += 1;
            newResults.details.push({ status: 'error', row: lineNumber, name: `Ticket ${ticketId}`, message: error.message });
            addMessage(`Erreur ligne ${lineNumber} : ${error.message}`, 'error');
          }

          processed += 1;
          setProgress(Math.round((processed / lines.length) * 100));
          setResults({ ...newResults });
        }

        setProgress(100);
        setResults({ ...newResults });
        addMessage(newResults.errors === 0 ? 'Import CSV terminé avec succès !' : `Import CSV terminé avec ${newResults.errors} erreur(s).`, newResults.errors === 0 ? 'success' : 'warn');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (isImporting || rows.length === 0) return;

    const actionableRows = rows.filter((row) => String(row.ticketId || '').trim() !== '');
    if (actionableRows.length === 0) {
      addMessage('Aucune ligne exploitable trouvée.', 'warn');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults({ success: 0, errors: 0, details: [] });
    setMessages([]);
    addMessage(`Début de l'import mouvement (${actionableRows.length} ligne(s) à traiter).`, 'info');

    const newResults = { success: 0, errors: 0, details: [] };
    let processed = 0;

    try {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const lineNumber = index + 1;
        const payload = buildMovementPayload(row);
        const validation = validateMovementPayload(payload, lineNumber);

        if (!validation.valid) {
          newResults.errors += 1;
          newResults.details.push({
            status: 'error',
            row: lineNumber,
            name: payload.ticketId || 'Inconnu',
            message: validation.errors.join(' | '),
          });
          addMessage(validation.errors.join(' | '), 'error');
          processed += 1;
          setProgress(Math.round((processed / rows.length) * 100));
          setResults({ ...newResults });
          continue;
        }

        const ticketId = parseInt(String(payload.ticketId || '').trim(), 10);
        addMessage(`Ligne ${lineNumber} : ticket ${ticketId} -> ${payload.movement}.`, 'info');

        try {
          const result = await MouvementImportService.processMovement(ticketId, payload);
          newResults.success += 1;
          newResults.details.push({
            status: 'success',
            row: lineNumber,
            name: `Ticket ${ticketId}`,
            message: result.message,
          });
          addMessage(`Ticket ${ticketId} traité : ${payload.movement}.`, 'success');
        } catch (error) {
          newResults.errors += 1;
          newResults.details.push({
            status: 'error',
            row: lineNumber,
            name: `Ticket ${ticketId}`,
            message: error.message,
          });
          addMessage(`Erreur ligne ${lineNumber} : ${error.message}`, 'error');
        }

        processed += 1;
        setProgress(Math.round((processed / rows.length) * 100));
        setResults({ ...newResults });
      }

      setProgress(100);
      setResults({ ...newResults });
      addMessage(
        newResults.errors === 0 ? 'Import terminé avec succès !' : `Import terminé avec ${newResults.errors} erreur(s).`,
        newResults.errors === 0 ? 'success' : 'warn',
      );
    } catch (error) {
      console.error('Erreur lors de l\'import mouvement :', error);
      addMessage(`Erreur lors de l'import : ${error.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="import-page">
      <div className="import-header">
        <h1 className="import-title">Import mouvement GLPI</h1>
        <p className="import-subtitle">Import CSV d'un côté, et saisie manuelle de l'autre.</p>
        <Link to="/import" className="btn-import btn-import--secondary" style={{ width: 'fit-content', marginTop: '12px' }}>
          Retour à l'import complet
        </Link>
      </div>

      <div className="import-panel">
        <div className="import-panel__header">
          <div className="import-panel__header-top">
            <h2 className="import-panel__title">
              <Upload size={18} />
              <span>Import CSV mouvement</span>
            </h2>
            <span className="import-panel__badge">{csvRowCount} ligne(s)</span>
          </div>
          <p className="import-panel__subtitle">Sélectionnez un seul fichier CSV pour exécuter les mouvements en série.</p>
        </div>

        <div className="import-panel__body">
          <div className="import-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="import-field import-field--ok">
              <div className="import-field__label">
                <ImageIcon size={18} />
                <span>Fichier CSV mouvement</span>
              </div>
              <div className="import-field__input-wrapper">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvChange}
                  disabled={isImporting}
                  className="import-field__file-input-overlay"
                />
                <div className="import-field__info">
                  {csvFile ? (
                    <div className="import-field__info-left">
                      <CheckCircle2 size={24} color="#16a34a" />
                      <span className="import-field__filename">{csvFile.name}</span>
                    </div>
                  ) : (
                    <div className="import-field__placeholder">
                      <Upload size={24} />
                      <span>Choisir un CSV</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {csvPreviewRows.length > 0 && (
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
                Données du fichier CSV sélectionné ({csvPreviewRows.length} ligne(s))
              </h4>
              <div className="parc-table-container" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '12px' }}>
                <table className="parc-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Ticket ID</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Mouvement</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Valeur / Pourcentage</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewRows.map((row, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{row[0] || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="item-type" style={{
                            backgroundColor: row[1] === 'open' || row[1] === 'reopen' ? '#fef3c7' : row[1] === 'close' ? '#d1fae5' : '#e0f2fe',
                            color: row[1] === 'open' || row[1] === 'reopen' ? '#d97706' : row[1] === 'close' ? '#059669' : '#0284c7'
                          }}>
                            {row[1] || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>{row[2] || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{row[3] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="import-alert import-alert--info">
            <AlertCircle size={20} />
            <div>
              <div className="import-alert__title">Structure attendue</div>
              <div>Réouverture : pourcentage + mode. Terminaison : valeur optionnelle. Annulation : remise au statut Nouveau.</div>
            </div>
          </div>

          <div className="import-footer-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runCsvImport}
              disabled={isImporting || !csvFile}
              className="btn-import btn-import--primary"
            >
              Importer le CSV
            </button>
          </div>

          <div className="import-panel__header" style={{ marginTop: '8px', borderRadius: '16px' }}>
            <div className="import-panel__header-top">
              <h2 className="import-panel__title">
                <Terminal size={18} />
                <span>Saisie manuelle des séquences</span>
              </h2>
              <span className="import-panel__badge">{movementCount} ligne(s)</span>
            </div>
            <p className="import-panel__subtitle">Ajoutez une ligne par ticket, choisissez le mouvement, puis le mode uniquement pour les réouvertures.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {rows.map((row, index) => (
              <div
                key={row.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '16px',
                  background: '#f8fafc',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: '12px',
                  alignItems: 'start',
                }}
              >
                <RowInput label={`Ticket #${index + 1}`}>
                  <input
                    type="number"
                    min="1"
                    value={row.ticketId}
                    onChange={(e) => updateRow(row.id, { ticketId: e.target.value })}
                    className="import-field__file-input"
                    style={{
                      display: 'block',
                      width: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      background: '#fff',
                    }}
                    placeholder="ID du ticket"
                    disabled={isImporting}
                  />
                </RowInput>

                <RowInput label="Mouvement">
                  <select
                    value={row.movement}
                    onChange={(e) => updateRow(row.id, { movement: e.target.value })}
                    style={{
                      width: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      background: '#fff',
                    }}
                    disabled={isImporting}
                  >
                    {MOVEMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </RowInput>

                {row.movement === 'reopen' ? (
                  <RowInput label="Pourcentage">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.reopenPercentage}
                      onChange={(e) => updateRow(row.id, { reopenPercentage: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        background: '#fff',
                      }}
                      placeholder="%"
                      disabled={isImporting}
                    />
                  </RowInput>
                ) : (
                  <RowInput label="Valeur">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.closeValue}
                      onChange={(e) => updateRow(row.id, { closeValue: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        background: '#fff',
                      }}
                      placeholder={row.movement === 'cancel' ? 'Optionnel' : 'Montant de clôture'}
                      disabled={isImporting}
                    />
                  </RowInput>
                )}

                {row.movement === 'reopen' ? (
                  <RowInput label="Mode">
                    <select
                      value={row.reopenMode}
                      onChange={(e) => updateRow(row.id, { reopenMode: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        background: '#fff',
                      }}
                      disabled={isImporting}
                    >
                      {REOPEN_MODES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </RowInput>
                ) : (
                  <div />
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={isImporting || rows.length === 1}
                    className="btn-import btn-import--secondary"
                    style={{ padding: '10px 14px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="import-footer-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={addRow}
              disabled={isImporting}
              className="btn-import btn-import--secondary"
            >
              <Plus size={16} />
              Ajouter une ligne
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || rows.length === 0}
              className="btn-import btn-import--primary"
            >
              Démarrer l'import
            </button>
          </div>

          {isImporting && (
            <div className="import-progress-box">
              <div className="import-progress-box__header">
                <span>Importation en cours...</span>
                <span>{progress}%</span>
              </div>
              <div className="import-progress-bar">
                <div className="import-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {results.details.length > 0 && !isImporting && (
            <div className={`import-results ${results.errors > 0 ? 'import-results--error' : 'import-results--ok'}`}>
              <div className={`import-results__header ${results.errors > 0 ? 'import-results__header--error' : 'import-results__header--ok'}`}>
                <span>Rapport : {results.success} succès — {results.errors} erreurs</span>
              </div>
              <div className="import-results__body">
                {results.details.map((detail, index) => (
                  <div key={index} className="import-results__item">
                    {detail.status === 'success' ? (
                      <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <strong className="import-results__item-title">Ligne {detail.row} {detail.name ? `(${detail.name})` : ''}</strong>
                      <div className="import-results__item-msg">{detail.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="import-terminal">
        <h3 className="import-terminal__header">
          <Terminal size={20} />
          <span>Journal Technique</span>
        </h3>
        <div className="import-terminal__logs">
          {messages.map((msg, index) => (
            <div key={index} className={`import-terminal__line import-terminal__line--${msg.type}`}>
              <span className="import-terminal__timestamp">[{msg.timestamp}]</span>
              {msg.msg}
            </div>
          ))}
          {messages.length === 0 && <div className="import-terminal__placeholder">En attente d'actions...</div>}
        </div>
      </div>
    </div>
  );
};

export default MouvementImportPage;
