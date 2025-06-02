import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import './InterventionList.css';

const InterventionList = () => {
  const [interventions, setInterventions] = useState([]);
  const [allInterventions, setAllInterventions] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [utilisateurs, setUtilisateurs] = useState({});
  const [equipements, setEquipements] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUtilisateurs = async () => {
    try {
      const res = await axios.get('http://localhost:8083/api/utilisateurs');
      const usersMap = res.data.reduce((acc, user) => {
        acc[user.idUtilisateur] = user;
        return acc;
      }, {});
      setUtilisateurs(usersMap);
    } catch (err) {
      console.error('Erreur chargement utilisateurs :', err);
      setError('Erreur lors du chargement des utilisateurs');
    }
  };

  const fetchEquipements = async () => {
    try {
      const res = await axios.get('http://localhost:8083/api/equipements');
      const eqMap = res.data.reduce((acc, eq) => {
        acc[eq.idEquipement] = eq;
        return acc;
      }, {});
      setEquipements(eqMap);
    } catch (err) {
      console.error('Erreur chargement équipements :', err);
      setError('Erreur lors du chargement des équipements');
    }
  };

  const [refresh, setRefresh] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8083/api/interventions');
      setAllInterventions(res.data);
      applyFilters(res.data);
    } catch (err) {
      console.error('Erreur chargement interventions :', err);
      setError('Erreur lors du chargement des interventions');
    } finally {
      setLoading(false);
    }
  };

  // Fonction qui filtre les interventions selon les critères
  const applyFilters = (data) => {
    let filteredData = [...data];
    
    // Filtre par statut
    if (filtreStatut) {
      filteredData = filteredData.filter(interv => interv.statut === filtreStatut);
    }
    
    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredData = filteredData.filter(interv => 
        // Recherche par ID
        interv.idIntervention.toString().includes(term) ||
        // Recherche par description
        (interv.description && interv.description.toLowerCase().includes(term)) ||
        // Recherche par technicien
        (interv.technicien && 
          (`${interv.technicien.prenom} ${interv.technicien.nom}`).toLowerCase().includes(term)) ||
        // Recherche par demandeur
        (interv.demandeur && 
          (`${interv.demandeur.prenom} ${interv.demandeur.nom}`).toLowerCase().includes(term)) ||
        // Recherche par équipement
        (interv.equipement && interv.equipement.typeEquipement.toLowerCase().includes(term))
      );
    }
    
    setInterventions(filteredData);
  };

  // Appliquer les filtres à chaque changement de statut ou terme de recherche
  useEffect(() => {
    if (allInterventions.length > 0) {
      applyFilters(allInterventions);
    }
  }, [filtreStatut, searchTerm]);

  // Charger les données au montage du composant ou lors d'un refresh
  useEffect(() => {
    fetchData();
    fetchUtilisateurs();
    fetchEquipements();
  }, [refresh]);

  const deleteIntervention = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await axios.delete(`http://localhost:8083/api/interventions/${id}`);
        setRefresh(!refresh);
      } catch (err) {
        console.error('Erreur suppression intervention :', err);
        setError('Erreur lors de la suppression de l\'intervention');
      }
    }
  };

  // Fonction pour mettre à jour le chemin PDF dans la base de données
  const updatePdfPath = async (interventionId, cheminPDF) => {
    try {
      const formData = new FormData();
      formData.append('cheminPDF', cheminPDF);
      
      await axios.put(`http://localhost:8083/api/interventions/${interventionId}/pdf-path`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Chemin PDF mis à jour dans la base de données');
      // Rafraîchir les données pour récupérer la version mise à jour
      setRefresh(!refresh);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du chemin PDF :', err);
      setError('Erreur lors de la sauvegarde du chemin PDF');
    }
  };

  // Fonction pour mettre à jour le chemin Excel dans la base de données
  const updateExcelPath = async (interventionId, cheminExcel) => {
    try {
      const formData = new FormData();
      formData.append('cheminExcel', cheminExcel);
      
      await axios.put(`http://localhost:8083/api/interventions/${interventionId}/excel-path`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Chemin Excel mis à jour dans la base de données');
      // Rafraîchir les données pour récupérer la version mise à jour
      setRefresh(!refresh);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du chemin Excel :', err);
      setError('Erreur lors de la sauvegarde du chemin Excel');
    }
  };

  // Fonction pour formater la date dans un format plus lisible
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non définie';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour traduire le statut
  const translateStatus = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_COURS': return 'En cours';
      case 'TERMINEE': return 'Terminée';
      default: return status;
    }
  };

  // Fonction PDF professionnelle avec logo OCP et signature automatique
  const exportToPDF = async (interv) => {
    try {
      const doc = new jsPDF();
      
      // Configuration des couleurs OCP
      const ocpGreen = [0, 102, 51];
      const darkGray = [64, 64, 64];
      const lightGray = [128, 128, 128];
      
      // En-tête avec bandeau vert OCP
      doc.setFillColor(...ocpGreen);
      doc.rect(0, 0, 210, 40, 'F'); // Rectangle vert en haut
      
      // Logo OCP (simulé - remplacez par votre logo en base64)
      // Pour ajouter un vrai logo : doc.addImage(logoBase64, 'PNG', 15, 8, 30, 24);
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 20, 12, 'F'); // Cercle blanc pour simuler le logo
      doc.setTextColor(0, 102, 51);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('OCP', 26, 22);
      
      // Titre principal
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('FICHE D\'INTERVENTION', 105, 18, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Office Chérifien des Phosphates', 105, 28, { align: 'center' });
      
      let y = 55;
      
      // Section informations principales
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('INFORMATIONS GÉNÉRALES', 20, y);
      
      // Ligne de séparation
      doc.setDrawColor(...ocpGreen);
      doc.setLineWidth(0.5);
      doc.line(20, y + 3, 190, y + 3);
      y += 15;
      
      // Informations en deux colonnes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      // Colonne gauche
      const leftColumn = 20;
      const rightColumn = 110;
      let leftY = y;
      let rightY = y;
      
      // ID et Date
      doc.setFont('helvetica', 'bold');
      doc.text('N° Intervention:', leftColumn, leftY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${interv.idIntervention}`, leftColumn + 35, leftY);
      leftY += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Date de demande:', leftColumn, leftY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(interv.dateDemande), leftColumn + 35, leftY);
      leftY += 8;
      
      // Statut avec couleur
      doc.setFont('helvetica', 'bold');
      doc.text('Statut:', leftColumn, leftY);
      
      // Couleur selon le statut
      switch(interv.statut) {
        case 'EN_ATTENTE':
          doc.setTextColor(255, 140, 0); // Orange
          break;
        case 'EN_COURS':
          doc.setTextColor(0, 123, 255); // Bleu
          break;
        case 'TERMINEE':
          doc.setTextColor(40, 167, 69); // Vert
          break;
        default:
          doc.setTextColor(0, 0, 0);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(translateStatus(interv.statut), leftColumn + 35, leftY);
      doc.setTextColor(0, 0, 0);
      leftY += 12;
      
      // Colonne droite - Personnes
      const technicien = interv.technicien ? `${interv.technicien.prenom} ${interv.technicien.nom}` : 'Non assigné';
      const demandeur = interv.demandeur ? `${interv.demandeur.prenom} ${interv.demandeur.nom}` : 'Inconnu';
      
      doc.setFont('helvetica', 'bold');
      doc.text('Technicien assigné:', rightColumn, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(technicien, rightColumn + 40, rightY);
      rightY += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Demandeur:', rightColumn, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(demandeur, rightColumn + 40, rightY);
      rightY += 12;
      
      y = Math.max(leftY, rightY) + 10;
      
      // Section équipement
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ÉQUIPEMENT CONCERNÉ', 20, y);
      
      doc.setDrawColor(...ocpGreen);
      doc.line(20, y + 3, 190, y + 3);
      y += 15;
      
      const equipement = interv.equipement ? interv.equipement.typeEquipement : 'Non défini';
      const modele = interv.equipement?.modele || 'N/A';
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Type d\'équipement:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(equipement, 70, y);
      y += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Modèle:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(modele, 70, y);
      y += 15;
      
      // Section description
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('DESCRIPTION DE L\'INTERVENTION', 20, y);
      
      doc.setDrawColor(...ocpGreen);
      doc.line(20, y + 3, 190, y + 3);
      y += 15;
      
      // Cadre pour la description
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.3);
      doc.rect(20, y - 5, 170, 40);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const descriptionText = interv.description || 'Aucune description fournie.';
      const descriptionLines = doc.splitTextToSize(descriptionText, 160);
      doc.text(descriptionLines, 25, y + 3);
      
      y += 55;
      
      // Section observations (vide pour remplissage manuel)
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('OBSERVATIONS ET ACTIONS RÉALISÉES', 20, y);
      
      doc.setDrawColor(...ocpGreen);
      doc.line(20, y + 3, 190, y + 3);
      y += 15;
      
      // Cadre vide pour observations
      doc.setDrawColor(...lightGray);
      doc.rect(20, y - 5, 170, 30);
      y += 40;
      
      // Pied de page avec signatures
      const pageHeight = doc.internal.pageSize.height;
      let footerY = pageHeight - 60;
      
      // Ligne de séparation du pied de page
      doc.setDrawColor(...ocpGreen);
      doc.setLineWidth(0.8);
      doc.line(20, footerY - 10, 190, footerY - 10);
      
      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...darkGray);
      
      // Signature technicien (gauche)
      doc.text('Signature du technicien', 30, footerY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Nom: ' + technicien, 30, footerY + 8);
      doc.text('Date: _______________', 30, footerY + 16);
      doc.text('Signature: _______________', 30, footerY + 24);
      
      // Signature administrateur (droite) - Automatique
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Validé par l\'administration', 130, footerY);
      
      // Récupération du nom de l'admin (remplacez par votre logique d'authentification)
      const adminName = 'Admin OCP'; // À récupérer depuis le contexte utilisateur
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Nom: ' + adminName, 130, footerY + 8);
      doc.text('Date: ' + currentDate, 130, footerY + 16);
      
      // Signature stylisée automatique
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(14);
      doc.setTextColor(...ocpGreen);
      doc.text(adminName, 130, footerY + 28);
      
      // Numéro de page et informations de génération
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...lightGray);
      doc.text(`Document généré le ${new Date().toLocaleString('fr-FR')} - Page 1/1`, 20, pageHeight - 10);
      doc.text('Office Chérifien des Phosphates - Système de Gestion des Interventions', 105, pageHeight - 10, { align: 'center' });
      
      // Générer le nom du fichier et le chemin
      const fileName = `OCP_intervention_${interv.idIntervention}_${new Date().toISOString().split('T')[0]}.pdf`;
      const cheminPDF = `/documents/pdf/${fileName}`;
      
      // Sauvegarder le fichier
      doc.save(fileName);
      
      // Mettre à jour le chemin dans la base de données
      await updatePdfPath(interv.idIntervention, cheminPDF);
      
      console.log(`PDF professionnel généré et chemin sauvegardé : ${cheminPDF}`);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF :', err);
      setError('Erreur lors de la génération du PDF');
    }
  };

  const exportToExcel = async (interv) => {
    try {
      const data = [{
        ID: interv.idIntervention,
        Description: interv.description,
        DateDemande: formatDate(interv.dateDemande),
        Statut: interv.statut,
        Technicien: interv.technicien ? `${interv.technicien.prenom} ${interv.technicien.nom}` : 'Non assigné',
        Demandeur: interv.demandeur ? `${interv.demandeur.prenom} ${interv.demandeur.nom}` : 'Inconnu',
        Equipement: interv.equipement ? interv.equipement.typeEquipement : 'Non défini',
      }];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Intervention');
      
      // Générer le nom du fichier et le chemin
      const fileName = `OCP_intervention_${interv.idIntervention}.xlsx`;
      const cheminExcel = `/documents/excel/${fileName}`;
      
      // Sauvegarder le fichier
      XLSX.writeFile(wb, fileName);
      
      // Mettre à jour le chemin dans la base de données
      await updateExcelPath(interv.idIntervention, cheminExcel);
      
      console.log(`Excel généré et chemin sauvegardé : ${cheminExcel}`);
    } catch (err) {
      console.error('Erreur lors de la génération du fichier Excel :', err);
      setError('Erreur lors de la génération du fichier Excel');
    }
  };

  // Fonction pour obtenir la classe CSS selon le statut
  const getStatusClass = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-waiting';
      case 'EN_COURS': return 'status-in-progress';
      case 'TERMINEE': return 'status-completed';
      default: return '';
    }
  };

  return (
    <div className="intervention-list-container">
      <div className="intervention-header">
        <div className="header-left">
          <img
            src="/images/background.png"
            alt="Illustration intervention"
            className="intervention-image"
          />
          <div>
            <h2>Gestion des Interventions</h2>
            <p className="subtitle">Office Chérifien des Phosphates</p>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par ID, description, technicien..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-status">
          <select 
            value={filtreStatut} 
            onChange={e => setFiltreStatut(e.target.value)}
            className="status-select"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
          </select>
        </div>
      </div>

      <div className="create-intervention-section">
        <Link to="/create-intervention" className="btn-create-intervention">
          <span className="plus-icon">+</span>
          Nouvelle intervention
        </Link>
      </div>

      {loading ? (
        <div className="loading-spinner">Chargement des données...</div>
      ) : interventions.length === 0 ? (
        <div className="no-data-message">
          Aucune intervention trouvée pour les critères sélectionnés.
        </div>
      ) : (
        <div className="intervention-cards-container">
          {interventions.map(interv => (
            <div className="intervention-card" key={interv.idIntervention}>
              <div className="card-header">
                <div className="intervention-id">N° {interv.idIntervention}</div>
                <div className={`intervention-status ${getStatusClass(interv.statut)}`}>
                  {translateStatus(interv.statut)}
                </div>
              </div>
              
              <div className="card-content">
                <div className="intervention-date">
                  <span className="icon">📅</span> {formatDate(interv.dateDemande)}
                </div>
                
                <h3 className="intervention-title">{interv.description}</h3>
                
                <div className="intervention-details">
                  <div className="detail-item">
                    <span className="icon">👨‍🔧</span>
                    <span className="label">Technicien : </span>
                    <span className="value">{
                      interv.technicien 
                        ? `${interv.technicien.prenom} ${interv.technicien.nom}` 
                        : 'Non assigné'
                    }</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="icon">🔧</span>
                    <span className="label">Équipement : </span>
                    <span className="value">{
                      interv.equipement 
                        ? `${interv.equipement.typeEquipement} - ${interv.equipement.modele || 'N/A'}` 
                        : 'Aucun équipement'
                    }</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="icon">👤</span>
                    <span className="label">Demandeur : </span>
                    <span className="value">{
                      interv.demandeur 
                        ? `${interv.demandeur.prenom} ${interv.demandeur.nom}` 
                        : 'Non spécifié'
                    }</span>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <Link to={`/admin/interventions/edit/${interv.idIntervention}`} className="btn-edit">
                  <span className="icon">✏️</span> Modifier
                </Link>
                
                <div className="export-actions">
                  <button onClick={() => exportToPDF(interv)} className="btn-export pdf">
                    <span className="icon">📄</span> PDF
                  </button>
                  <button onClick={() => exportToExcel(interv)} className="btn-export excel">
                    <span className="icon">📊</span> Excel
                  </button>
                </div>
                
                <button onClick={() => deleteIntervention(interv.idIntervention)} className="btn-delete">
                  <span className="icon">🗑️</span> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterventionList;