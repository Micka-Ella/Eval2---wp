import React, { useState, useRef } from 'react';
import GLPIImportServiceV2 from '../../../services/import/GLPIImageImportServiceV2';
import {
  Package, Eye, ShoppingCart, Image as ImageIcon,
  Upload, CheckCircle2, AlertCircle, Terminal,
  ShieldCheck, RotateCcw, X,
} from 'lucide-react';
import '../../../styles/Import.css';

// ─── CSV Parser ──────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const result = []; let cur = ''; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
};

// ─── FileField ───────────────────────────────────────────────────────────────
const FileField = ({ label, icon: Icon, file, count, accept, onChange, disabled, onRemove }) => {
  const ref = useRef(null);
  return (
    <div 
      className={`import-field ${file ? 'import-field--ok' : ''} ${disabled ? 'import-field--disabled' : ''}`}
      onClick={() => !file && ref.current?.click()}
    >
      <input ref={ref} type="file" accept={accept} onChange={onChange} disabled={disabled} className="import-field__file-input" />
      <div className="import-field__label"><Icon size={15} />{label}</div>
      {file ? (
        <div className="import-field__info">
          <div className="import-field__info-left">
            <CheckCircle2 size={15} color="#16a34a" />
            <span className="import-field__filename">{file.name}</span>
          </div>
          <div className="import-field__meta-info">
            {count !== undefined && <span className="import-field__count">{count} lignes</span>}
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }} 
              disabled={disabled}
              className="import-field__remove-btn"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div className="import-field__placeholder">
          <Upload size={13} /> Choisir un fichier
        </div>
      )}
    </div>
  );
};

