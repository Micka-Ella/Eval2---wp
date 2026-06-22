import React, { useState, useEffect } from 'react';
import ItemService from '../../services/ItemService';

const SimpleCrud = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ id: null, nom: '', categorie: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await ItemService.getAll();
      setItems(data);
    } catch (error) {
      console.error("Erreur lors du chargement", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la saisie
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Créer ou Mettre à jour (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom) return;
    
    setIsLoading(true);

    try {
      if (isEditing) {
        // Mettre à jour via le service
        await ItemService.update(formData.id, formData);
        setItems(items.map(item => (item.id === formData.id ? formData : item)));
        setIsEditing(false);
      } else {
        // Créer via le service
        const newItem = await ItemService.create(formData);
        setItems([...items, newItem]);
      }
      setFormData({ id: null, nom: '', categorie: '' }); // Réinitialiser le formulaire
    } catch (error) {
       console.error("Erreur lors de la sauvegarde", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Préparer l'édition
  const handleEdit = (item) => {
    setFormData(item);
    setIsEditing(true);
  };

  // Supprimer (Delete)
  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await ItemService.delete(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Annuler l'édition
  const handleCancel = () => {
    setFormData({ id: null, nom: '', categorie: '' });
    setIsEditing(false);
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Gestion Simple (CRUD React avec Service)</h2>
        
        {isLoading && <p style={{ color: 'blue', fontWeight: 'bold' }}>Chargement en cours...</p>}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px', opacity: isLoading ? 0.5 : 1 }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom / Titre :</label>
            <input 
              type="text" 
              name="nom" 
              value={formData.nom} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
              required 
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Catégorie :</label>
            <input 
              type="text" 
              name="categorie" 
              value={formData.categorie} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>
          <button type="submit" style={{ padding: '8px 15px', backgroundColor: isEditing ? '#f39c12' : '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isEditing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancel} style={{ padding: '8px 15px', marginLeft: '10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Annuler
            </button>
          )}
        </form>

        {/* Tableau (Read) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
          <thead style={{ backgroundColor: '#e9ecef' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Nom</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Catégorie</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{item.id}</td>
                <td style={{ padding: '12px' }}>{item.nom}</td>
                <td style={{ padding: '12px' }}>{item.categorie}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(item)} style={{ marginRight: '8px', padding: '6px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Modifier</button>
                  <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Supprimer</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{ padding: '12px', textAlign: 'center' }}>Aucun élément trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleCrud;