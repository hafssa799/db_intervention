// src/components/InterventionsAssignées.js
import React, { useState, useEffect } from "react";
import api from "../api"; // Instance Axios
import { useHistory, useParams } from "react-router-dom";
import jsPDF from 'jspdf'; // Pour générer des PDF

const InterventionsAssignées = () => {
  const { id } = useParams(); // Récupérer l'ID de l'intervention
  const [intervention, setIntervention] = useState(null);
  const [action, setAction] = useState("");
  const [panne, setPanne] = useState("");
  const history = useHistory();

  // Charger l'intervention
  useEffect(() => {
    const fetchIntervention = async () => {
      try {
        const res = await api.get(`/api/interventions/${id}`);
        setIntervention(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement de l'intervention:", error);
      }
    };

    fetchIntervention();
  }, [id]);

  // Modifier le statut
  const handleStatutChange = async (newStatut) => {
    try {
      await api.put(`/api/interventions/${id}/statut`, { statut: newStatut });
      setIntervention(prev => ({ ...prev, statut: newStatut }));
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
    }
  };

  // Ajouter une action réalisée
  const handleActionSubmit = async () => {
    try {
      await api.post(`/api/interventions/${id}/actions`, { action });
      setAction(""); // Réinitialiser le champ
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'action:", error);
    }
  };

  // Ajouter une panne détectée
  const handlePanneSubmit = async () => {
    try {
      await api.post(`/api/interventions/${id}/pannes`, { panne });
      setPanne(""); // Réinitialiser le champ
    } catch (error) {
      console.error("Erreur lors de l'ajout de la panne:", error);
    }
  };

  // Générer un rapport PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Intervention: ${intervention.titre}`, 10, 10);
    doc.text(`Statut: ${intervention.statut}`, 10, 20);
    doc.text(`Description: ${intervention.description}`, 10, 30);
    doc.save('rapport_intervention.pdf');
  };

  if (!intervention) return <p>Chargement...</p>;

  return (
    <div className="interventions-details">
      <h2>Intervention #{intervention.id}</h2>
      <p><strong>Titre:</strong> {intervention.titre}</p>
      <p><strong>Description:</strong> {intervention.description}</p>
      <p><strong>Statut:</strong> {intervention.statut}</p>

      <button onClick={() => handleStatutChange("EN_COURS")}>Marquer comme en cours</button>
      <button onClick={() => handleStatutChange("RESOLUE")}>Marquer comme résolue</button>

      <div>
        <h3>Ajouter une action réalisée</h3>
        <textarea value={action} onChange={(e) => setAction(e.target.value)} />
        <button onClick={handleActionSubmit}>Ajouter</button>
      </div>

      <div>
        <h3>Ajouter une panne détectée</h3>
        <textarea value={panne} onChange={(e) => setPanne(e.target.value)} />
        <button onClick={handlePanneSubmit}>Ajouter</button>
      </div>

      <button onClick={generatePDF}>Générer Rapport PDF</button>
    </div>
  );
};

export default InterventionsAssignées;
