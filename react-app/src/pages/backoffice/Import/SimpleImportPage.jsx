import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Terminal, Upload } from 'lucide-react';
import TicketService from '../../../services/Ticket/TicketService';
import ItemTicketService from '../../../services/ItemTicket/ItemTicketService';
import TicketCostService from '../../../services/TicketCost/TicketCostService';
import '../../../styles/Import.css';

const FileField = ({ file, onChange, disabled }) => (
  <div className={`import-field ${file ? 'import-field--ok' : ''} ${disabled ? 'import-field--disabled' : ''}`}>
    <div className="import-field__label">
      <Upload size={18} />
      <span>Fichier mouvement import</span>
    </div>
    <div className="import-field__input-wrapper">
      <input
        type="file"
        accept=".csv,.txt"
        onChange={onChange}
        disabled={disabled}
        className="import-field__file-input-overlay"
      />
      <div className="import-field__info">
        {file ? (
          <div className="import-field__info-left">
            <CheckCircle2 size={24} color="#16a34a" />
            <span className="import-field__filename">{file.name}</span>
          </div>
        ) : (
          <div className="import-field__placeholder">
            <Upload size={24} />
            <span>Choisir un fichier</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const mouvementImportPage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, errors: 0, details: [] });
  const [messages, setMessages] = useState([]);

  const addMessage = (msg, type = 'info') => {
    setMessages((prev) => [...prev, { msg, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const resetFeedback = () => {
    setProgress(0);
    setResults({ success: 0, errors: 0, details: [] });
    setMessages([]);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    resetFeedback();
    addMessage(`Fichier chargé : ${selectedFile.name}`, 'info');
  };

  const clearFile = () => {
    setFile(null);
    resetFeedback();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!file || isImporting) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = String(event.target.result || '');
      const lines = text.split(/\r?\n/);
      const actionableLines = lines.reduce((count, rawLine) => {
        if (!rawLine.trim()) return count;
        const separator = rawLine.includes(';') ? ';' : ',';
        const parts = rawLine.split(separator);
        if ((parts[0] || '').toLowerCase().includes('ticket')) return count;
        return count + 1;
      }, 0);

      setIsImporting(true);
      setProgress(0);
      setResults({ success: 0, errors: 0, details: [] });
      setMessages([]);
      addMessage(`Début de l'import mouvement (${actionableLines} ligne(s) à traiter).`, 'info');

      if (actionableLines === 0) {
        addMessage('Aucune ligne exploitable trouvée dans le fichier.', 'warn');
        setProgress(100);
        setIsImporting(false);
        return;
      }

      const newResults = { success: 0, errors: 0, details: [] };
      let processed = 0;

      try {
        for (let index = 0; index < lines.length; index++) {
          const rawLine = lines[index].trim();
          if (!rawLine) continue;

          const separator = rawLine.includes(';') ? ';' : ',';
          const parts = rawLine.split(separator);
          const lineNumber = index + 1;

          if ((parts[0] || '').toLowerCase().includes('ticket')) {
            addMessage(`Ligne ${lineNumber} ignorée (en-tête détecté).`, 'info');
            continue;
          }

          const ticketIdStr = parts[0] ? parts[0].trim() : '';
          const action = parts[1] ? parts[1].trim().toLowerCase() : '';
          const valueStr = parts[2] ? parts[2].trim().replace(',', '.') : '0';
          const modeStr = parts[3] ? parts[3].trim() : '0';

          const ticketId = parseInt(ticketIdStr, 10);
          const value = parseFloat(valueStr);
          const mode = parseInt(modeStr, 10);

          if (isNaN(ticketId) || !action) {
            const errorMessage = `Ligne ${lineNumber} : ticket ou action invalide.`;
            newResults.errors += 1;
            newResults.details.push({
              status: 'error',
              row: lineNumber,
              name: ticketIdStr || 'Inconnu',
              message: errorMessage,
            });
            addMessage(errorMessage, 'error');
            processed += 1;
            setProgress(Math.round((processed / actionableLines) * 100));
            setResults({ ...newResults });
            continue;
          }

          const groupId = Date.now().toString() + Math.random().toString(36).slice(2, 7);
          addMessage(`Ligne ${lineNumber} : ticket ${ticketId} -> ${action}.`, 'info');

          try {
            let linkedItems = [];
            try {
              linkedItems = await ItemTicketService.getItemsForTicket(ticketId);
            } catch (fetchError) {
              console.error('Impossible de récupérer les objets liés pour le ticket', ticketId, fetchError);
            }

            if (action === 'open') {
              if (isNaN(value) || isNaN(mode)) {
                throw new Error(`Valeur ou mode invalide pour le ticket ${ticketId}.`);
              }

              let baseCost = 0;
              try {
                const costResult = await TicketCostService.calculateBaseCost(ticketId, mode);
                baseCost = costResult.base_cost || 0;
              } catch (costError) {
                throw new Error(`Erreur de calcul du coût de base : ${costError.message}`);
              }

              const calculatedCost = baseCost * (value / 100);

              if (linkedItems && linkedItems.length > 0) {
                const dividedCost = calculatedCost / linkedItems.length;
                for (const item of linkedItems) {
                  await TicketCostService.saveCustomReopenCost(
                    ticketId, dividedCost, item.items_id, item.itemtype, groupId, value, mode, baseCost
                  );
                }
              } else {
                await TicketCostService.saveCustomReopenCost(
                  ticketId, calculatedCost, null, null, groupId, value, mode, baseCost
                );
              }

              await TicketService.updateTicket(ticketId, { status: 2 });

              newResults.success += 1;
              newResults.details.push({
                status: 'success',
                row: lineNumber,
                name: `Ticket ${ticketId}`,
                message: `Réouverture importée (${calculatedCost.toFixed(2)}).`,
              });
              addMessage(`Ticket ${ticketId} réouvert.`, 'success');
            } else if (action === 'close') {
              if (!isNaN(value) && value >= 0) {
                if (linkedItems && linkedItems.length > 0) {
                  const dividedCost = value / linkedItems.length;
                  for (const item of linkedItems) {
                    await TicketCostService.saveSuperCost(ticketId, dividedCost, item.items_id, item.itemtype, groupId);
                  }
                } else {
                  await TicketCostService.saveSuperCost(ticketId, value, null, null, groupId);
                }
              }

              try {
                const ticketObject = await TicketService.getTicket(ticketId);
                const currentContent = ticketObject.content || '';
                const formattedDate = new Date().toLocaleDateString('fr-FR');
                const closingNote = `\n\n[Clôture par import mouvement - Date : ${formattedDate}]`;

                await TicketService.updateTicket(ticketId, {
                  status: 6,
                  content: currentContent + closingNote,
                });
              } catch (ticketError) {
                await TicketService.updateTicket(ticketId, { status: 6 });
              }

              newResults.success += 1;
              newResults.details.push({
                status: 'success',
                row: lineNumber,
                name: `Ticket ${ticketId}`,
                message: 'Ticket clôturé avec succès.',
              });
              addMessage(`Ticket ${ticketId} clôturé.`, 'success');
            } else {
              throw new Error(`Action inconnue : ${action}`);
            }
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
          setProgress(Math.round((processed / actionableLines) * 100));
          setResults({ ...newResults });
        }

        setProgress(100);
        setResults({ ...newResults });
        addMessage(
          newResults.errors === 0
            ? 'Import terminé avec succès !'
            : `Import terminé avec ${newResults.errors} erreur(s).`,
          newResults.errors === 0 ? 'success' : 'warn',
        );
      } catch (error) {
        console.error('Erreur lors de l\'import mouvement :', error);
        addMessage(`Erreur lors de l'import : ${error.message}`, 'error');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="import-page">
      <div className="import-header">
        <h1 className="import-title">Import mouvement GLPI</h1>
        <p className="import-subtitle">Import ligne par ligne avec suivi temps réel des ouvertures et clôtures de tickets.</p>
        <Link to="/import" className="btn-import btn-import--secondary" style={{ width: 'fit-content', marginTop: '12px' }}>
          Retour à l'import complet
        </Link>
      </div>

      <div className="import-panel">
        <div className="import-panel__header">
          <div className="import-panel__header-top">
            <h2 className="import-panel__title">
              <Upload size={18} />
              <span>Fichier mouvement import</span>
            </h2>
            <span className="import-panel__badge">Suivi en temps réel</span>
          </div>
          <p className="import-panel__subtitle">Format attendu : ticketId, action, value, mode. Les séparateurs CSV et point-virgule sont acceptés.</p>
        </div>

        <div className="import-panel__body">
          <FileField file={file} onChange={handleFileChange} disabled={isImporting} />

          <div className="import-alert import-alert--info">
            <AlertCircle size={20} />
            <div>
              <div className="import-alert__title">Mode d'emploi</div>
              <div>Chaque ligne est traitée dans l'ordre, avec mise à jour du statut, des coûts et du journal technique en direct.</div>
            </div>
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

          <div className="import-footer-actions">
            <button
              type="button"
              onClick={clearFile}
              disabled={isImporting || !file}
              className="btn-import btn-import--secondary"
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || isImporting}
              className="btn-import btn-import--primary"
            >
              Démarrer l'import
            </button>
          </div>
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

export default mouvementImportPage;
