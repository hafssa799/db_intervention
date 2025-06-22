"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import moment from "moment";
import autoTable from "jspdf-autotable";
import './EquipementList.css';

export default function EquipementList() {
  const [equipements, setEquipements] = useState([]);
  const [filteredEquipements, setFilteredEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('FR');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  
  // Ref pour éviter les mises à jour d'état sur un composant démonté
  const isMountedRef = useRef(true);
  
  // État pour les filtres
  const [searchParams, setSearchParams] = useState({
    searchField: 'numeroSerie',
    searchValue: '',
    statut: '',
    typeEquipement: '',
    localisation: ''
  });
  
  // États pour les options de filtres disponibles
  const [statutOptions, setStatutOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [localisationOptions, setLocalisationOptions] = useState([]);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Gestionnaire de défilement pour l'animation de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (isMountedRef.current) {
        setScrolled(window.scrollY > 20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchEquipements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [equipements, searchParams]);

  // Effet pour les messages de succès - disparition après 3 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setSuccessMessage('');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Effet pour les messages d'erreur - disparition après 3 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setError('');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchEquipements = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      setError('');
      const res = await api.get('/api/equipements');
      
      if (!isMountedRef.current) return;
      
      setEquipements(res.data || []);
      
      // Extraire les options uniques pour les filtres
      const statuts = [...new Set(res.data.map(item => item.statut))].filter(Boolean);
      const types = [...new Set(res.data.map(item => item.typeEquipement))].filter(Boolean);
      const localisations = [...new Set(res.data.map(item => item.localisation))].filter(Boolean);
      
      setStatutOptions(statuts);
      setTypeOptions(types);
      setLocalisationOptions(localisations);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des équipements:', err);
      if (isMountedRef.current) {
        setError('Erreur lors du chargement des équipements: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    }
  }, []);

  const applyFilters = useCallback(() => {
    if (!isMountedRef.current) return;
    
    let filtered = [...equipements];

    // Filtrage par recherche textuelle
    if (searchParams.searchValue && searchParams.searchValue.trim() !== '') {
      const searchTerm = searchParams.searchValue.toLowerCase().trim();
      
      filtered = filtered.filter((equipement) => {
        if (searchParams.searchField === 'numeroSerie') {
          return (equipement.numeroSerie || '').toLowerCase().includes(searchTerm);
        } else if (searchParams.searchField === 'modele') {
          return (equipement.modele || '').toLowerCase().includes(searchTerm);
        } else if (searchParams.searchField === 'fabricant') {
          return (equipement.fabricant || '').toLowerCase().includes(searchTerm);
        }
        return true;
      });
    }

    // Filtrage par statut
    if (searchParams.statut && searchParams.statut !== '') {
      filtered = filtered.filter(equipement => equipement.statut === searchParams.statut);
    }

    // Filtrage par type d'équipement
    if (searchParams.typeEquipement && searchParams.typeEquipement !== '') {
      filtered = filtered.filter(equipement => equipement.typeEquipement === searchParams.typeEquipement);
    }

    // Filtrage par localisation
    if (searchParams.localisation && searchParams.localisation !== '') {
      filtered = filtered.filter(equipement => equipement.localisation === searchParams.localisation);
    }

    setFilteredEquipements(filtered);
  }, [equipements, searchParams]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const resetFilters = () => {
    setSearchParams({
      searchField: 'numeroSerie',
      searchValue: '',
      statut: '',
      typeEquipement: '',
      localisation: ''
    });
  };

  const handleDelete = async (id) => {
    if (isDeleting) return; // Empêcher les clics multiples
    setConfirmDelete(id);
  };

  const confirmDeleteAction = useCallback(async () => {
    if (isDeleting || !confirmDelete || !isMountedRef.current) return;
    
    try {
      setIsDeleting(true);
      setError('');
      
      await api.delete(`/api/equipements/${confirmDelete}`);
      
      if (!isMountedRef.current) return;
      
      // Mettre à jour immédiatement la liste locale pour éviter les problèmes de DOM
      setEquipements(prev => prev.filter(eq => eq.idEquipement !== confirmDelete));
      setFilteredEquipements(prev => prev.filter(eq => eq.idEquipement !== confirmDelete));
      
      setSuccessMessage('Équipement supprimé avec succès');
      setConfirmDelete(null);
      
      // Rafraîchir les données depuis le serveur
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchEquipements();
        }
      }, 100);
      
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      if (isMountedRef.current) {
        if (err.response?.data?.includes('constraint') || 
            err.response?.data?.includes('foreign key') ||
            err.message?.includes('constraint')) {
          setError(
            "Impossible de supprimer cet équipement car il possède des interventions associées. " +
            "Veuillez d'abord supprimer ces interventions."
          );
        } else {
          setError('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message));
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  }, [confirmDelete, isDeleting, fetchEquipements]);

  const handleEdit = (id) => {
    navigate(`/equipements/edit/${id}`);
  };

  const handleAdd = () => {
    navigate('/equipements/add');
  };

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
  };

  const getStatutClass = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'actif':
      case 'en service':
        return 'ocp-admin-online';
      case 'maintenance':
        return 'ocp-admin-recent';
      case 'hors service':
        return 'ocp-admin-very-old';
      case 'en panne':
        return 'ocp-admin-never-connected';
      default:
        return 'ocp-admin-old';
    }
  };

  // Fonction d'export PDF pour un équipement individuel
  const exportEquipementToPDF = async (equipement) => {
    try {
      const doc = new jsPDF();

      // Ajout du logo OCP
      try {
        const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/d/d9/Ocp-group.png";
        doc.addImage(logoUrl, "PNG", 75, 10, 60, 20);
      } catch (logoError) {
        console.warn("Impossible de charger le logo:", logoError);
      }

      // Ligne de séparation
      doc.setDrawColor(0, 153, 76);
      doc.setLineWidth(1.2);
      doc.line(15, 35, 195, 35);

      // Titre principal
      doc.setFontSize(18);
      doc.setTextColor(34, 47, 62);
      doc.setFont("helvetica", "bold");
      doc.text("Fiche détaillée de l'équipement", 105, 45, { align: "center" });

      // Date de génération
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Généré le ${moment().format("DD/MM/YYYY à HH:mm")}`, 105, 53, { align: "center" });

      // Données du tableau
      const tableData = [
        [" Identifiant", `#${equipement.idEquipement || "N/A"}`],
        [" Numéro de série", equipement.numeroSerie || "N/A"],
        [" Type d'équipement", equipement.typeEquipement || "N/A"],
        [" Modèle", equipement.modele || "N/A"],
        [" Fabricant", equipement.fabricant || "N/A"],
        [" Statut", equipement.statut || "N/A"],
        [" Localisation", equipement.localisation || "N/A"],
        [" Date d'installation", equipement.dateInstallation ? moment(equipement.dateInstallation).format("DD/MM/YYYY") : "N/A"],
        [" Dernière maintenance", equipement.derniereMaintenance ? moment(equipement.derniereMaintenance).format("DD/MM/YYYY") : "N/A"]
      ];

      // Création du tableau
      autoTable(doc, {
        startY: 65,
        head: [["Champ", "Valeur"]],
        body: tableData,
        theme: "striped",
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [0, 153, 76], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [44, 62, 80] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { fontStyle: "bold", textColor: [34, 47, 62] } },
        margin: { left: 20, right: 20 },
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text("© OCP Group – Rapport confidentiel", 20, doc.internal.pageSize.height - 12);
        doc.text(`Page ${i} sur ${pageCount}`, 200, doc.internal.pageSize.height - 12, { align: "right" });
      }

      const fileName = `Rapport_Equipement_OCP_${equipement.numeroSerie}_${moment().format("YYYYMMDD_HHmmss")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      if (isMountedRef.current) {
        setError("Erreur lors de l'export PDF");
      }
    }
  };

  // Fonction d'export Excel pour un équipement individuel
  const exportEquipementToExcel = (equipement) => {
    try {
      const equipementData = {
        "ID Équipement": equipement.idEquipement || "N/A",
        "Numéro de série": equipement.numeroSerie || "N/A",
        "Type d'équipement": equipement.typeEquipement || "N/A",
        "Modèle": equipement.modele || "N/A",
        "Fabricant": equipement.fabricant || "N/A",
        "Statut": equipement.statut || "N/A",
        "Localisation": equipement.localisation || "N/A",
        "Date d'installation": equipement.dateInstallation ? moment(equipement.dateInstallation).format("DD/MM/YYYY") : "N/A",
        "Dernière maintenance": equipement.derniereMaintenance ? moment(equipement.derniereMaintenance).format("DD/MM/YYYY") : "N/A",
        "Date d'export": moment().format("DD/MM/YYYY HH:mm"),
        "Exporté par": "Système OCP",
      };

      const worksheet = XLSX.utils.json_to_sheet([equipementData]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Équipement OCP");

      const fileName = `OCP_Equipement_${equipement.numeroSerie}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      if (isMountedRef.current) {
        setError("Erreur lors de l'export Excel");
      }
    }
  };

  // Fonction d'export PDF pour tous les équipements
  const exportAllEquipementsToPDF = async () => {
    try {
      const doc = new jsPDF();

      // Ajout du logo OCP
      try {
        const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/d/d9/Ocp-group.png";
        doc.addImage(logoUrl, "PNG", 75, 10, 60, 20);
      } catch (logoError) {
        console.warn("Impossible de charger le logo:", logoError);
      }

      // Ligne de séparation
      doc.setDrawColor(0, 153, 76);
      doc.setLineWidth(1.2);
      doc.line(15, 35, 195, 35);

      // Titre principal
      doc.setFontSize(18);
      doc.setTextColor(34, 47, 62);
      doc.setFont("helvetica", "bold");
      doc.text("Liste des équipements OCP", 105, 45, { align: "center" });

      // Date de génération
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Généré le ${moment().format("DD/MM/YYYY à HH:mm")}`, 105, 53, { align: "center" });

      // Sous-titre
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.setFont("helvetica", "bold");
      doc.text("Rapport de gestion des équipements", 15, 65);

      // Statistiques
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Nombre total : ${filteredEquipements.length}`, 15, 72);

      // Données du tableau
      const tableData = filteredEquipements.map((equipement, index) => [
        `#${equipement.idEquipement || index + 1}`,
        equipement.numeroSerie || "N/A",
        equipement.typeEquipement || "N/A",
        equipement.modele || "N/A",
        equipement.fabricant || "N/A",
        equipement.statut || "N/A",
        equipement.localisation || "N/A"
      ]);

      // Création du tableau
      autoTable(doc, {
        startY: 80,
        head: [["ID", "N° Série", "Type", "Modèle", "Fabricant", "Statut", "Localisation"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [0, 153, 76], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
        bodyStyles: { fontSize: 9, textColor: [44, 62, 80] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { fontStyle: "bold", halign: "center" } },
        margin: { left: 15, right: 15 },
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 153, 76);
        doc.setLineWidth(0.5);
        doc.line(15, doc.internal.pageSize.height - 25, 195, doc.internal.pageSize.height - 25);

        doc.setFontSize(9);
        doc.setTextColor(127, 140, 141);
        doc.text("© OCP Group – Document confidentiel", 20, doc.internal.pageSize.height - 15);
        doc.text(`Page ${i} sur ${pageCount}`, 195, doc.internal.pageSize.height - 10, { align: "right" });
      }

      const fileName = `OCP_Equipements_List_${moment().format("YYYYMMDD_HHmmss")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      if (isMountedRef.current) {
        setError("Erreur lors de l'export PDF");
      }
    }
  };

  return (
    <div className="ocp-admin-app-container">
      {/* Header avec navbar OCP */}
      <header className={`ocp-admin-header ${scrolled ? 'ocp-admin-header-scrolled' : ''}`}>
        <div className="ocp-admin-navbar">
          <div className="ocp-admin-logo">
            <img src="https://ammoniaenergy.org/wp-content/uploads/2019/09/OCP_Group.svg.png" alt="Logo OCP" />
          </div>
          
          
          <div className="ocp-admin-search-icon">
            <i className="fa fa-search"></i>
          </div>
        </div>
      </header>

      {/* Hero Section inspirée des mines OCP */}
      <section className="ocp-admin-hero-section">
        <div className="ocp-admin-hero-content">
          <h1>Gestion des Équipements</h1>
          <p>Notre parc d'équipements industriels</p>
          <p className="ocp-admin-hero-description">
            Interface de gestion complète des équipements industriels OCP avec suivi des statuts, 
            maintenance et localisation pour une gestion optimale de notre infrastructure.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="ocp-admin-breadcrumb">
        <div className="ocp-admin-breadcrumb-content">
          <a href="#">Administration</a>
          <span>&gt;</span>
          <span className="ocp-admin-current">Gestion des équipements</span>
        </div>
      </div>

      {/* Messages de notification */}
      {successMessage && (
        <div className="ocp-admin-success-message ocp-admin-animate-slide-in">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="ocp-admin-error-message ocp-admin-animate-slide-in">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Contenu principal */}
      <div className="ocp-admin-main-content">
        <div className="ocp-admin-container">
          <div className="ocp-admin-title-section">
            <h2 className="ocp-admin-title">Liste des Équipements</h2>
            <div className="ocp-admin-title-actions">
              <button
                className="ocp-admin-btn ocp-admin-btn-secondary"
                onClick={exportAllEquipementsToPDF}
                disabled={loading || filteredEquipements.length === 0}
              >
                <i className="fas fa-file-pdf"></i>
                Exporter la liste
              </button>
              <button
                className="ocp-admin-btn ocp-admin-btn-primary"
                onClick={handleAdd}
                disabled={loading}
              >
                <i className="fas fa-plus"></i>
                Ajouter un équipement
              </button>
            </div>
          </div>

          {/* Barre de filtrage */}
          <div className="ocp-admin-search-section">
            <form onSubmit={handleSearchSubmit}>
              <div className="ocp-admin-search-filters">
                <div className="ocp-admin-filter-group">
                  <label>Champ de recherche</label>
                  <select name="searchField" value={searchParams.searchField} onChange={handleSearchChange}>
                    <option value="numeroSerie">Numéro de série</option>
                    <option value="modele">Modèle</option>
                    <option value="fabricant">Fabricant</option>
                  </select>
                </div>

                <div className="ocp-admin-filter-group">
                  <label>
                    {searchParams.searchField === 'numeroSerie' ? 'Rechercher par numéro de série' : 
                     searchParams.searchField === 'modele' ? 'Rechercher par modèle' : 'Rechercher par fabricant'}
                  </label>
                  <input
                    type="text"
                    name="searchValue"
                    value={searchParams.searchValue}
                    onChange={handleSearchChange}
                    placeholder={
                      searchParams.searchField === 'numeroSerie' ? 'Tapez le numéro de série...' :
                      searchParams.searchField === 'modele' ? 'Tapez le modèle...' : 'Tapez le fabricant...'
                    }
                  />
                </div>
              </div>

              <div className="ocp-admin-search-filters">
                <div className="ocp-admin-filter-group">
                  <label>Statut</label>
                  <select name="statut" value={searchParams.statut} onChange={handleSearchChange}>
                    <option value="">Tous les statuts</option>
                    {statutOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="ocp-admin-filter-group">
                  <label>Type d'équipement</label>
                  <select name="typeEquipement" value={searchParams.typeEquipement} onChange={handleSearchChange}>
                    <option value="">Tous les types</option>
                    {typeOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="ocp-admin-filter-group">
                  <label>Localisation</label>
                  <select name="localisation" value={searchParams.localisation} onChange={handleSearchChange}>
                    <option value="">Toutes les localisations</option>
                    {localisationOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ocp-admin-search-buttons">
                <button
                  type="button"
                  className="ocp-admin-btn ocp-admin-btn-secondary"
                  onClick={resetFilters}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i>
                  Réinitialiser
                </button>
                <button type="submit" className="ocp-admin-btn ocp-admin-btn-primary" disabled={loading}>
                  <i className="fas fa-search"></i>
                  Rechercher
                </button>
              </div>
            </form>
          </div>

          {/* Statistiques de filtrage */}
          <div className="ocp-admin-filter-stats">
            <p>
              <strong>{filteredEquipements.length}</strong> équipement{filteredEquipements.length > 1 ? 's' : ''} affiché{filteredEquipements.length > 1 ? 's' : ''} sur <strong>{equipements.length}</strong> au total
              {(searchParams.searchValue || searchParams.statut || searchParams.typeEquipement || searchParams.localisation) && (
                <span className="ocp-admin-filter-info">
                  (Filtres appliqués)
                </span>
              )}
            </p>
          </div>

          {/* Message de chargement */}
          {loading && (
            <div className="ocp-admin-loading-message">
              <div className="ocp-admin-loading-spinner"></div>
              <p>Chargement des données...</p>
            </div>
          )}

          {/* Message aucun résultat */}
          {!loading && filteredEquipements.length === 0 && equipements.length > 0 && (
            <div className="ocp-admin-no-results-message">
              <p>Aucun équipement trouvé pour les critères de recherche spécifiés.</p>
            </div>
          )}

          {/* Dialogue de confirmation de suppression */}
          {confirmDelete && (
            <div className="ocp-admin-modal-overlay">
              <div className="ocp-admin-modal ocp-admin-modal-confirm">
                <div className="ocp-admin-edit-form-header">
                  <h3>Confirmer la suppression</h3>
                  <button 
                    className="ocp-admin-btn-close" 
                    onClick={() => !isDeleting && setConfirmDelete(null)}
                    disabled={isDeleting}
                  >
                    ×
                  </button>
                </div>

                <div className="ocp-admin-modal-body">
                  <div className="ocp-admin-alert-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <p>Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.</p>
                </div>

                <div className="ocp-admin-form-buttons">
                  <button 
                    className="ocp-admin-btn-cancel" 
                    onClick={() => !isDeleting && setConfirmDelete(null)} 
                    disabled={isDeleting}
                  >
                    Annuler
                  </button>
                  <button
                    className="ocp-admin-btn ocp-admin-btn-delete"
                    onClick={confirmDeleteAction}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tableau des équipements style OCP */}
          {!loading && filteredEquipements.length > 0 && (
            <div className="ocp-admin-table-container ocp-admin-animate-slide-in">
              <table className="ocp-admin-styled-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Numéro de série</th>
                    <th>Type d'équipement</th>
                    <th>Modèle</th>
                    <th>Fabricant</th>
                    <th>Statut</th>
                    <th>Localisation</th>
                    <th>Actions</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipements.map((equipement) => (
                    <tr key={`equipement-${equipement.idEquipement}`}>
                      <td className="ocp-admin-number-cell">#{equipement.idEquipement}</td>
                      <td>
                        <div className="ocp-admin-equipment-info">
                          <div className="ocp-admin-avatar">
                            {equipement.typeEquipement?.charAt(0) || 'E'}
                          </div>
                          <strong>{equipement.numeroSerie}</strong>
                        </div>
                      </td>
                      <td>{equipement.typeEquipement}</td>
                      <td>{equipement.modele}</td>
                      <td>{equipement.fabricant}</td>
                      <td>
                        <span className={`ocp-admin-connection-status ${getStatutClass(equipement.statut)}`}>
                          {equipement.statut}
                        </span>
                      </td>
                      <td>{equipement.localisation}</td>
                      <td>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-edit"
                          onClick={() => handleEdit(equipement.idEquipement)}
                          disabled={loading}
                        >
                          <i className="fas fa-edit"></i>
                          Modifier
                        </button>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-delete"
                          onClick={() => handleDelete(equipement.idEquipement)}
                          disabled={loading}
                        >
                          <i className="fas fa-trash-alt"></i>
                          Supprimer
                        </button>
                        <Link 
                          to={`/equipements/${equipement.idEquipement}/interventions`} 
                          className="ocp-admin-btn ocp-admin-btn-export"
                        >
                          <i className="fas fa-tools"></i>
                          Interventions
                        </Link>
                      </td>
                      <td>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-export"
                          onClick={() => exportEquipementToPDF(equipement)}
                          disabled={loading}
                        >
                          <i className="fas fa-file-pdf"></i>
                          PDF
                        </button>
                        <button
                          className="ocp-admin-btn ocp-admin-btn-export"
                          onClick={() => exportEquipementToExcel(equipement)}
                          disabled={loading}
                        >
                          <i className="fas fa-file-excel"></i>
                          Excel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* État vide */}
          {!loading && filteredEquipements.length === 0 && equipements.length === 0 && (
            <div className="ocp-admin-empty-state">
              <i className="fas fa-cogs"></i>
              <p>Aucun équipement trouvé.</p>
              <button
                className="ocp-admin-btn ocp-admin-btn-primary"
                onClick={handleAdd}
              >
                Ajouter le premier équipement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer style OCP */}
      <footer className="ocp-admin-footer">
        <div className="ocp-admin-footer-content">
          <div className="ocp-admin-footer-logo">
            <img src="https://ammoniaenergy.org/wp-content/uploads/2019/09/OCP_Group.svg.png" alt="Logo OCP" />
          </div>
          <div className="ocp-admin-footer-links">
            
             
            <div className="ocp-admin-footer-column">
              <h4>Pages populaires</h4>
              <a href="#">Innovation</a>
              <a href="#">Qu'est-ce que le phosphate ?</a>
              <a href="#">Processus de customisation</a>
              <a href="#">Histoire</a>
              <a href="#">Mission et vision</a>
            </div>
            <div className="ocp-admin-footer-column">
              <h4>Stories</h4>
              <a href="#">Codification, créativité et liberté</a>
              <a href="#">Un sport, des milliers de vies changées transformées</a>
              <a href="#">Une nouvelle culture, un nouvel avenir</a>
            </div>
          </div>
        </div>
        <div className="ocp-admin-footer-bottom">
          <div className="ocp-admin-social-icons">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
          <div className="ocp-admin-copyright">
            <p>© OCP Group 2023</p>
            <a href="#">Fournisseurs</a>
            <a href="#">Mentions légales</a>
            <a href="#">Conditions d'utilisation</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
