import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './EquipementForm.css'; // Assurez-vous d'avoir ce fichier CSS

export default function EquipementForm() {
  // Récupérer l'ID de l'équipement depuis l'URL si on est en mode édition
  const { id } = useParams();
  const action = id ? 'edit' : 'add';

  const [formData, setFormData] = useState({
    numeroSerie: '',
    typeEquipement: '',
    modele: '',
    fabricant: '',
    dateAcquisition: '',
    dateInstallation: '',
    statut: '',
    localisation: '',
    cheminPDF: '',
    cheminExcel: ''
  });

  const [loading, setLoading] = useState(action === 'edit');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Si on est en mode édition, charger les données de l'équipement
  useEffect(() => {
    if (action === 'edit' && id) {
      fetchEquipement();
    }
  }, [action, id]);

  async function fetchEquipement() {
    try {
      console.log(`Récupération de l'équipement avec l'ID: ${id}`);
      const res = await api.get(`/api/equipements/${id}`);
      
      if (!res.data) {
        throw new Error('Aucune donnée reçue');
      }
      
      console.log('Données reçues:', res.data);
      
      // Formater les dates pour les champs date
      const equipement = {...res.data};
      
      if (equipement.dateAcquisition) {
        equipement.dateAcquisition = new Date(equipement.dateAcquisition).toISOString().split('T')[0];
      }
      if (equipement.dateInstallation) {
        equipement.dateInstallation = new Date(equipement.dateInstallation).toISOString().split('T')[0];
      }
      
      setFormData(equipement);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'équipement', err);
      setError(`Erreur lors du chargement de l'équipement: ${err.message}`);
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (action === 'add') {
        // Si on ajoute un nouvel équipement
        console.log('Ajout d\'un nouvel équipement:', formData);
        await api.post('/api/equipements', formData);
      } else if (action === 'edit') {
        // Si on modifie un équipement existant
        console.log(`Modification de l'équipement ID ${id}:`, formData);
        await api.put(`/api/equipements/${id}`, formData);
      }
      navigate('/equipements');  // Redirection vers la liste des équipements après l'ajout ou la modification
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors de l'${action === 'add' ? 'ajout' : 'édition'} de l'équipement: ${err.response ? err.response.data : err.message}`);
    }
  };

  if (loading) return <div className="loading">Chargement des données de l'équipement...</div>;

  return (
    <div className="equipement-form">
      <h2>{action === 'add' ? 'Ajouter un équipement' : `Modifier l'équipement #${id}`}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="numeroSerie">Numéro de série:</label>
          <input
            type="text"
            id="numeroSerie"
            name="numeroSerie"
            value={formData.numeroSerie || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="typeEquipement">Type d'équipement:</label>
          <input
            type="text"
            id="typeEquipement"
            name="typeEquipement"
            value={formData.typeEquipement || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="modele">Modèle:</label>
          <input
            type="text"
            id="modele"
            name="modele"
            value={formData.modele || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="fabricant">Fabricant:</label>
          <input
            type="text"
            id="fabricant"
            name="fabricant"
            value={formData.fabricant || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dateAcquisition">Date d'acquisition:</label>
          <input
            type="date"
            id="dateAcquisition"
            name="dateAcquisition"
            value={formData.dateAcquisition || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dateInstallation">Date d'installation:</label>
          <input
            type="date"
            id="dateInstallation"
            name="dateInstallation"
            value={formData.dateInstallation || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="statut">Statut:</label>
          <select
            id="statut"
            name="statut"
            value={formData.statut || ''}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un statut</option>
            <option value="En fonction">En fonction</option>
            <option value="En maintenance">En maintenance</option>
            <option value="Hors service">Hors service</option>
            <option value="En stock">En stock</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="localisation">Localisation:</label>
          <input
            type="text"
            id="localisation"
            name="localisation"
            value={formData.localisation || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {action === 'add' ? 'Ajouter' : 'Enregistrer les modifications'}
          </button>
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={() => navigate('/equipements')}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}