const db = require('../database/db');

const getSettings = (req, res) => {
  try {
    // 1. Get settings from the settings table
    const rows = db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    rows.forEach(row => {
      settingsObj[row.key] = row.value;
    });

    // Default value for selected language if missing
    if (!settingsObj.selected_language_id) {
      settingsObj.selected_language_id = '1';
    }

    // 2. Get list of languages
    const languages = db.prepare('SELECT * FROM langue').all();
    settingsObj.languages = languages;

    // 3. Get all translations
    const translationsRows = db.prepare('SELECT * FROM settings_langue').all();
    const allTranslations = {};
    
    // Initialize allLanguages map
    languages.forEach(lang => {
      allTranslations[lang.id] = {
        label_nouveau: '',
        label_inProgress: '',
        label_termine: ''
      };
    });

    translationsRows.forEach(row => {
      const langId = row.id_langue;
      if (!allTranslations[langId]) {
        allTranslations[langId] = {};
      }
      if (row.id_ordre === 1) allTranslations[langId].label_nouveau = row.valeur;
      if (row.id_ordre === 2) allTranslations[langId].label_inProgress = row.valeur;
      if (row.id_ordre === 3) allTranslations[langId].label_termine = row.valeur;
    });

    settingsObj.all_translations = allTranslations;

    // 4. Fill active language labels at root level for legacy/frontoffice compatibility
    const activeLangId = settingsObj.selected_language_id;
    const activeTrans = allTranslations[activeLangId] || {
      label_nouveau: 'Nouveau',
      label_inProgress: 'In progress (assigné)',
      label_termine: 'Terminé'
    };

    settingsObj.label_nouveau = activeTrans.label_nouveau || 'Nouveau';
    settingsObj.label_inProgress = activeTrans.label_inProgress || 'In progress (assigné)';
    settingsObj.label_termine = activeTrans.label_termine || 'Terminé';

    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSettings = (req, res) => {
  try {
    const { all_translations, ...generalSettings } = req.body;
    
    const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    // Update general settings in a transaction
    const updateGeneralTx = db.transaction((settingsObj) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        updateStmt.run(key, String(value));
      }
    });
    updateGeneralTx(generalSettings);

    // Update translations if provided
    if (all_translations) {
      const updateTransStmt = db.prepare(`
        INSERT OR REPLACE INTO settings_langue (id_ordre, id_langue, valeur)
        VALUES (?, ?, ?)
      `);

      const updateTransTx = db.transaction((translationsObj) => {
        for (const [langId, trans] of Object.entries(translationsObj)) {
          const idLangue = parseInt(langId);
          if (trans.label_nouveau !== undefined) {
            updateTransStmt.run(1, idLangue, String(trans.label_nouveau));
          }
          if (trans.label_inProgress !== undefined) {
            updateTransStmt.run(2, idLangue, String(trans.label_inProgress));
          }
          if (trans.label_termine !== undefined) {
            updateTransStmt.run(3, idLangue, String(trans.label_termine));
          }
        }
      });
      updateTransTx(all_translations);
    }

    res.json({ message: 'Settings and translations updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSettings, updateSettings };
