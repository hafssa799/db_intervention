import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './EquipementList.css';
import InterventionList from './InterventionList';

export default function EquipementList() {
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // État pour les filtres
  const [filtres, setFiltres] = useState({
    statut: '',
    typeEquipement: '',
    localisation: ''
  });
  
  // États pour les options de filtres disponibles
  const [statutOptions, setStatutOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [localisationOptions, setLocalisationOptions] = useState([]);

  useEffect(() => {
    fetchEquipements();
  }, []);

  async function fetchEquipements() {
    try {
      const res = await api.get('/api/equipements');
      setEquipements(res.data);
      
      // Extraire les options uniques pour les filtres
      const statuts = [...new Set(res.data.map(item => item.statut))].filter(Boolean);
      const types = [...new Set(res.data.map(item => item.typeEquipement))].filter(Boolean);
      const localisations = [...new Set(res.data.map(item => item.localisation))].filter(Boolean);
      
      setStatutOptions(statuts);
      setTypeOptions(types);
      setLocalisationOptions(localisations);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des équipements');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
  if (window.confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
    try {
      console.log(`Tentative de suppression de l'équipement ID: ${id}`);
      await api.delete(`/api/equipements/${id}`);
      fetchEquipements(); // Recharger la liste après suppression
    } catch (err) {
      // Log détaillé de l'erreur dans la console pour le développement
      console.error('Erreur lors de la suppression:', err);
      
      // Extraction des informations d'erreur pertinentes
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          err.message || 
                          'Erreur inconnue';
      
      console.error('Message d\'erreur formaté:', errorMessage);
      
      // Afficher un message d'erreur plus informatif à l'utilisateur
      setError(`Erreur lors de la suppression: ${errorMessage}`);
      
      // Si l'erreur est liée à des contraintes de clé étrangère (interventions associées)
      if (
        err.response?.data?.includes('constraint') || 
        err.response?.data?.includes('foreign key') ||
        errorMessage.includes('constraint') ||
        errorMessage.includes('foreign key') ||
        err.message?.includes('constraint')
      ) {
        setError(
          "Impossible de supprimer cet équipement car il possède des interventions associées. " +
          "Veuillez d'abord supprimer ces interventions."
        );
      }
    }
  }
};

// Vous pouvez aussi ajouter une fonction pour vérifier si un équipement a des interventions
// avant de tenter de le supprimer
const checkForInterventionsAndDelete = async (id) => {
  try {
    // Vérifier si l'équipement a des interventions
    const interventionsResponse = await api.get(`/api/equipements/${id}/interventions`);
    const interventions = interventionsResponse.data;
    
    if (interventions && interventions.length > 0) {
      const confirmDelete = window.confirm(
        `Cet équipement possède ${interventions.length} intervention(s) associée(s). ` +
        `Ces interventions doivent être supprimées avant de pouvoir supprimer l'équipement. ` +
        `Voulez-vous voir les interventions associées?`
      );
      
      if (confirmDelete) {
        // Rediriger vers la page des interventions de cet équipement
        navigate(`/equipements/${id}/interventions`);
      }
      
      return false; // Ne pas procéder à la suppression
    } else {
      // Si pas d'interventions, procéder à la suppression normale
      return handleDelete(id);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des interventions:", error);
    
    // En cas d'erreur, tenter la suppression normale
    return handleDelete(id);
  }
};
  const handleEdit = (id) => {
    navigate(`/equipements/edit/${id}`);
  };

  const handleAdd = () => {
    navigate('/equipements/add');
  };
  
  // Gestion des changements de filtres
  const handleFiltreChange = (e) => {
    const { name, value } = e.target;
    setFiltres({
      ...filtres,
      [name]: value
    });
  };
  
  // Fonction pour appliquer les filtres
  const applyFilters = async () => {
    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtrage
      let url = '/api/equipements/filter?';
      const params = new URLSearchParams();
      
      if (filtres.statut) params.append('statut', filtres.statut);
      if (filtres.typeEquipement) params.append('typeEquipement', filtres.typeEquipement);
      if (filtres.localisation) params.append('localisation', filtres.localisation);
      
      // Si aucun filtre n'est sélectionné, récupérer tous les équipements
      if (params.toString() === '') {
        fetchEquipements();
        return;
      }
      
      const res = await api.get(`/api/equipements/filter?${params.toString()}`);
      setEquipements(res.data);
    } catch (err) {
      console.error('Erreur lors du filtrage', err);
      setError('Erreur lors du filtrage des équipements');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFiltres({
      statut: '',
      typeEquipement: '',
      localisation: ''
    });
    fetchEquipements();
  };

  if (loading) return <p>Chargement en cours...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="equipement-list">
      <header className="ocp-header">
        <div className="ocp-title-container">
          <h1 className="ocp-main-title">Gestion des Équipements</h1>
          <h2 className="ocp-subtitle">OCP Bureau Chérifien des Phosphates</h2>
        </div>
        <div className="logo-container">
          <img 
            src="https://th.bing.com/th/id/R.8166c38dd7fd6b8775425b5e4fcd42f5?rik=%2fHO5Qzeg%2b7q%2fvw&riu=http%3a%2f%2fphotos.prnewswire.com%2fprnfull%2f20160225%2f337613LOGO%3fmax%3d500&ehk=x9DbTqnZO1xb3NuBhmw8tayetTqT09T9ZoXCivKxs7o%3d&risl=&pid=ImgRaw&r=0" 
            alt="OCP Logo" 
            className="ocp-logo"
          />
        </div>
      </header>

  
      <h2>Liste des équipements</h2>
      
      {/* Section des filtres */}
      <div className="filtres-container">
        <h3>Filtres</h3>
        <div className="filtres-form">
          <div className="filtre-group">
            <label>Statut:</label>
            <select 
              name="statut" 
              value={filtres.statut} 
              onChange={handleFiltreChange}
            >
              <option value="">Tous</option>
              {statutOptions.map((option, index) => (
  <option key={index} value={option}>{option}</option>
))}

            </select>
          </div>
          
          <div className="filtre-group">
            <label>Type d'équipement:</label>
            <select 
              name="typeEquipement" 
              value={filtres.typeEquipement} 
              onChange={handleFiltreChange}
            >
              <option value="">Tous</option>
              {typeOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="filtre-group">
            <label>Localisation:</label>
            <select 
              name="localisation" 
              value={filtres.localisation} 
              onChange={handleFiltreChange}
            >
              <option value="">Toutes</option>
              {localisationOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="filtres-actions">
            <button onClick={applyFilters} className="btn-filter">Appliquer les filtres</button>
            <button onClick={resetFilters} className="btn-reset">Réinitialiser</button>
          </div>
        </div>
      </div>

      <button className="btn-ajouter" onClick={handleAdd}>➕ Ajouter un équipement</button>
      
      <table className="table-equipements">
        <thead>
          <tr>
            <th>ID</th>
            <th>Numéro de série</th>
            <th>Type d'équipement</th>
            <th>Modèle</th>
            <th>Fabricant</th>
            <th>Statut</th>
            <th>Localisation</th> {/* Nouvelle colonne ajoutée */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipements.length > 0 ? (
            equipements.map((equipement) => (
              <tr key={equipement.idEquipement}>
                <td>{equipement.idEquipement}</td>
                <td>{equipement.numeroSerie}</td>
                <td>{equipement.typeEquipement}</td>
                <td>{equipement.modele}</td>
                <td>{equipement.fabricant}</td>
                <td>{equipement.statut}</td>
                <td>{equipement.localisation}</td> {/* Affichage de la localisation */}
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(equipement.idEquipement)}>Modifier</button>
                  <button className="btn-delete" onClick={() => handleDelete(equipement.idEquipement)}>Supprimer</button>
                  {/* Ajout du lien vers les interventions */}
                  <Link to={`/equipements/${equipement.idEquipement}/interventions`} className="btn-interventions">
                    Voir les interventions
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">Aucun équipement trouvé</td> {/* Modifié pour 8 colonnes */}
            </tr>
          )}
        </tbody>
      </table>
    </div>
    
  );
}
