
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateIntervention.css';

const CreateIntervention = () => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [equipementId, setEquipementId] = useState('');
  const [technicienId, setTechnicienId] = useState('');
  const [demandeurId, setDemandeurId] = useState('');
  const [priorite, setPriorite] = useState('NORMALE'); // Ajout d'un champ priorité avec valeur par défaut
  const [message, setMessage] = useState('');
  const [equipements, setEquipements] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [demandeurs, setDemandeurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
const [dateDebut, setDateDebut] = useState('');
const [dateFin, setDateFin] = useState('');
const [localisation, setLocalisation] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [equipRes, techRes, demRes] = await Promise.all([
          axios.get('http://localhost:8083/api/equipements'),
          axios.get('http://localhost:8083/api/utilisateurs?role=TECHNICIEN'),
          axios.get('http://localhost:8083/api/utilisateurs?role=DEMANDEUR'),
        ]);
        setEquipements(equipRes.data);
        setTechniciens(techRes.data);
        setDemandeurs(demRes.data);
      } catch (error) {
        console.error('Erreur chargement données :', error);
        setMessage("❌ Erreur lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
      setMessage("❌ La date ne peut pas être dans le passé.");
      return;
    }

    // Création d'un objet FormData pour l'envoi multipart/form-data
    const formData = new FormData();
    formData.append('description', description.trim());
    formData.append('equipementId', equipementId);
    formData.append('demandeurId', demandeurId);
    formData.append('priorite', priorite);
    formData.append('dateDebut', dateDebut);
formData.append('dateFin', dateFin);
formData.append('localisation', localisation);

    // Facultatif - ajout d'une date à la FormData si votre backend l'utilise
    // Note: le backend ne semble pas utiliser ce champ mais il est maintenu pour cohérence
    if (date) {
      formData.append('dateDemande', date);
    }

    try {
      const res = await axios.post('http://localhost:8083/api/interventions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.status === 200 || res.status === 201) {
        setMessage('✅ Intervention créée avec succès !');
        setTimeout(() => navigate('/interventions'), 1500);
      }
    } catch (err) {
      console.error("Erreur création :", err);
      setMessage(err.response?.data?.message || "❌ Une erreur est survenue.");
    }
  };

  if (isLoading) {
    return <div className="loading">Chargement des données...</div>;
  }

  return (
    <div className="create-intervention-container">
      <h2>Créer une intervention</h2>

      {message && <div className="message">{message}</div>}

      <form onSubmit={handleSubmit} className="create-intervention-form">
        <div className="form-group">
          <label htmlFor="description">Description du problème</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème rencontré"
            required
          />
        </div>
<div className="form-group">
  <label htmlFor="dateDebut">Date de début</label>
  <input
    id="dateDebut"
    type="datetime-local"
    value={dateDebut}
    onChange={(e) => setDateDebut(e.target.value)}
    required
  />
</div>

<div className="form-group">
  <label htmlFor="dateFin">Date de fin</label>
  <input
    id="dateFin"
    type="datetime-local"
    value={dateFin}
    onChange={(e) => setDateFin(e.target.value)}
    required
  />
</div>

<div className="form-group">
  <label htmlFor="localisation">Localisation</label>
  <input
    id="localisation"
    type="text"
    value={localisation}
    onChange={(e) => setLocalisation(e.target.value)}
    placeholder="Ex : Bloc technique, Bâtiment A"
    required
  />
</div>

        <div className="form-group">
          <label htmlFor="date">Date prévue</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="priorite">Priorité</label>
          <select
            id="priorite"
            value={priorite}
            onChange={(e) => setPriorite(e.target.value)}
            required
          >
            <option value="BASSE">Basse</option>
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="equipement">Équipement concerné</label>
          <select
            id="equipement"
            value={equipementId}
            onChange={(e) => setEquipementId(e.target.value)}
            required
          >
            <option value="">-- Sélectionner un équipement --</option>
            {equipements.map((eq) => (
              <option key={eq.idEquipement} value={eq.idEquipement}>
                {eq.typeEquipement}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="technicien">Technicien assigné</label>
          <select
            id="technicien"
            value={technicienId}
            onChange={(e) => setTechnicienId(e.target.value)}
          >
            <option value="">-- Sélectionner un technicien --</option>
            {techniciens.map((tech) => (
              <option key={tech.idUtilisateur} value={tech.idUtilisateur}>
                {tech.prenom} {tech.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="demandeur">Demandeur</label>
          <select
            id="demandeur"
            value={demandeurId}
            onChange={(e) => setDemandeurId(e.target.value)}
            required
          >
            <option value="">-- Sélectionner un demandeur --</option>
            {demandeurs.map((dem) => (
              <option key={dem.idUtilisateur} value={dem.idUtilisateur}>
                {dem.prenom} {dem.nom}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-submit">
          <i className="fas fa-save"></i> Créer l'intervention
        </button>
      </form>
    </div>
  );
};

export default CreateIntervention