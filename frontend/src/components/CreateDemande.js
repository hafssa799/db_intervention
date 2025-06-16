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
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  const [formData, setFormData] = useState({
    equipementId: '',
    description: '',
    priorite: 'MOYENNE',
    fichier: null,
    dateDemande: new Date().toISOString(),
    statut: 'EN_ATTENTE',
    localisation: '',
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  // Fonction pour afficher des notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 4000);
  };

  useEffect(() => {
    if (location.state && location.state.description) {
      setFormData(prev => ({
        ...prev,
        description: location.state.description
      }));
    }
  }, [location.state]);
  
  useEffect(() => {
    const loadEquipements = async () => {
      try {
        const response = await api.get('/api/equipements');
        setEquipements(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des équipements:', error);
        showNotification('Erreur lors du chargement des équipements', 'error');
      }
    };
    
    loadEquipements();
  }, []);
  
  const handleChange = e => {
    const { name, value, files } = e.target;
    
    if (name === 'fichier' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0],
      }));
      setFileName(files[0].name);
    } else if (name === 'equipementId' && value) {
      // Conversion en nombre pour la comparaison
      const equipementId = parseInt(value);
      const selected = equipements.find(eq => eq.idEquipement === equipementId);
      setSelectedEquipement(selected);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Set localisation based on selected equipment, or keep it empty if no selection
        localisation: selected ? selected.localisation || '' : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.idUtilisateur) {
        showNotification('Utilisateur non connecté', 'error');
        navigate('/login');
        return;
      }

      // Validation des champs requis
      if (!formData.equipementId || !formData.description) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        setLoading(false);
        return;
      }

      // CORRECTION MAJEURE: Utiliser multipart/form-data comme attendu par le contrôleur
      const data = new FormData();
      data.append('equipementId', formData.equipementId);
      data.append('description', formData.description);
      data.append('priorite', formData.priorite);
      data.append('demandeurId', user.idUtilisateur);
      data.append('localisation', formData.localisation || ''); // Ensure localisation is included
      
      // Ajouter les champs optionnels s'ils existent
      if (formData.fichier) {
        data.append('fichier', formData.fichier);
      }

      console.log('Données envoyées:', {
        equipementId: formData.equipementId,
        description: formData.description,
        priorite: formData.priorite,
        demandeurId: user.idUtilisateur,
        localisation: formData.localisation
      });

      const response = await api.post('/api/interventions', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Réponse du serveur:', response.data);
      
      showNotification('Demande créée avec succès !', 'success');
      
      // Rediriger après un délai
      setTimeout(() => {
        navigate('/demandeur/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error("Erreur complète lors de l'envoi:", error);
      
      let errorMessage = "Une erreur est survenue lors de l'envoi de la demande.";
      
      if (error.response) {
        console.error('Erreur response:', error.response.data);
        console.error('Status:', error.response.status);
        
        if (error.response.status === 404) {
          errorMessage = "Équipement ou utilisateur non trouvé.";
        } else if (error.response.status === 400) {
          errorMessage = "Données invalides. Vérifiez les informations saisies.";
        } else if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.request) {
        errorMessage = "Impossible de contacter le serveur.";
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/demandeur/dashboard');
  };
  
  return (
    <div className="create-demande-container">
      {/* Notification */}
      {notification.message && (
        <div className={`notification ${notification.type} show`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="demande-form card">
        <h2>Nouvelle demande d'intervention</h2>
        
        <div className="form-section">
          <div className="form-section-title">Informations sur l'équipement</div>
          
          <div className="form-group">
            <label htmlFor="equipementId">Équipement concerné *:</label>
            <select 
              id="equipementId"
              name="equipementId" 
              value={formData.equipementId}
              onChange={handleChange} 
              required
              disabled={loading}
            >
              <option value="">-- Sélectionnez un équipement --</option>
              {equipements.map(eq => (
                <option key={eq.idEquipement} value={eq.idEquipement}>
                  {eq.typeEquipement} - {eq.modele}
                </option>
              ))}
            </select>
          </div>
          
          {selectedEquipement && (
  <div className="equipement-details">
    <div className="form-group">
  <label htmlFor="equipementStatus">Statut de l'équipement:</label>
  <input
    type="text"
    id="equipementStatus"
    name="equipementStatus" // Added name for consistency, though not strictly needed for readOnly
    value={selectedEquipement.statut || 'Non défini'}
    readOnly // Makes the input field read-only
    className={`status-badge ${selectedEquipement.statut === 'EN_PANNE' ? 'status-annulee' : 'status-terminee'}`}
  />
</div>
    
    
   <div className="form-group">
      {/* Changed <strong> to <label> for consistent styling */}
      <label htmlFor="equipementLocation">Localisation de l'équipement:</label>
      
    </div>
    <input
        type="text"
        id="localisation"
        name="localisation"
        value={formData.localisation}
        onChange={handleChange}
    
      />
    
  
  </div>
)}
        </div>
        
        <div className="form-section">
          <div className="form-section-title">Détails du problème</div>
          
          <div className="form-group">
            <label htmlFor="description">Description du problème *:</label>
            <textarea 
              id="description"
              name="description" 
              value={formData.description}
              onChange={handleChange} 
              required
              placeholder="Décrivez le problème avec précision..."
              disabled={loading}
              rows="4"
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
            <label>Document justificatif (optionnel):</label>
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
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            {fileName && <div className="file-name">Fichier sélectionné: {fileName}</div>}
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
            className="btn-submit"
            disabled={loading || !formData.equipementId || !formData.description}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </div>
      </form>
    </div>
  );
}