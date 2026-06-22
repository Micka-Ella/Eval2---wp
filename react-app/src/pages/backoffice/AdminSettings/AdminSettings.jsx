import React, { useState, useEffect } from 'react';
import SettingsService from '../../../services/Settings/SettingsService';
import '../../../styles/AdminSettings.css';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [colors, setColors] = useState({
    color_nouveau: '#3b82f6',
    color_inProgress: '#f59e0b',
    color_termine: '#10b981'
  });

  const [languages, setLanguages] = useState([
    { id: 1, nom: 'Français' },
    { id: 2, nom: 'Malgache' }
  ]);

  const [selectedLanguageId, setSelectedLanguageId] = useState(1);

  const [translations, setTranslations] = useState({
    1: { label_nouveau: 'Nouveau', label_inProgress: 'In progress (assigné)', label_termine: 'Terminé' },
    2: { label_nouveau: 'Vaovao', label_inProgress: 'Efa manao', label_termine: 'Vita' }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await SettingsService.getSettings();
        setColors({
          color_nouveau: data.color_nouveau || '#3b82f6',
          color_inProgress: data.color_inProgress || '#f59e0b',
          color_termine: data.color_termine || '#10b981'
        });
        setSelectedLanguageId(parseInt(data.selected_language_id) || 1);
        if (data.languages) {
          setLanguages(data.languages);
        }
        if (data.all_translations) {
          setTranslations(data.all_translations);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleLabelChange = (field, value) => {
    setTranslations(prev => ({
      ...prev,
      [selectedLanguageId]: {
        ...prev[selectedLanguageId],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const payload = {
        color_nouveau: colors.color_nouveau,
        color_inProgress: colors.color_inProgress,
        color_termine: colors.color_termine,
        selected_language_id: String(selectedLanguageId),
        all_translations: translations
      };

      await SettingsService.updateSettings(payload);
      setSuccessMessage('Paramètres enregistrés avec succès !');
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMessage("Erreur lors de l'enregistrement des paramètres.");
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <div className="card" style={{ maxWidth: 'none', width: '100%', boxSizing: 'border-box' }}>
        <h1 className="card-title">Configuration du Kanban</h1>
        <p className="card-text" style={{ marginBottom: '24px' }}>Paramètres stockés dans SQLite</p>

        {successMessage && (
          <div className="admin-settings-alert admin-settings-alert-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="admin-settings-alert admin-settings-alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div>Chargement des paramètres...</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Section I: Colors */}
            <div className="admin-section" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                i. Couleurs des colonnes Kanban
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Couleur colonne "Nouveau"</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colors.color_nouveau}
                      onChange={e => setColors(prev => ({ ...prev, color_nouveau: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={colors.color_nouveau}
                      onChange={e => setColors(prev => ({ ...prev, color_nouveau: e.target.value }))}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Couleur colonne "In progress"</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colors.color_inProgress}
                      onChange={e => setColors(prev => ({ ...prev, color_inProgress: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={colors.color_inProgress}
                      onChange={e => setColors(prev => ({ ...prev, color_inProgress: e.target.value }))}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Couleur colonne "Terminé"</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colors.color_termine}
                      onChange={e => setColors(prev => ({ ...prev, color_termine: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={colors.color_termine}
                      onChange={e => setColors(prev => ({ ...prev, color_termine: e.target.value }))}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', flex: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section II: Language Dropdown */}
            <div className="admin-section" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                ii. Choix de la langue active
              </h3>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Sélectionner la langue</label>
                <select
                  value={selectedLanguageId}
                  onChange={e => setSelectedLanguageId(parseInt(e.target.value))}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section III: Translations */}
            <div className="admin-section" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                iii. Libellés des statuts (pour la langue sélectionnée)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Libellé "Nouveau"</label>
                  <input
                    type="text"
                    value={translations[selectedLanguageId]?.label_nouveau || ''}
                    onChange={e => handleLabelChange('label_nouveau', e.target.value)}
                    placeholder="Ex: Vaovao"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Libellé "In progress"</label>
                  <input
                    type="text"
                    value={translations[selectedLanguageId]?.label_inProgress || ''}
                    onChange={e => handleLabelChange('label_inProgress', e.target.value)}
                    placeholder="Ex: Efa manao"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Libellé "Terminé"</label>
                  <input
                    type="text"
                    value={translations[selectedLanguageId]?.label_termine || ''}
                    onChange={e => handleLabelChange('label_termine', e.target.value)}
                    placeholder="Ex: Vita"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
