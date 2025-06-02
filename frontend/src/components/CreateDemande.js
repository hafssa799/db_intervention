import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './CreateDemande.css';
import { useLocation } from 'react-router-dom';

export default function CreateDemande() {
  const [equipements, setEquipements] = useState([]);
  const [selectedEquipement, setSelectedEquipement] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    equipementId: '',
    description: '',
    priorite: 'MOYENNE',
    fichier: null,
    dateDemande: new Date().toISOString(),
    statut: 'EN_ATTENTE',
    localisation: '', // Ajout de la localisation
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  // Dans CreateDemande.jsx
  useEffect(() => {
    if (location.state && location.state.description) {
      setFormData(prev => ({
        ...prev,
        description: location.state.description
      }));
    }
  }, [location.state]);
  
  useEffect(() => {
    api.get('/api/equipements')
      .then(res => setEquipements(res.data))
      .catch(err => console.error('Erreur lors du chargement des équipements', err));
  }, []);
  
  const handleChange = e => {
    const { name, value, files } = e.target;
    
    if (name === 'fichier' && files.length > 0) {
      setFormData({
        ...formData,
        [name]: files[0],
      });
      setFileName(files[0].name);
    } else if (name === 'equipementId' && value) {
      const selected = equipements.find(eq => eq.idEquipement === value);
      setSelectedEquipement(selected);
      setFormData({
        ...formData,
        [name]: value,
        // Automatiquement récupérer la localisation de l'équipement sélectionné
        localisation: selected ? selected.localisation : '',
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    const data = new FormData();
    data.append('equipementId', formData.equipementId);
    data.append('description', formData.description);
    data.append('priorite', formData.priorite);
    data.append('fichier', formData.fichier);
    data.append('dateDemande', formData.dateDemande);
    data.append('statut', formData.statut);
    data.append('demandeurId', user.idUtilisateur);
    // CORRECTION: Ajouter la localisation aux données envoyées
    data.append('localisation', formData.localisation || '');
    
    try {
      await api.post('/api/interventions', data);
      setLoading(false);
      
      // Afficher un message de succès stylisé
      const successElement = document.createElement('div');
      successElement.className = 'success-message';
      successElement.textContent = 'Demande envoyée avec succès !';
      document.body.appendChild(successElement);
      
      setTimeout(() => {
        document.body.removeChild(successElement);
        navigate('/demandeur/dashboard');
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de l'envoi de la demande :", err);
      setLoading(false);
      
      // Afficher un message d'erreur stylisé
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = "Une erreur est survenue lors de l'envoi de la demande.";
      document.body.appendChild(errorElement);
      
      setTimeout(() => {
        document.body.removeChild(errorElement);
      }, 3000);
    }
  };
  
  const handleCancel = () => {
    navigate('/demandeur/dashboard');
  };
  
  return (
    <form onSubmit={handleSubmit} className="demande-form card">
      <h2>Nouvelle demande d'intervention</h2>
      
      <div className="form-section">
        <div className="form-section-title">Informations sur l'équipement</div>
        
        <div className="form-group">
          <label htmlFor="equipementId">Équipement concerné:</label>
          <select 
            id="equipementId"
            name="equipementId" 
            onChange={handleChange} 
            required
            disabled={loading}
          >
            <option value="">-- Sélectionnez un équipement --</option>
            {equipements.map(eq => (
              <option key={eq.idEquipement} value={eq.idEquipement}>
                {eq.typeEquipement} - {eq.modele} ({eq.localisation})
              </option>
            ))}
          </select>
        </div>
        
        {selectedEquipement && (
          <div className="equipement-details">
            <div className="form-group">
              <strong>Statut de l'équipement:</strong>
              <span className={`status-badge ${selectedEquipement.statut === 'EN_PANNE' ? 'status-annulee' : 'status-terminee'}`}>
                {selectedEquipement.statut || 'Non défini'}
              </span>
            </div>
            <div className="form-group">
              <strong>Localisation de l'équipement:</strong>
              <span>{selectedEquipement.localisation || 'Non définie'}</span>
            </div>
            
            {/* NOUVEAU: Champ pour modifier la localisation si nécessaire */}
            <div className="form-group">
              <label htmlFor="localisation">Localisation (modifiable):</label>
              <input
                type="text"
                id="localisation"
                name="localisation"
                value={formData.localisation}
                onChange={handleChange}
                placeholder="Localisation de l'intervention"
                disabled={loading}
              />
              <small>La localisation est automatiquement récupérée de l'équipement, mais peut être modifiée si nécessaire.</small>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-section">
        <div className="form-section-title">Détails du problème</div>
        
        <div className="form-group">
          <label htmlFor="description">Description du problème:</label>
          <textarea 
            id="description"
            name="description" 
            value={formData.description}
            onChange={handleChange} 
            required
            placeholder="Décrivez le problème avec précision..."
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Priorité:</label>
          <div className="priority-selector">
            <div className="priority-option">
              <input 
                type="radio" 
                id="priorite-critique" 
                name="priorite" 
                value="CRITIQUE"
                checked={formData.priorite === 'CRITIQUE'}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="priorite-critique">
                <span className="priority-icon">🔴</span>
                <span className="priority-text">Critique</span>
              </label>
            </div>
            
            <div className="priority-option">
              <input 
                type="radio" 
                id="priorite-haute" 
                name="priorite" 
                value="HAUTE"
                checked={formData.priorite === 'HAUTE'}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="priorite-haute">
                <span className="priority-icon">🟠</span>
                <span className="priority-text">Haute</span>
              </label>
            </div>
            
            <div className="priority-option">
              <input 
                type="radio" 
                id="priorite-moyenne" 
                name="priorite" 
                value="MOYENNE"
                checked={formData.priorite === 'MOYENNE'}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="priorite-moyenne">
                <span className="priority-icon">🟢</span>
                <span className="priority-text">Moyenne</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-section">
        <div className="form-section-title">Pièces jointes</div>
        
        <div className="form-group">
          <label>Document justificatif:</label>
          <div className="file-input-container">
            <label htmlFor="fichier" className="file-input-label">
              <span className="file-icon">📁</span>
              <span>{fileName || 'Choisir un fichier'}</span>
            </label>
            <input 
              type="file" 
              id="fichier"
              name="fichier" 
              onChange={handleChange}
              className="file-input"
              disabled={loading}
            />
          </div>
          {fileName && <div className="file-name">{fileName}</div>}
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="btn-cancel" 
          onClick={handleCancel}
          disabled={loading}
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
        </button>
      </div>
    </form>
  );
}