// ─── Page principale ─────────────────────────────────────────────────────────
const GLPIImageImportPageV2 = () => {
  const [file1, setFile1]     = useState(null);
  const [file2, setFile2]     = useState(null);
  const [file3, setFile3]     = useState(null);
  const [fileZip, setFileZip] = useState(null);

  const [preview1, setPreview1] = useState({ headers:[], rows:[] });
  const [preview2, setPreview2] = useState({ headers:[], rows:[] });
  const [preview3, setPreview3] = useState({ headers:[], rows:[] });

  const [validationErrors, setValidationErrors] = useState([]);
  const [isImporting, setIsImporting]           = useState(false);
  const [isRollingBack, setIsRollingBack]       = useState(false);   // ← comme PrestaShop
  const [rollbackStatus, setRollbackStatus]     = useState('');      // ← comme PrestaShop
  const [progress, setProgress]                 = useState(0);
  const [results, setResults]                   = useState({ success:0, errors:0, details:[] });
  const [messages, setMessages]                 = useState([]);
  const logEndRef = useRef(null);

  const addMessage = (msg, type = 'info') => {
    setMessages(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev]);
  };

  // ── CSV helpers ─────────────────────────────────────────────────────────────
  const readCSV = (f, setPreview, validateFn, prefix) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      setPreview(parsed);
      setResults({ success:0, errors:0, details:[] });
      if (parsed.rows.length > 0) {
        const v = validateFn(parsed);
        setValidationErrors(prev => [
          ...prev.filter(err => !err.startsWith(prefix)),
          ...v.errors.map(er => `${prefix} ${er}`)
        ]);
      }
    };
    reader.readAsText(f);
  };

  const handleFile1  = (e) => { const f = e.target.files[0]; if (!f) return; setFile1(f);   readCSV(f, setPreview1, GLPIImportServiceV2.validateItemHeaders,   '[Équipements]'); };
  const handleFile2  = (e) => { const f = e.target.files[0]; if (!f) return; setFile2(f);   readCSV(f, setPreview2, GLPIImportServiceV2.validateTicketHeaders, '[Tickets]'); };
  const handleFile3  = (e) => { const f = e.target.files[0]; if (!f) return; setFile3(f);   readCSV(f, setPreview3, GLPIImportServiceV2.validateCostHeaders,   '[Coûts]'); };
  const handleZip    = (e) => { const f = e.target.files[0]; if (!f) return; setFileZip(f); setResults({ success:0, errors:0, details:[] }); };

  const removeFile = (setter, setPreview, emptyPrev, prefix) => () => {
    setter(null);
    if (setPreview) setPreview(emptyPrev);
    setValidationErrors(prev => prev.filter(e => !e.startsWith(prefix)));
    setResults({ success:0, errors:0, details:[] });
  };

  // ── Import — PATTERN IDENTIQUE À PRESTASHOP ─────────────────────────────────
  const handleImport = async () => {
    const hasData = preview1.rows.length || preview2.rows.length || preview3.rows.length || fileZip;
    if (!hasData || isImporting || validationErrors.length > 0) return;

    setIsImporting(true);
    setProgress(0);
    setResults({ success:0, errors:0, details:[] });
    setMessages([]);
    addMessage("Début de l'importation...", 'info');

    const newResults = { success:0, errors:0, details:[] };

    // ═══════════════════════════════════════════════════════════════════
    // ROLLBACK STACK — même pattern que ProductImport.jsx (PrestaShop)
    // Chaque ressource créée est enregistrée ici.
    // Si une ligne throw une erreur → elle remonte au catch global
    // → runRollback() supprime TOUT ce qui a été créé.
    // ═══════════════════════════════════════════════════════════════════
    const rollbackStack = [];
    const addToRollback = (type, id, itemType = null) =>
      rollbackStack.push({ type, id, itemType });

    const runRollback = async () => {
      console.warn('🚨 Erreur critique. Déclenchement du Rollback Global...');
      setIsRollingBack(true);
      addMessage('Une erreur est survenue. Nettoyage de sécurité en cours...', 'error');
      try {
        const deleted = await GLPIImportServiceV2.runRollback(
          rollbackStack,
          (msg, type) => {
            setRollbackStatus(msg);
            addMessage(msg, type || 'warn');
          }
        );
        addMessage(`Rollback terminé. ${deleted} ressource(s) supprimée(s).`, 'success');
      } catch (e) {
        addMessage('Erreur lors du nettoyage.', 'error');
      } finally {
        setIsRollingBack(false);
        setRollbackStatus('');
      }
    };

    const totalRows = preview1.rows.length + preview2.rows.length + preview3.rows.length;
    let processed = 0;
    let hasFailed = false; // ← empêche l'import images si une erreur CSV a eu lieu

    try {
      // ── Feuille 1 : Équipements ─────────────────────────────────────────
      if (preview1.rows.length > 0) addMessage('📦 Importation des équipements...', 'info');
      for (let i = 0; i < preview1.rows.length; i++) {
        const row = preview1.rows[i];
        const lineNumber = i + 2;

        // Validation ligne par ligne — comme PrestaShop
        const v = GLPIImportServiceV2.validateItemRow(row, lineNumber);
        if (!v.valid) throw new Error(`Ligne ${lineNumber} : ${v.errors.join(', ')}`);

        try {
          const res = await GLPIImportServiceV2.importItemRow(row, addToRollback);
          newResults.success++;
          newResults.details.push({ status:'success', name: res.name, message: `${res.itemType} "${res.name}" créé (ID=${res.id})` });
          addMessage(`✅ ${res.itemType} "${res.name}" importé.`, 'success');
        } catch (err) {
          hasFailed = true;
          newResults.errors++;
          newResults.details.push({ status:'error', name: row[0], row: lineNumber, message: err.message });
          throw err; // ← REMONTE AU CATCH GLOBAL → ROLLBACK (comme PrestaShop)
        }

        processed++;
        setProgress(Math.round((processed / totalRows) * 100));
        setResults({ ...newResults });
      }

      // ── Feuille 2 : Tickets ────────────────────────────────────────────
      const ticketMap = {};
      if (preview2.rows.length > 0) addMessage('🎫 Importation des tickets...', 'info');
      for (let i = 0; i < preview2.rows.length; i++) {
        const row = preview2.rows[i];
        const lineNumber = preview1.rows.length + i + 2;

        const v = GLPIImportServiceV2.validateTicketRow(row, lineNumber);
        if (!v.valid) throw new Error(`Ligne ${lineNumber} : ${v.errors.join(', ')}`);

        try {
          const res = await GLPIImportServiceV2.importTicketRow(row, addToRollback);
          ticketMap[res.refTicket] = res.id;
          newResults.success++;
          newResults.details.push({ status:'success', name: row[4], message: `Ticket "${row[4]}" créé (ID=${res.id})` });
          addMessage(`✅ Ticket "${row[4]}" importé (ID=${res.id}).`, 'success');
        } catch (err) {
          hasFailed = true;
          newResults.errors++;
          newResults.details.push({ status:'error', name: row[4], row: lineNumber, message: err.message });
          throw err; // ← REMONTE AU CATCH GLOBAL → ROLLBACK
        }

        processed++;
        setProgress(Math.round((processed / totalRows) * 100));
        setResults({ ...newResults });
      }

      // ── Feuille 3 : Coûts ──────────────────────────────────────────────
      if (preview3.rows.length > 0) addMessage('💰 Importation des coûts...', 'info');
      for (let i = 0; i < preview3.rows.length; i++) {
        const row = preview3.rows[i];
        const lineNumber = preview1.rows.length + preview2.rows.length + i + 2;

        const v = GLPIImportServiceV2.validateCostRow(row, lineNumber);
        if (!v.valid) throw new Error(`Ligne ${lineNumber} : ${v.errors.join(', ')}`);

        try {
          const res = await GLPIImportServiceV2.importCostRow(row, ticketMap, addToRollback);
          newResults.success++;
          newResults.details.push({ status:'success', name:`Coût ticket ${row[0]}`, message:`Coût pour ticket "${row[0]}" importé.` });
          addMessage(`✅ Coût pour ticket "${row[0]}" importé.`, 'success');
        } catch (err) {
          hasFailed = true;
          newResults.errors++;
          newResults.details.push({ status:'error', name:`Ticket ${row[0]}`, row: lineNumber, message: err.message });
          throw err; // ← REMONTE AU CATCH GLOBAL → ROLLBACK
        }

        processed++;
        setProgress(Math.round((processed / totalRows) * 100));
        setResults({ ...newResults });
      }

    } catch (globalError) {
      // ═══════════════════════════════════════════════════════════════════
      // CATCH GLOBAL — déclenché par chaque throw dans les boucles ci-dessus
      // Exactement comme PrestaShop ProductImport.jsx lignes 290-293
      // ═══════════════════════════════════════════════════════════════════
      addMessage(`Échec : ${globalError.message}`, 'error');
      await runRollback();
    }

    // ── Feuille 4 : Images — seulement si pas d'échec CSV (comme PrestaShop) ──
    if (fileZip && !hasFailed) {
      addMessage('🖼️ Importation des images (rollback local par image)...', 'info');
      try {
        const imgResults = await GLPIImportServiceV2.importImages(
          fileZip,
          addMessage,
          (pct) => setProgress(Math.min(99, 80 + pct * 0.2))
        );
        newResults.success      += imgResults.success;
        newResults.errors       += imgResults.errors;
        newResults.details.push(...imgResults.details);
        addMessage(`✅ Images : ${imgResults.success} succès, ${imgResults.errors} erreur(s).`, 'success');
      } catch (imgErr) {
        addMessage(`❌ Erreur images : ${imgErr.message}`, 'error');
      }
    }

    setIsImporting(false);
    setProgress(100);
    setResults({ ...newResults });
    addMessage('Processus terminé.', 'info');
  };

  const hasFiles = file1 || file2 || file3 || fileZip;
  const canImport = hasFiles && !isImporting && validationErrors.length === 0;

  return (
    <div className="import-page">
      <div className="import-header">
        <h1 className="import-title">Import GLPI (V2)</h1>
        <p className="import-subtitle">Importation sécurisée avec option de rollback automatique en cas d'erreur.</p>
      </div>

      <div className="import-panel">
        <div className="import-panel__header">
          <div className="import-panel__header-top">
            <h2 className="import-panel__title">
              <ShieldCheck size={22} />
              <span>Import GLPI — v2 (avec Rollback)</span>
            </h2>
            <div className="import-panel__badge">
              <RotateCcw size={12} />
              <span>Rollback automatique activé</span>
            </div>
          </div>
          <p className="import-panel__subtitle">Importez équipements, tickets, coûts et images. En cas d'erreur sur une ligne, toutes les données de la session sont automatiquement supprimées.</p>
        </div>

        <div className="import-panel__body">
          {/* Overlay Rollback en cours */}
          {isRollingBack && (
            <div className="import-alert import-alert--warning">
              <RotateCcw size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>Nettoyage de sécurité en cours...</strong>
                {rollbackStatus && <div style={{ marginTop: '4px', fontWeight: 600 }}>{rollbackStatus}</div>}
              </div>
            </div>
          )}

          {/* Explication rollback */}
          <div className="import-alert import-alert--info">
            <ShieldCheck size={17} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong>Rollback identique à PrestaShop :</strong> Si une ligne est invalide ou échoue,
              l'import s'arrête immédiatement et <em>toutes</em> les ressources créées pendant cette
              session sont supprimées. Pour les images, le rollback est local (uniquement le document orphelin).
            </div>
          </div>

          {/* 4 file fields */}
          <div className="import-grid">
            <FileField label="1. Équipements (CSV)" icon={Package}
              file={file1} count={preview1.rows.length} accept=".csv"
              onChange={handleFile1} disabled={isImporting}
              onRemove={removeFile(setFile1, setPreview1, { headers: [], rows: [] }, '[Équipements]')} />
            <FileField label="2. Tickets (CSV)" icon={Eye}
              file={file2} count={preview2.rows.length} accept=".csv"
              onChange={handleFile2} disabled={isImporting}
              onRemove={removeFile(setFile2, setPreview2, { headers: [], rows: [] }, '[Tickets]')} />
            <FileField label="3. Coûts (CSV)" icon={ShoppingCart}
              file={file3} count={preview3.rows.length} accept=".csv"
              onChange={handleFile3} disabled={isImporting}
              onRemove={removeFile(setFile3, setPreview3, { headers: [], rows: [] }, '[Coûts]')} />
            <FileField label="4. Images (.zip)" icon={ImageIcon}
              file={fileZip} accept=".zip"
              onChange={handleZip} disabled={isImporting}
              onRemove={removeFile(setFileZip, null, null, '')} />
          </div>

          {/* Erreurs de validation */}
          {validationErrors.length > 0 && !isImporting && (
            <div className="import-alert import-alert--danger">
              <AlertCircle size={15} />
              <div>
                <strong className="import-alert__title">{validationErrors.length} erreur(s) de validation — l'import est bloqué</strong>
                <ul className="import-alert__list">
                  {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Barre de progression */}
          {isImporting && (
            <div className="import-progress-box">
              <div className="import-progress-box__header">
                <span>{isRollingBack ? '⏪ Rollback en cours…' : 'Importation en cours…'}</span>
                <span>{progress}%</span>
              </div>
              <div className="import-progress-bar">
                <div className={`import-progress-fill ${isRollingBack ? 'import-progress-fill--rollback' : ''}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Résultats */}
          {results.details.length > 0 && !isImporting && (
            <div className={`import-results ${results.errors > 0 ? 'import-results--error' : 'import-results--ok'}`}>
              <div className={`import-results__header ${results.errors > 0 ? 'import-results__header--ok--error' : 'import-results__header--ok'}`}>
                <span>{results.success} succès — {results.errors} erreur(s)</span>
              </div>
              {results.errors > 0 && (
                <div className="import-results__body">
                  {results.details.filter(d => d.status === 'error').map((d, i) => (
                    <div key={i} className="import-results__item">
                      <AlertCircle size={13} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Ligne {d.row} {d.name ? `(${d.name})` : ''}</strong>
                        <div className="import-results__item-msg">{d.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Boutons */}
          {hasFiles && !isImporting && (
            <div className="import-footer-actions">
              <button onClick={() => {
                setFile1(null); setFile2(null); setFile3(null); setFileZip(null);
                setPreview1({ headers: [], rows: [] }); setPreview2({ headers: [], rows: [] }); setPreview3({ headers: [], rows: [] });
                setResults({ success: 0, errors: 0, details: [] }); setValidationErrors([]); setProgress(0); setMessages([]);
              }} className="btn-import btn-import--secondary">
                Tout annuler
              </button>
              <button id="btn-import-v2" onClick={handleImport} disabled={!canImport} className="btn-import btn-import--primary">
                <Upload size={15} /> Lancer l'importation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div className="import-terminal">
        <h3 className="import-terminal__header">
          <Terminal size={15} />
          <span>Journal d'importation</span>
        </h3>
        <div className="import-terminal__logs">
          {messages.length === 0
            ? <span className="import-terminal__placeholder">En attente d'actions…</span>
            : messages.map((l, i) => (
              <div key={i} className={`import-terminal__line import-terminal__line--${l.type}`}>
                <span className="import-terminal__timestamp">[{l.ts}]</span> {l.msg}
              </div>
            ))
          }
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default GLPIImageImportPageV2;
