import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MesInterventions() {
  const [interventions, setInterventions] = useState([]);
  const user = JSON.parse(localStorage.getItem('user')); // utilisateur connecté

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:8083/api/interventions/demandeur/${user.idUtilisateur}`)
        .then(response => {
          setInterventions(response.data);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des interventions :", error);
        });
    }
  }, [user]);

  return (
    <div>
      <h2>Mes Interventions</h2>
      {interventions.length === 0 ? (
        <p>Aucune intervention trouvée.</p>
      ) : (
        <ul>
          {interventions.map(intervention => (
            <li key={intervention.idIntervention}>
              {intervention.description} - Statut : {intervention.statut}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MesInterventions;
