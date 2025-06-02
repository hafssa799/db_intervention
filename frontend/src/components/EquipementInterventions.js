// src/components/EquipementInterventions.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import equipementAPI from '../api/equipementAPI';
import './EquipementIntervention.css'; // Assure-toi que ce fichier existe

function EquipementInterventions() {
  const { id } = useParams();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    equipementAPI.getEquipementInterventions(id)
      .then(response => {
        setInterventions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erreur lors du chargement des interventions:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="interventions-container">
      <h2>Interventions pour l'équipement {id}</h2>
      {interventions.length === 0 ? (
        <p>Aucune intervention trouvée.</p>
      ) : (
        <div className="intervention-cards-container">
          {interventions.map(intervention => (
            <div key={intervention.idIntervention} className="intervention-card">
              <p><strong>Date :</strong> {new Date(intervention.dateDemande).toLocaleDateString()}</p>
              <p><strong>Description :</strong> {intervention.description}</p>
              <p><strong>Statut :</strong> {intervention.statut}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EquipementInterventions;
