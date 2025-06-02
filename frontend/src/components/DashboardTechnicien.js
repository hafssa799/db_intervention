import React, { useEffect, useState } from 'react';
import axios from 'axios';

function DashboardTechnicien() {
  const [interventions, setInterventions] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    axios.get(`http://localhost:8080/api/interventions/technicien/${user.idUtilisateur}`)
      .then((response) => {
        setInterventions(response.data);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des interventions :", error);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Interventions assignées</h1>
      {interventions.length === 0 ? (
        <p>Aucune intervention trouvée.</p>
      ) : (
        <ul className="space-y-2">
          {interventions.map((intervention) => (
            <li key={intervention.id} className="p-2 bg-gray-100 rounded">
              <p><strong>ID:</strong> {intervention.id}</p>
              <p><strong>Statut:</strong> {intervention.statut}</p>
              <p><strong>Équipement:</strong> {intervention.equipement.nom}</p>
              {/* Ajoute plus de détails si nécessaire */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardTechnicien;
