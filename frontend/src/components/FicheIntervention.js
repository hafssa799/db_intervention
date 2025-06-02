import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './FicheIntervention.css';

export default function FicheIntervention() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fonction pour enregistrer automatiquement la consultation
  const trackConsultation = async (interventionId) => {
    try {
      // Créer un objet simple pour tracer la consultation
      const consultationData = {
        interventionId: interventionId,
        dateConsultation: new Date().toISOString(),
        utilisateur: localStorage.getItem('userId') || 'anonyme', // Si vous stockez l'ID utilisateur
        action: 'CONSULTATION_FICHE'
      };

      // Convertir en JSON et créer un blob
      const jsonContent = JSON.stringify(consultationData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      // Créer FormData pour l'envoi
      const formData = new FormData();
      formData.append('fichier', new File([blob], `consultation_${interventionId}_${Date.now()}.json`, {
        type: 'application/json'
      }));

      // Envoyer discrètement au serveur
      await api.put(`/api/interventions/${interventionId}/fichier`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Consultation enregistrée automatiquement');
    } catch (err) {
      console.log('Erreur lors de l\'enregistrement de la consultation:', err);
      // Erreur silencieuse - ne pas perturber l'utilisateur
    }
  };

  // Fonction pour générer le PDF
  const generatePDF = () => {
    setGeneratingPdf(true);
    
    try {
      // Créer le contenu HTML pour le PDF
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Fiche d'intervention #${intervention.idIntervention}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #007bff; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .section h3 { 
              color: #007bff; 
              border-bottom: 1px solid #007bff;
              padding-bottom: 5px;
              margin-top: 0;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin-top: 15px;
            }
            .info-item { 
              padding: 8px; 
              background-color: #f8f9fa;
              border-radius: 3px;
            }
            .info-label { 
              font-weight: bold; 
              color: #495057;
            }
            .description-box { 
              background-color: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              margin-top: 10px;
              min-height: 50px;
            }
            .status-badge { 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px; 
              font-weight: bold;
            }
            .status-en-attente { background-color: #ffc107; color: #000; }
            .status-en-cours { background-color: #17a2b8; color: #fff; }
            .status-terminee { background-color: #28a745; color: #fff; }
            .status-annulee { background-color: #dc3545; color: #fff; }
            .priorite-badge { 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px; 
              font-weight: bold;
            }
            .priorite-haute { background-color: #dc3545; color: #fff; }
            .priorite-moyenne { background-color: #ffc107; color: #000; }
            .priorite-basse { background-color: #6c757d; color: #fff; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              text-align: center; 
              color: #6c757d; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fiche d'intervention #${intervention.idIntervention}</h1>
            <p>Générée le ${formatDate(new Date().toISOString())}</p>
          </div>

          <div class="section">
            <h3>Informations générales</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Date de demande:</span><br>
                <span>${formatDate(intervention.dateDemande)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Statut:</span><br>
                <span class="status-badge ${getStatusClass(intervention.statut)}">${intervention.statut || 'Non défini'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Priorité:</span><br>
                <span class="priorite-badge ${getPrioriteClass(intervention.priorite)}">${intervention.priorite || 'Non définie'}</span>
              </div>
              ${intervention.dateFin ? `
              <div class="info-item">
                <span class="info-label">Date de fin:</span><br>
                <span>${formatDate(intervention.dateFin)}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <h3>Description de la demande</h3>
            <div class="description-box">
              ${intervention.description || 'Aucune description fournie'}
            </div>
          </div>

          ${intervention.equipement ? `
          <div class="section">
            <h3>Information sur l'équipement</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Type:</span><br>
                <span>${intervention.equipement.typeEquipement || 'Non défini'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Modèle:</span><br>
                <span>${intervention.equipement.modele || 'Non défini'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Numéro de série:</span><br>
                <span>${intervention.equipement.numeroSerie || 'Non défini'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Statut de l'équipement:</span><br>
                <span>${intervention.equipement.statut || 'Non défini'}</span>
              </div>
            </div>
          </div>
          ` : ''}

          ${intervention.technicien ? `
          <div class="section">
            <h3>Technicien assigné</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nom:</span><br>
                <span>${intervention.technicien.nom} ${intervention.technicien.prenom}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span><br>
                <span>${intervention.technicien.email}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>Document généré automatiquement - Système de gestion des interventions</p>
          </div>
        </body>
        </html>
      `;

      // Créer un blob avec le contenu HTML
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Ouvrir dans une nouvelle fenêtre pour impression/sauvegarde en PDF
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            URL.revokeObjectURL(url);
          }, 500);
        };
      } else {
        // Fallback: téléchargement direct du fichier HTML
        const link = document.createElement('a');
        link.href = url;
        link.download = `fiche_intervention_${intervention.idIntervention}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    const fetchInterventionDetails = async () => {
      console.log("Chargement des détails de l'intervention avec ID:", id);
      setLoading(true);
      setError('');
      
      try {
        const response = await api.get(`/api/interventions/${id}`);
        console.log("Données d'intervention reçues:", response.data);
        
        if (response.data) {
          setIntervention(response.data);
          
          // Enregistrer automatiquement la consultation en arrière-plan
          trackConsultation(response.data.idIntervention);
        } else {
          throw new Error("Aucune donnée d'intervention reçue");
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l'intervention:", err);
        if (err.response) {
          setError(`Erreur ${err.response.status}: ${err.response.data}`);
        } else if (err.request) {
          setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
        } else {
          setError(`Erreur: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInterventionDetails();
    } else {
      setError("ID d'intervention non valide");
      setLoading(false);
    }
  }, [id]);

  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return "Date non disponible";
      }
      
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return "Date invalide";
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-en-attente';
      case 'EN_COURS': return 'status-en-cours';
      case 'TERMINEE': return 'status-terminee';
      case 'ANNULEE': return 'status-annulee';
      default: return '';
    }
  };

  const getPrioriteClass = (priorite) => {
    switch(priorite) {
      case 'HAUTE': return 'priorite-haute';
      case 'MOYENNE': return 'priorite-moyenne';
      case 'BASSE': return 'priorite-basse';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="fiche-container loading">
        <div className="loading-spinner">Chargement des détails de l'intervention...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fiche-container error">
        <div className="error-message">
          <h3>Erreur lors du chargement des détails</h3>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={() => navigate('/demandeur/dashboard')} className="btn-retour">
              Retour au tableau de bord
            </button>
            <button onClick={() => window.location.reload()} className="btn-refresh">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="fiche-container error">
        <div className="error-message">
          <h3>Intervention non trouvée</h3>
          <p>L'intervention demandée n'existe pas ou a été supprimée.</p>
          <button onClick={() => navigate('/demandeur/dashboard')} className="btn-retour">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fiche-container">
      <div className="fiche-header">
        <h2>Fiche d'intervention #{intervention.idIntervention}</h2>
        <div className="header-buttons">
          <button 
            onClick={generatePDF} 
            className="btn-pdf"
            disabled={generatingPdf}
          >
            {generatingPdf ? '📄 Génération...' : '📄 Générer PDF'}
          </button>
          <button onClick={() => navigate('/demandeur/dashboard')} className="btn-retour">
            Retour au tableau de bord
          </button>
        </div>
      </div>

      <div className="fiche-content">
        <div className="fiche-section">
          <h3>Informations générales</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Date de demande:</span>
              <span className="info-value">{formatDate(intervention.dateDemande)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Statut:</span>
              <span className={`info-value status-badge ${getStatusClass(intervention.statut)}`}>
                {intervention.statut || 'Non défini'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Priorité:</span>
              <span className={`info-value priorite-badge ${getPrioriteClass(intervention.priorite)}`}>
                {intervention.priorite || 'Non définie'}
              </span>
            </div>
            {intervention.dateFin && (
              <div className="info-item">
                <span className="info-label">Date de fin:</span>
                <span className="info-value">{formatDate(intervention.dateFin)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="fiche-section">
          <h3>Description de la demande</h3>
          <div className="description-box">
            {intervention.description || 'Aucune description fournie'}
          </div>
        </div>

        {intervention.equipement && (
          <div className="fiche-section">
            <h3>Information sur l'équipement</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{intervention.equipement.typeEquipement || 'Non défini'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Modèle:</span>
                <span className="info-value">{intervention.equipement.modele || 'Non défini'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Numéro de série:</span>
                <span className="info-value">{intervention.equipement.numeroSerie || 'Non défini'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Statut de l'équipement:</span>
                <span className="info-value">{intervention.equipement.statut || 'Non défini'}</span>
              </div>
            </div>
          </div>
        )}

        {intervention.technicien && (
          <div className="fiche-section">
            <h3>Technicien assigné</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nom:</span>
                <span className="info-value">
                  {intervention.technicien.nom} {intervention.technicien.prenom}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{intervention.technicien.email}</span>
              </div>
            </div>
          </div>
        )}

        {intervention.fichier && (
          <div className="fiche-section">
            <h3>Document associé</h3>
            
          </div>
        )}
      </div>
    </div>
  );
}