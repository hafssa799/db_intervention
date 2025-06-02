import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditIntervention.css';

const EditIntervention = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [intervention, setIntervention] = useState({
    description: '',
    dateDemande: '',
    statut: '',
    priorite: 'NORMALE', // Ajouté pour correspondre au backend
    idEquipement: '',
    idTechnicien: '',
    idDemandeur: ''
  });

  const [equipements, setEquipements] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [demandeurs, setDemandeurs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les données nécessaires en parallèle
        const [equipementsRes, techniciensRes, demandeursRes] = await Promise.all([
          axios.get('http://localhost:8083/api/equipements'),
          axios.get('http://localhost:8083/api/utilisateurs?role=TECHNICIEN'),
          axios.get('http://localhost:8083/api/utilisateurs?role=DEMANDEUR')
        ]);

        setEquipements(equipementsRes.data);
        setTechniciens(techniciensRes.data);
        setDemandeurs(demandeursRes.data);
        
        // Charger l'intervention 
        const interventionRes = await axios.get(`http://localhost:8083/api/interventions/${id}`);
        const data = interventionRes.data;
        
        // Convertir les ID en chaînes pour garantir des comparaisons cohérentes
        setIntervention({
          description: data.description || '',
          dateDemande: formatDate(data.dateDemande) || '',
          statut: data.statut || '',
          priorite: data.priorite || 'NORMALE', // Ajouté pour correspondre au backend
          idEquipement: data.equipement?.idEquipement?.toString() || '',
          idTechnicien: data.technicien?.idUtilisateur?.toString() || '',
          idDemandeur: data.demandeur?.idUtilisateur?.toString() || ''
        });
        
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Erreur lors du chargement des données. Veuillez réessayer ultérieurement.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fonction pour formater la date au format YYYY-MM-DD attendu par l'input date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Si la date est au format ISO avec heure/timezone, on extrait juste la partie date
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Sinon on retourne telle quelle
    return dateString;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIntervention(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    try {
      // Trouver les objets complets correspondant aux IDs sélectionnés
      const selectedEquipement = equipements.find(eq => eq.idEquipement.toString() === intervention.idEquipement);
      const selectedTechnicien = techniciens.find(tech => tech.idUtilisateur.toString() === intervention.idTechnicien);
      const selectedDemandeur = demandeurs.find(dem => dem.idUtilisateur.toString() === intervention.idDemandeur);
      
      // Création de l'objet à envoyer
      const updatedIntervention = {
        idIntervention: parseInt(id, 10),
        description: intervention.description,
        dateDemande: intervention.dateDemande,
        statut: intervention.statut,
        priorite: intervention.priorite, // Ajouté pour correspondre au backend
        equipement: selectedEquipement,
        technicien: selectedTechnicien,
        demandeur: selectedDemandeur
      };
    
      await axios.put(`http://localhost:8083/api/interventions/${id}`, updatedIntervention);
      
      // Afficher un message de succès avant de rediriger
      setSuccess(true);
      setTimeout(() => navigate('/interventions'), 1500);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'intervention:", err);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour de l'intervention");
    }
  };
  
  if (loading) {
    return (
      <div className="loading">
        Chargement des données de l'intervention...
      </div>
    );
  }
  
  return (
    <div className="edit-intervention-container">
      <h2>Modifier l'intervention n°{id}</h2>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {success && (
        <div className="message success-message">
          <i className="fas fa-check-circle"></i> Intervention mise à jour avec succès!
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-intervention-form">
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            name="description"
            value={intervention.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateDemande">Date prévue</label>
          <input
            id="dateDemande"
            type="date"
            name="dateDemande"
            value={intervention.dateDemande}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="statut">Statut</label>
          <select
            id="statut"
            name="statut"
            value={intervention.statut}
            onChange={handleChange}
            required
          >
            <option value="">-- Sélectionner un statut --</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priorite">Priorité</label>
          <select
            id="priorite"
            name="priorite"
            value={intervention.priorite}
            onChange={handleChange}
            required
          >
            <option value="BASSE">Basse</option>
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="idEquipement">Équipement</label>
          <select
            id="idEquipement"
            name="idEquipement"
            value={intervention.idEquipement}
            onChange={handleChange}
            required
          >
            <option value="">-- Sélectionner un équipement --</option>
            {equipements.map(eq => (
              <option key={eq.idEquipement} value={eq.idEquipement.toString()}>
                {eq.typeEquipement}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="idTechnicien">Technicien</label>
          <select
            id="idTechnicien"
            name="idTechnicien"
            value={intervention.idTechnicien}
            onChange={handleChange}
          >
            <option value="">-- Sélectionner un technicien --</option>
            {techniciens.map(tech => (
              <option key={tech.idUtilisateur} value={tech.idUtilisateur.toString()}>
                {tech.prenom} {tech.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="idDemandeur">Demandeur</label>
          <select
            id="idDemandeur"
            name="idDemandeur"
            value={intervention.idDemandeur}
            onChange={handleChange}
            required
          >
            <option value="">-- Sélectionner un demandeur --</option>
            {demandeurs.map(dem => (
              <option key={dem.idUtilisateur} value={dem.idUtilisateur.toString()}>
                {dem.prenom} {dem.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button type="button" onClick={() => navigate('/interventions')} className="btn-cancel">
            <i className="fas fa-times"></i> Annuler
          </button>
          <button type="submit" className="btn-save">
            <i className="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditIntervention;